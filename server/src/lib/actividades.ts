import type { Prisma, TipoActividad } from '@prisma/client'
import { prisma } from './prisma'
import { basicUser } from './serialize'
import { userSelect } from './tasks'

export const actividadInclude = {
  autor: { select: userSelect },
  usuario: { select: userSelect },
} satisfies Prisma.ActividadInclude

type ActividadRow = Prisma.ActividadGetPayload<{ include: typeof actividadInclude }>

export function serializeActividad(a: ActividadRow) {
  return {
    id: a.id,
    tipo: a.tipo,
    detalle: a.detalle,
    de: a.de,
    a: a.a,
    tareaId: a.tareaId,
    createdAt: a.createdAt.toISOString(),
    autor: a.autor ? basicUser(a.autor) : null,
    usuario: a.usuario
      ? {
          ...basicUser(a.usuario),
          online: a.usuario.esOnline ?? false,
          ultimoVistoAt: a.usuario.ultimoVistoAt?.toISOString() ?? null,
        }
      : null,
  }
}

export async function registrarActividad(input: {
  tableroId: string
  autorId?: string
  tipo: TipoActividad
  tareaId?: string
  usuarioId?: string
  detalle?: string
  de?: string
  a?: string
}) {
  const actividad = await prisma.actividad.create({
    data: {
      tableroId: input.tableroId,
      autorId: input.autorId ?? null,
      tipo: input.tipo,
      tareaId: input.tareaId ?? null,
      usuarioId: input.usuarioId ?? null,
      detalle: input.detalle ?? null,
      de: input.de ?? null,
      a: input.a ?? null,
    },
    include: actividadInclude,
  })
  return serializeActividad(actividad)
}