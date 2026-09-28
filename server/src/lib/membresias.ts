import type { RolTablero } from '@prisma/client'
import { prisma } from './prisma'

export async function registrarIngreso(
  tableroId: string,
  usuarioId: string,
  rol: RolTablero,
) {
  const activa = await prisma.membresia.findFirst({
    where: { tableroId, usuarioId, salidaAt: null },
  })
  if (activa) {
    if (activa.rol !== rol) {
      await prisma.membresia.update({
        where: { id: activa.id },
        data: { rol },
      })
    }
    return activa
  }
  return prisma.membresia.create({
    data: { tableroId, usuarioId, rol, ingresoAt: new Date() },
  })
}

export async function registrarSalida(tableroId: string, usuarioId: string) {
  const activa = await prisma.membresia.findFirst({
    where: { tableroId, usuarioId, salidaAt: null },
  })
  if (activa) {
    await prisma.membresia.update({
      where: { id: activa.id },
      data: { salidaAt: new Date() },
    })
  }
}