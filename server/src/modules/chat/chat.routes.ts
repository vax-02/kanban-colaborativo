import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { requireAuth, type AuthedRequest } from '../../middleware/auth'
import { emitToUser } from '../../lib/socket'
import type { Prisma } from '@prisma/client'

const router = Router()
router.use(requireAuth)

const textoSchema = z
  .string()
  .trim()
  .min(1, 'El mensaje no puede estar vacío')
  .max(4000, 'El mensaje es demasiado largo')

const createConversationSchema = z.object({
  usuarioId: z.string().min(1),
})

const createMessageSchema = z.object({
  texto: textoSchema,
})

const contactSelect = {
  id: true,
  nombre: true,
  apellidos: true,
  email: true,
  avatarColor: true,
  avatarUrl: true,
  esOnline: true,
  ultimoVistoAt: true,
} satisfies Prisma.UsuarioSelect

function contactDto(u: {
  id: string
  nombre: string
  apellidos: string
  email: string
  avatarColor: string
  avatarUrl: string | null
  esOnline: boolean
  ultimoVistoAt: Date | null
}) {
  return {
    id: u.id,
    nombre: u.nombre,
    apellidos: u.apellidos,
    email: u.email,
    avatarColor: u.avatarColor,
    avatarUrl: u.avatarUrl,
    iniciales: `${u.nombre[0]}${u.apellidos[0]}`.toUpperCase(),
    online: u.esOnline,
    ultimoVistoAt: u.ultimoVistoAt?.toISOString() ?? null,
  }
}

const messageSelect = {
  id: true,
  conversacionId: true,
  autorId: true,
  texto: true,
  leidoAt: true,
  createdAt: true,
} satisfies Prisma.MensajeSelect

function messageDto(m: {
  id: string
  conversacionId: string
  autorId: string
  texto: string
  leidoAt: Date | null
  createdAt: Date
}) {
  return {
    id: m.id,
    conversacionId: m.conversacionId,
    autorId: m.autorId,
    texto: m.texto,
    leidoAt: m.leidoAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
  }
}

async function getBoardIds(usuarioId: string): Promise<string[]> {
  const rows = await prisma.tableroMiembro.findMany({
    where: { usuarioId },
    select: { tableroId: true },
  })
  return rows.map((r) => r.tableroId)
}

async function isParticipant(conversacionId: string, usuarioId: string) {
  return prisma.conversacionParticipante.findFirst({
    where: { conversacionId, usuarioId },
  })
}

// GET /api/chat/contacts — compañeros con los que compartes tablero
router.get('/contacts', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const boardIds = await getBoardIds(userId)
  if (boardIds.length === 0) {
    res.json({ contacts: [] })
    return
  }

  const members = await prisma.tableroMiembro.findMany({
    where: { tableroId: { in: boardIds }, usuarioId: { not: userId } },
    distinct: ['usuarioId'],
    select: { usuario: { select: contactSelect } },
  })

  const contacts = members
    .map((m) => contactDto(m.usuario))
    .sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1
      return `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`)
    })

  res.json({ contacts })
})

// POST /api/chat/conversations — obtener o crear la conversación 1:1
router.post('/conversations', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const parsed = createConversationSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    return
  }
  const { usuarioId } = parsed.data
  if (usuarioId === userId) {
    res.status(400).json({ error: 'No puedes chatear contigo mismo' })
    return
  }

  const boardIds = await getBoardIds(userId)
  const shared = await prisma.tableroMiembro.findFirst({
    where: {
      tableroId: { in: boardIds },
      usuarioId,
      usuario: { estado: 'ACTIVO' },
    },
  })
  if (!shared) {
    res.status(403).json({ error: 'Solo puedes chatear con compañeros de tablero' })
    return
  }

  const existing = await prisma.conversacion.findFirst({
    where: {
      AND: [
        { participantes: { some: { usuarioId: userId } } },
        { participantes: { some: { usuarioId } } },
      ],
    },
    include: { participantes: { include: { usuario: { select: contactSelect } } } },
  })
  const existingDm =
    existing && existing.participantes.length === 2 ? existing : null

  const conversation =
    existingDm ??
    (await prisma.conversacion.create({
      data: {
        creadoPorId: userId,
        participantes: {
          create: [{ usuarioId }, { usuarioId: userId }],
        },
      },
      include: { participantes: { include: { usuario: { select: contactSelect } } } },
    }))

  const participante = conversation.participantes.find((p) => p.usuarioId !== userId)
  res.status(existingDm ? 200 : 201).json({
    conversation: {
      id: conversation.id,
      participante: participante ? contactDto(participante.usuario) : null,
      lastMessage: null,
      unread: 0,
      updatedAt: conversation.updatedAt.toISOString(),
    },
  })
})

// GET /api/chat/conversations — lista mis conversaciones con último mensaje y no leídos
router.get('/conversations', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest

  const conversations = await prisma.conversacion.findMany({
    where: { participantes: { some: { usuarioId: userId } } },
    orderBy: { updatedAt: 'desc' },
    include: {
      participantes: { include: { usuario: { select: contactSelect } } },
      mensajes: { orderBy: { createdAt: 'desc' as const }, take: 1 },
    },
  })

  const ids = conversations.map((c) => c.id)
  const unreadRows =
    ids.length > 0
      ? await prisma.mensaje.groupBy({
          by: ['conversacionId'],
          where: {
            conversacionId: { in: ids },
            autorId: { not: userId },
            leidoAt: null,
          },
          _count: { _all: true },
        })
      : []

  const unreadMap = new Map(unreadRows.map((r) => [r.conversacionId, r._count._all]))

  const list = conversations.map((c) => {
    const participante = c.participantes.find((p) => p.usuarioId !== userId)
    return {
      id: c.id,
      participante: participante ? contactDto(participante.usuario) : null,
      lastMessage: c.mensajes[0] ? messageDto(c.mensajes[0]) : null,
      unread: unreadMap.get(c.id) ?? 0,
      updatedAt: c.updatedAt.toISOString(),
    }
  })

  res.json({ conversations: list })
})

// GET /api/chat/conversations/:id/messages — historial (últimos 50)
router.get('/conversations/:id/messages', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)
  if (!(await isParticipant(id, userId))) {
    res.status(403).json({ error: 'No tienes acceso a esta conversación' })
    return
  }

  const rows = await prisma.mensaje.findMany({
    where: { conversacionId: id },
    orderBy: { createdAt: 'desc' as const },
    take: 50,
  })

  res.json({ messages: rows.reverse().map(messageDto) })
})

// POST /api/chat/conversations/:id/messages — enviar mensaje
router.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)
  const parsed = createMessageSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    return
  }

  const conversation = await prisma.conversacion.findFirst({
    where: {
      id,
      participantes: { some: { usuarioId: userId } },
    },
    include: { participantes: { select: { usuarioId: true } } },
  })
  if (!conversation) {
    res.status(403).json({ error: 'No tienes acceso a esta conversación' })
    return
  }

  const message = await prisma.mensaje.create({
    data: {
      conversacionId: id,
      autorId: userId,
      texto: parsed.data.texto,
    },
  })

  await prisma.conversacion.update({
    where: { id },
    data: { updatedAt: new Date() },
  })

  const serialized = messageDto(message)
  const recipients = conversation.participantes.map((p) => p.usuarioId)
  for (const recipient of recipients) {
    await emitToUser(recipient, 'chat:message', serialized)
  }

  res.status(201).json({ message: serialized })
})

// PUT /api/chat/conversations/:id/read — marcar mensajes recibidos como leídos
router.put('/conversations/:id/read', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)

  const conversation = await prisma.conversacion.findFirst({
    where: {
      id,
      participantes: { some: { usuarioId: userId } },
    },
    include: { participantes: { select: { usuarioId: true } } },
  })
  if (!conversation) {
    res.status(403).json({ error: 'No tienes acceso a esta conversación' })
    return
  }

  await prisma.mensaje.updateMany({
    where: { conversacionId: id, autorId: { not: userId }, leidoAt: null },
    data: { leidoAt: new Date() },
  })

  const other = conversation.participantes.find((p) => p.usuarioId !== userId)
  if (other) {
    await emitToUser(other.usuarioId, 'chat:read', {
      conversationId: id,
      userId,
      leidoAt: new Date().toISOString(),
    })
  }

  res.json({ ok: true })
})

export default router