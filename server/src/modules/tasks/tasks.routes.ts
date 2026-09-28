import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import {
  isBoardMember,
  notificarTareaCambiada,
  serializeTaskDetail,
  taskDetailInclude,
} from '../../lib/tasks'
import { requireAuth, type AuthedRequest } from '../../middleware/auth'
import { registrarActividad } from '../../lib/actividades'

const router = Router()
router.use(requireAuth)

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color no válido')
const prioridad = z.enum(['ALTA', 'MEDIA', 'BAJA'])
const isoDate = z
  .string()
  .datetime()
  .transform((v) => new Date(v))
  .nullable()
  .optional()

const labelSchema = z.object({
  texto: z.string().trim().min(1, 'El texto de la etiqueta es obligatorio').max(50),
  color: hexColor,
})

const createTaskSchema = z.object({
  columnaId: z.string().min(1),
  titulo: z.string().trim().min(1, 'El título es obligatorio').max(255),
  descripcion: z.string().trim().nullable().optional(),
  prioridad: prioridad.default('MEDIA'),
  fechaVencimiento: isoDate,
  etiquetas: z.array(labelSchema).default([]),
  asignados: z.array(z.string()).default([]),
  checklist: z.array(z.string().min(1, 'El ítem no puede estar vacío').max(200)).default([]),
})

const updateTaskSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es obligatorio').max(255).optional(),
  descripcion: z.string().trim().nullable().optional(),
  prioridad: prioridad.optional(),
  fechaVencimiento: isoDate,
  columnaId: z.string().min(1).optional(),
  posicion: z.number().int().nonnegative().optional(),
  orden: z.array(z.string().min(1)).optional(),
  etiquetas: z.array(labelSchema).optional(),
  asignados: z.array(z.string()).optional(),
  checklist: z
    .array(
      z.object({
        texto: z.string().trim().min(1).max(200),
        hecho: z.boolean().optional(),
      }),
    )
    .optional(),
})

async function taskWithBoard(id: string) {
  return prisma.tarea.findUnique({
    where: { id },
    include: { columna: { select: { id: true, tableroId: true, titulo: true } } },
  })
}

function prioridadLabel(p: string) {
  return { ALTA: 'alta', MEDIA: 'media', BAJA: 'baja' }[p] ?? p.toLowerCase()
}

async function ensureEtiquetas(
  tx: { etiqueta: { upsert(args: never): Promise<unknown> } },
  tableroId: string,
  etiquetas: { texto: string; color: string }[],
) {
  const ids: string[] = []
  for (const l of etiquetas) {
    const etiqueta = await tx.etiqueta.upsert({
      where: { tableroId_texto: { tableroId, texto: l.texto } },
      create: { tableroId, texto: l.texto, color: l.color },
      update: {},
    } as never)
    ids.push((etiqueta as { id: string }).id)
  }
  return ids
}

async function getTaskDetail(id: string) {
  return prisma.tarea.findUnique({
    where: { id },
    include: taskDetailInclude,
  })
}

// POST /api/tasks — crear tarjeta en una columna del tablero
router.post('/', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const parsed = createTaskSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    return
  }
  const { columnaId, titulo, descripcion, prioridad: prioridadSel, fechaVencimiento, etiquetas, asignados, checklist } = parsed.data

  const columna = await prisma.columna.findUnique({ where: { id: columnaId } })
  if (!columna) {
    res.status(404).json({ error: 'Columna no encontrada' })
    return
  }
  const member = await isBoardMember(columna.tableroId, userId)
  if (!member || member.rol === 'LECTURA') {
    res.status(403).json({ error: 'No tienes permiso para crear tarjetas aquí' })
    return
  }

  const id = await prisma.$transaction(async (tx) => {
    const posicion = await tx.tarea.count({ where: { columnaId } })

    const tarea = await tx.tarea.create({
      data: {
        columnaId,
        creadoPorId: userId,
        titulo,
        descripcion: descripcion ?? null,
        prioridad: prioridadSel,
        fechaVencimiento: fechaVencimiento ?? null,
        posicion,
      },
    })

    const etiquetaIds = await ensureEtiquetas(tx, columna.tableroId, etiquetas)
    for (const etiquetaId of etiquetaIds) {
      await tx.tareaEtiqueta.create({ data: { tareaId: tarea.id, etiquetaId } })
    }

    for (const usuarioId of asignados) {
      await tx.tareaAsignacion
        .create({ data: { tareaId: tarea.id, usuarioId } })
        .catch(() => undefined)
    }

    await Promise.all(
      checklist.map((texto, i) =>
        tx.checklistItem.create({ data: { tareaId: tarea.id, texto, posicion: i, hecho: false } }),
      ),
    )

    return tarea.id
  })

  const task = await getTaskDetail(id)
  await notificarTareaCambiada(columna.tableroId, userId)
  await registrarActividad({
    tableroId: columna.tableroId,
    autorId: userId,
    tipo: 'TAREA_CREADA',
    tareaId: id,
    detalle: `Creó la tarjeta «${titulo}» en ${columna.titulo}`,
  })
  res.status(201).json({ task: task ? serializeTaskDetail(task) : null })
})

// GET /api/tasks/mine — conteo de tareas asignadas al usuario
router.get('/mine', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const asignaciones = await prisma.tareaAsignacion.findMany({
    where: { usuarioId: userId },
    select: { tarea: { select: { columna: { select: { titulo: true } } } } },
  })
  const total = asignaciones.length
  const pendientes = asignaciones.filter(
    (a) => a.tarea.columna.titulo.toUpperCase() !== 'TERMINADO',
  ).length
  res.json({ total, pendientes })
})

// GET /api/tasks/:id — detalle de una tarjeta
router.get('/:id', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)
  const found = await taskWithBoard(id)
  if (!found) {
    res.status(404).json({ error: 'Tarea no encontrada' })
    return
  }
  const member = await isBoardMember(found.columna.tableroId, userId)
  if (!member) {
    res.status(403).json({ error: 'No tienes acceso a este tablero' })
    return
  }
  const task = await getTaskDetail(id)
  res.json({ task: task ? serializeTaskDetail(task) : null })
})

// PUT /api/tasks/:id — actualizar tarjeta (contenido, columna, etiquetas, asignados, checklist)
router.put('/:id', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)
  const found = await taskWithBoard(id)
  if (!found) {
    res.status(404).json({ error: 'Tarea no encontrada' })
    return
  }
  const member = await isBoardMember(found.columna.tableroId, userId)
  if (!member || member.rol === 'LECTURA') {
    res.status(403).json({ error: 'Tu rol no permite editar esta tarjeta' })
    return
  }

  const parsed = updateTaskSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    return
  }
  const {
    titulo,
    descripcion,
    prioridad: prioridadSel,
    fechaVencimiento,
    columnaId,
    posicion,
    orden,
    etiquetas,
    asignados,
    checklist,
  } = parsed.data

  let tableroId = found.columna.tableroId
  let nuevaColumna = found.columna.id
  let tituloDestino: string | null = null

  if (columnaId && columnaId !== found.columna.id) {
    const destino = await prisma.columna.findUnique({ where: { id: columnaId } })
    if (!destino) {
      res.status(404).json({ error: 'Columna de destino no encontrada' })
      return
    }
    const memberDestino = await isBoardMember(destino.tableroId, userId)
    if (!memberDestino) {
      res.status(403).json({ error: 'No tienes permiso en ese tablero' })
      return
    }
    tableroId = destino.tableroId
    nuevaColumna = destino.id
    tituloDestino = destino.titulo

    if (posicion === undefined) {
      const count = await prisma.tarea.count({ where: { columnaId: nuevaColumna } })
      await prisma.tarea.update({ where: { id }, data: { columnaId: nuevaColumna, posicion: count } })
    }
  }

  const data: Record<string, unknown> = {}
  if (titulo !== undefined) data.titulo = titulo
  if (descripcion !== undefined) data.descripcion = descripcion
  if (prioridadSel !== undefined) data.prioridad = prioridadSel
  if (fechaVencimiento !== undefined) data.fechaVencimiento = fechaVencimiento
  if (columnaId) data.columnaId = nuevaColumna
  if (posicion !== undefined) data.posicion = posicion

  if (titulo !== undefined || descripcion !== undefined || prioridadSel !== undefined || fechaVencimiento !== undefined || columnaId !== undefined || posicion !== undefined) {
    await prisma.tarea.update({ where: { id }, data: data as never })
  }

  await prisma.$transaction(async (tx) => {
    if (etiquetas !== undefined) {
      await tx.tareaEtiqueta.deleteMany({ where: { tareaId: id } })
      const etiquetaIds = await ensureEtiquetas(tx, tableroId, etiquetas)
      for (const etiquetaId of etiquetaIds) {
        await tx.tareaEtiqueta.create({ data: { tareaId: id, etiquetaId } })
      }
    }

    if (asignados !== undefined) {
      await tx.tareaAsignacion.deleteMany({ where: { tareaId: id } })
      const uniq = [...new Set(asignados)]
      for (const usuarioId of uniq) {
        await tx.tareaAsignacion
          .create({ data: { tareaId: id, usuarioId } })
          .catch(() => undefined)
      }
    }

    if (checklist !== undefined) {
      await tx.checklistItem.deleteMany({ where: { tareaId: id } })
      await Promise.all(
        checklist.map((c, i) =>
          tx.checklistItem.create({
            data: { tareaId: id, texto: c.texto, hecho: c.hecho ?? false, posicion: i },
          }),
        ),
      )
    }
  })

  if (columnaId && orden !== undefined) {
    await prisma.$transaction(
      orden.map((taskId, index) =>
        prisma.tarea.update({
          where: { id: taskId },
          data: { posicion: index },
        }),
      ),
    )
  }

  const task = await getTaskDetail(id)
  await notificarTareaCambiada(tableroId, userId)

  if (prioridadSel !== undefined && prioridadSel !== found.prioridad) {
    await registrarActividad({
      tableroId,
      autorId: userId,
      tipo: 'PRIORIDAD_CAMBIADA',
      tareaId: id,
      de: found.prioridad,
      a: prioridadSel,
      detalle: `Cambió la prioridad de «${found.titulo}» a ${prioridadLabel(prioridadSel)}`,
    })
  }
  if (tituloDestino) {
    await registrarActividad({
      tableroId,
      autorId: userId,
      tipo: 'TAREA_MOVIDA',
      tareaId: id,
      de: found.columna.titulo,
      a: tituloDestino,
      detalle: `Movió «${found.titulo}» a ${tituloDestino}`,
    })
  }

  res.json({ task: task ? serializeTaskDetail(task) : null })
})

// DELETE /api/tasks/:id — eliminar tarjeta
router.delete('/:id', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)
  const found = await taskWithBoard(id)
  if (!found) {
    res.status(404).json({ error: 'Tarea no encontrada' })
    return
  }
  const member = await isBoardMember(found.columna.tableroId, userId)
  if (!member || member.rol === 'LECTURA') {
    res.status(403).json({ error: 'Tu rol no permite eliminar esta tarjeta' })
    return
  }

  await prisma.tarea.delete({ where: { id } })
  await notificarTareaCambiada(found.columna.tableroId, userId)
  await registrarActividad({
    tableroId: found.columna.tableroId,
    autorId: userId,
    tipo: 'TAREA_ELIMINADA',
    detalle: `Eliminó la tarjeta «${found.titulo}»`,
  })
  res.status(204).end()
})

export default router