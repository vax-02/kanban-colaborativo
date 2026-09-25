import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { Router, type Request, type Response } from 'express'
import { prisma } from '../../lib/prisma'
import { signToken } from '../../lib/jwt'
import { AVATAR_COLORS } from '../../config'
import { requireAuth, type AuthedRequest } from '../../middleware/auth'

const registerSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre es obligatorio'),
  apellidos: z.string().trim().min(2, 'Los apellidos son obligatorios'),
  email: z.string().trim().email('Correo electrónico no válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

const loginSchema = z.object({
  email: z.string().trim().email('Correo electrónico no válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

const userPublic = {
  id: true,
  nombre: true,
  apellidos: true,
  email: true,
  avatarColor: true,
  avatarUrl: true,
  bio: true,
  estado: true,
  esOnline: true,
  ultimoVistoAt: true,
  createdAt: true,
}

export function safeUser(u: {
  id: string
  nombre: string
  apellidos: string
  email: string
  avatarColor: string
  avatarUrl: string | null
  bio: string | null
  estado: string
  esOnline: boolean
  ultimoVistoAt: Date | null
  createdAt: Date
}) {
  return {
    id: u.id,
    nombre: u.nombre,
    apellidos: u.apellidos,
    email: u.email,
    avatarColor: u.avatarColor,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    estado: u.estado,
    esOnline: u.esOnline,
    ultimoVistoAt: u.ultimoVistoAt,
    iniciales: `${u.nombre[0]}${u.apellidos[0]}`.toUpperCase(),
  }
}

const router = Router()

router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    return
  }

  const { nombre, apellidos, email, password } = parsed.data

  const exists = await prisma.usuario.findUnique({ where: { email } })
  if (exists) {
    res.status(409).json({ error: 'Ya existe una cuenta con ese correo' })
    return
  }

  // Color determinista del avatar según el correo.
  const seed = [...email].reduce((acc, c) => acc + c.charCodeAt(0), 0)

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.usuario.create({
    data: {
      id: randomUUID(),
      nombre,
      apellidos,
      email,
      passwordHash,
      avatarColor: AVATAR_COLORS[seed % AVATAR_COLORS.length],
    },
  })

  const token = signToken(user)
  res.status(201).json({ token, user: safeUser(user) })
})

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    return
  }

  const { email, password } = parsed.data

  const user = await prisma.usuario.findUnique({ where: { email } })
  if (!user) {
    res.status(401).json({ error: 'Correo o contraseña incorrectos' })
    return
  }

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    res.status(401).json({ error: 'Correo o contraseña incorrectos' })
    return
  }

  if (user.estado === 'INACTIVO') {
    res.status(403).json({ error: 'La cuenta está desactivada' })
    return
  }

  await prisma.usuario.update({
    where: { id: user.id },
    data: { esOnline: true, ultimoVistoAt: new Date() },
  })

  const token = signToken(user)
  res.json({ token, user: safeUser(user) })
})

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: userPublic,
  })
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' })
    return
  }
  res.json({ user: safeUser(user) })
})

export default router