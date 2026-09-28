import type { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { getIO } from './socket'
import { basicUser } from './serialize'
import { userSelect } from './tasks'

const notificacionInclude = {
  tablero: { select: { id: true, nombre: true, color: true } },
  invitacion: {
    include: {
      creadoPor: { select: userSelect },
      tablero: { select: { id: true, nombre: true, color: true } },
    },
  },
} satisfies Prisma.NotificacionInclude

export type NotificacionRow = Prisma.NotificacionGetPayload<{
  include: typeof notificacionInclude
}>

export function serializeNotificacion(n: NotificacionRow) {
  return {
    id: n.id,
    tipo: n.tipo,
    titulo: n.titulo,
    cuerpo: n.cuerpo,
    leida: n.leida,
    createdAt: n.createdAt.toISOString(),
    tablero: n.tablero
      ? { id: n.tablero.id, nombre: n.tablero.nombre, color: n.tablero.color }
      : null,
    invitacion: n.invitacion
      ? {
          id: n.invitacion.id,
          rol: n.invitacion.rol,
          estado: n.invitacion.estado,
          creadoPor: basicUser(n.invitacion.creadoPor),
          tablero: n.invitacion.tablero
            ? {
                id: n.invitacion.tablero.id,
                nombre: n.invitacion.tablero.nombre,
                color: n.invitacion.tablero.color,
              }
            : null,
        }
      : null,
  }
}

export async function crearNotificacion(input: {
  usuarioId: string
  tipo: 'INVITACION' | 'INVITACION_ACEPTADA' | 'INVITACION_RECHAZADA'
  titulo: string
  cuerpo?: string | null
  tableroId?: string | null
  invitacionId?: string | null
}) {
  const notificacion = await prisma.notificacion.create({
    data: {
      usuarioId: input.usuarioId,
      tipo: input.tipo,
      titulo: input.titulo,
      cuerpo: input.cuerpo ?? null,
      tableroId: input.tableroId ?? null,
      invitacionId: input.invitacionId ?? null,
    },
    include: notificacionInclude,
  })

  const payload = serializeNotificacion(notificacion)
  getIO()?.to(`user:${input.usuarioId}`).emit('notificacion:nueva', payload)
  return payload
}

export { notificacionInclude }