import { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { basicUser } from './serialize'
import { emitToUsers } from './socket'

export const userSelect = {
  id: true,
  nombre: true,
  apellidos: true,
  email: true,
  avatarColor: true,
  avatarUrl: true,
  esOnline: true,
  ultimoVistoAt: true,
} satisfies Prisma.UsuarioSelect

export const taskDetailInclude = {
  etiquetas: { include: { etiqueta: true } },
  asignaciones: {
    orderBy: { createdAt: 'asc' as const },
    include: { usuario: { select: userSelect } },
  },
  checklist: { orderBy: { posicion: 'asc' as const } },
} satisfies Prisma.TareaInclude

export type TaskDetailRow = Prisma.TareaGetPayload<{ include: typeof taskDetailInclude }>

export function memberDto(
  m: {
    usuario: Prisma.UsuarioGetPayload<{ select: typeof userSelect }>
    rol?: string
  },
  info?: { ingresoAt?: string | null; invitadoAt?: string | null },
) {
  return {
    ...basicUser(m.usuario),
    rol: m.rol ?? 'MIEMBRO',
    online: m.usuario.esOnline ?? false,
    ultimoVistoAt: m.usuario.ultimoVistoAt?.toISOString() ?? null,
    ingresoAt: info?.ingresoAt ?? null,
    invitadoAt: info?.invitadoAt ?? null,
  }
}

export function serializeTaskDetail(t: TaskDetailRow) {
  return {
    id: t.id,
    titulo: t.titulo,
    descripcion: t.descripcion,
    prioridad: t.prioridad,
    fechaVencimiento: t.fechaVencimiento?.toISOString() ?? null,
    posicion: t.posicion,
    createdAt: t.createdAt.toISOString(),
    etiquetas: t.etiquetas.map((e) => ({
      id: e.etiqueta.id,
      texto: e.etiqueta.texto,
      color: e.etiqueta.color,
    })),
    asignaciones: t.asignaciones.map((a) => memberDto(a)),
    checklist: t.checklist.map((c) => ({
      id: c.id,
      texto: c.texto,
      hecho: c.hecho,
      posicion: c.posicion,
    })),
  }
}

export async function isBoardMember(boardId: string, usuarioId: string) {
  return prisma.tableroMiembro.findUnique({
    where: { tableroId_usuarioId: { tableroId: boardId, usuarioId } },
  })
}

export async function notificarTareaCambiada(tableroId: string, usuarioId: string) {
  const miembros = await prisma.tableroMiembro.findMany({
    where: { tableroId },
    select: { usuarioId: true },
  })
  const ids = [...new Set([...miembros.map((m) => m.usuarioId), usuarioId])]
  await emitToUsers(ids, 'tarea:cambio', { tableroId })
}
