import { Router, type Request, type Response } from 'express'
import { prisma } from '../../lib/prisma'
import { requireAuth, type AuthedRequest } from '../../middleware/auth'
import { basicUser } from '../../lib/serialize'
import { crearNotificacion } from '../../lib/notificaciones'
import { userSelect } from '../../lib/tasks'

const router = Router()
router.use(requireAuth)

const invitationInclude = {
  tablero: {
    select: {
      id: true,
      nombre: true,
      color: true,
      esPrivado: true,
      creadoPor: { select: userSelect },
    },
  },
  creadoPor: { select: userSelect },
} as const

function serializeInvitation(i: {
  id: string
  rol: string
  estado: string
  createdAt: Date
  tablero: { id: string; nombre: string; color: string; esPrivado: boolean; creadoPor: unknown }
  creadoPor: unknown
}) {
  return {
    id: i.id,
    rol: i.rol,
    estado: i.estado,
    createdAt: i.createdAt.toISOString(),
    tablero: {
      id: i.tablero.id,
      nombre: i.tablero.nombre,
      color: i.tablero.color,
      esPrivado: i.tablero.esPrivado,
      creadoPor: basicUser(i.tablero.creadoPor as never),
    },
    creadoPor: basicUser(i.creadoPor as never),
  }
}

// GET /api/invitaciones — invitaciones pendientes del usuario
router.get('/', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const invites = await prisma.invitacion.findMany({
    where: { usuarioId: userId, estado: 'PENDIENTE' },
    orderBy: { createdAt: 'desc' },
    include: invitationInclude,
  })
  res.json({ invites: invites.map(serializeInvitation) })
})

// GET /api/invitaciones/enviadas — invitaciones pendientes que envié como admin
router.get('/enviadas', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const invites = await prisma.invitacion.findMany({
    where: { creadoPorId: userId, estado: 'PENDIENTE' },
    orderBy: { createdAt: 'desc' },
    include: {
      usuario: { select: userSelect },
      tablero: { select: { id: true, nombre: true, color: true } },
    },
  })
  res.json({
    invites: invites.map((i) => ({
      id: i.id,
      rol: i.rol,
      estado: i.estado,
      createdAt: i.createdAt.toISOString(),
      usuario: { ...basicUser(i.usuario), online: i.usuario.esOnline ?? false },
      tablero: {
        id: i.tablero.id,
        nombre: i.tablero.nombre,
        color: i.tablero.color,
      },
    })),
  })
})

// POST /api/invitaciones/:id/aceptar — aceptar y unirse al tablero
router.post('/:id/aceptar', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)

  const invite = await prisma.invitacion.findUnique({
    where: { id },
    include: {
      creadoPor: { select: userSelect },
      tablero: { select: { id: true, nombre: true, color: true } },
    },
  })
  if (!invite || invite.usuarioId !== userId) {
    res.status(404).json({ error: 'Invitación no encontrada' })
    return
  }
  if (invite.estado !== 'PENDIENTE') {
    res.status(400).json({ error: 'Esta invitación ya no está pendiente' })
    return
  }

  await prisma.$transaction(async (tx) => {
    await tx.invitacion.update({
      where: { id },
      data: { estado: 'ACEPTADA', respondidaAt: new Date() },
    })
    await tx.tableroMiembro
      .upsert({
        where: { tableroId_usuarioId: { tableroId: invite.tableroId, usuarioId: userId } },
        create: { tableroId: invite.tableroId, usuarioId: userId, rol: invite.rol },
        update: {},
      })
  })

  if (invite.creadoPorId !== userId) {
    const me = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { nombre: true, apellidos: true },
    })
    await crearNotificacion({
      usuarioId: invite.creadoPorId,
      tipo: 'INVITACION_ACEPTADA',
      titulo: `${me ? `${me.nombre} ${me.apellidos}`.trim() : 'Alguien'} aceptó tu invitación`,
      cuerpo: `Se unió al tablero «${invite.tablero.nombre}» como ${rolLabel(invite.rol)}.`,
      tableroId: invite.tableroId,
      invitacionId: invite.id,
    })
  }

  res.json({ ok: true })
})

// POST /api/invitaciones/:id/rechazar — rechazar invitación
router.post('/:id/rechazar', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)

  const invite = await prisma.invitacion.findUnique({
    where: { id },
    include: {
      creadoPor: { select: userSelect },
      tablero: { select: { id: true, nombre: true, color: true } },
    },
  })
  if (!invite || invite.usuarioId !== userId) {
    res.status(404).json({ error: 'Invitación no encontrada' })
    return
  }
  if (invite.estado !== 'PENDIENTE') {
    res.status(400).json({ error: 'Esta invitación ya no está pendiente' })
    return
  }

  await prisma.invitacion.update({
    where: { id },
    data: { estado: 'RECHAZADA', respondidaAt: new Date() },
  })

  if (invite.creadoPorId !== userId) {
    const me = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { nombre: true, apellidos: true },
    })
    await crearNotificacion({
      usuarioId: invite.creadoPorId,
      tipo: 'INVITACION_RECHAZADA',
      titulo: `${me ? `${me.nombre} ${me.apellidos}`.trim() : 'Alguien'} rechazó tu invitación`,
      cuerpo: `Declinó el tablero «${invite.tablero.nombre}».`,
      tableroId: invite.tableroId,
      invitacionId: invite.id,
    })
  }

  res.json({ ok: true })
})

function rolLabel(rol: string) {
  const labels: Record<string, string> = {
    ADMINISTRADOR: 'administradora',
    MIEMBRO: 'miembro',
    EDITOR: 'editora',
    LECTURA: 'solo lectura',
  }
  return labels[rol] ?? 'miembro'
}

export default router