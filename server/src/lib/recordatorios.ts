import { prisma } from './prisma'
import { crearNotificacion } from './notificaciones'

const VENTANA_MS = 24 * 60 * 60 * 1000

async function barridoVencimientos() {
  try {
    const ahora = new Date()
    const limite = new Date(ahora.getTime() + VENTANA_MS)

    const items = await prisma.tareaAsignacion.findMany({
      where: {
        tarea: {
          fechaVencimiento: { not: null },
          NOT: { columna: { esFinalizada: true } },
        },
      },
      select: {
        usuarioId: true,
        tarea: {
          select: {
            id: true,
            titulo: true,
            fechaVencimiento: true,
            columna: { select: { tableroId: true } },
          },
        },
      },
      take: 200,
    })

    const vistos = new Set<string>()
    for (const item of items) {
      const vence = item.tarea.fechaVencimiento
      if (!vence) continue
      const ms = vence.getTime()
      if (ms < ahora.getTime() || ms > limite.getTime()) continue

      const clave = `${item.usuarioId}:/${item.tarea.id}`
      if (vistos.has(clave)) continue
      vistos.add(clave)

      const yaEnviada = await prisma.notificacion.findFirst({
        where: {
          usuarioId: item.usuarioId,
          tareaId: item.tarea.id,
          tipo: 'TAREA_POR_VENCER',
        },
        select: { id: true },
      })
      if (yaEnviada) continue

      await crearNotificacion({
        usuarioId: item.usuarioId,
        tipo: 'TAREA_POR_VENCER',
        titulo: 'Vence pronto',
        cuerpo: `«${item.tarea.titulo}» vence en menos de 24 horas`,
        tableroId: item.tarea.columna.tableroId,
        tareaId: item.tarea.id,
      })
    }
  } catch {
    // sin notificaciones si falla el barrido; se reintenta en la siguiente pasada
  }
}

export function iniciarBarridoVencimientos(cada: number = 30 * 60 * 1000) {
  void barridoVencimientos()
  const timer = setInterval(() => void barridoVencimientos(), cada)
  timer.unref?.()
  return timer
}