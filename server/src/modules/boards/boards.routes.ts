import { Prisma, type RolTablero } from '@prisma/client'
import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { basicUser } from '../../lib/serialize'
import {
  memberDto,
  serializeTaskDetail,
  taskDetailInclude,
  userSelect,
} from '../../lib/tasks'
import { prisma } from '../../lib/prisma'
import { requireAuth, type AuthedRequest } from '../../middleware/auth'
import { crearNotificacion } from '../../lib/notificaciones'
import { registrarActividad, serializeActividad } from '../../lib/actividades'
import { registrarIngreso, registrarSalida } from '../../lib/membresias'
import { emitToUsers } from '../../lib/socket'

const router = Router()
router.use(requireAuth)

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color no válido')

const createBoardSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150),
  descripcion: z.string().trim().max(255).nullable().optional(),
  color: hexColor.default('#6366f1'),
  plantilla: z.enum(['PROYECTO', 'SPRINT', 'TAREAS', 'VACIO']).default('PROYECTO'),
  esPrivado: z.boolean().default(false),
})

const updateBoardSchema = z.object({
  nombre: z.string().trim().min(2).max(150).optional(),
  descripcion: z.string().trim().max(255).nullable().optional(),
  color: hexColor.optional(),
  plantilla: z.enum(['PROYECTO', 'SPRINT', 'TAREAS', 'VACIO']).optional(),
  esPrivado: z.boolean().optional(),
})

const favoriteSchema = z.object({ esFavorito: z.boolean() })

const memberRolSchema = z.enum(['ADMINISTRADOR', 'MIEMBRO', 'EDITOR', 'LECTURA'])
const addMemberSchema = z.object({
  usuarioId: z.string().min(1),
  rol: memberRolSchema,
})
const updateMemberSchema = z.object({ rol: memberRolSchema })

const columnaSchema = z.object({
  titulo: z.string().trim().min(1, 'El nombre de la columna no puede estar vacío').max(100),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'El color debe ser un hexadecimal de 6 dígitos')
    .optional(),
})

const ordenColumnasSchema = z.object({ ids: z.array(z.string()).min(1) })
const sendInviteSchema = z.object({
  usuarioId: z.string().min(1).optional(),
  email: z.string().email().optional(),
  rol: memberRolSchema,
  mensaje: z.string().trim().max(500).optional(),
})

const DEFAULT_COLUMNS = [
  { titulo: 'Pendiente', color: '#94a3b8' },
  { titulo: 'En progreso', color: '#f59e0b' },
  { titulo: 'En revisión', color: '#0ea5e9' },
  { titulo: 'Terminado', color: '#10b981' },
]

function columnsFor(plantilla: string) {
  if (plantilla === 'VACIO') return [{ titulo: 'Pendiente', color: '#94a3b8' }]
  return DEFAULT_COLUMNS
}

const boardListInclude = {
  creadoPor: { select: userSelect },
  miembros: {
    orderBy: { createdAt: 'asc' as const },
    include: { usuario: { select: userSelect } },
  },
  favoritos: true,
  columnas: { include: { _count: { select: { tareas: true } } } },
} satisfies Prisma.TableroInclude

type BoardListRow = Prisma.TableroGetPayload<{ include: typeof boardListInclude }>

const boardDetailInclude = {
  creadoPor: { select: userSelect },
  favoritos: true,
  miembros: {
    orderBy: { createdAt: 'asc' as const },
    include: { usuario: { select: userSelect } },
  },
  etiquetas: true,
  invitaciones: {
    where: { estado: 'PENDIENTE' },
    include: {
      usuario: { select: userSelect },
      creadoPor: { select: userSelect },
    },
  },
  columnas: {
    orderBy: { posicion: 'asc' as const },
    include: {
      tareas: {
        orderBy: { posicion: 'asc' as const },
        include: taskDetailInclude,
      },
    },
  },
} satisfies Prisma.TableroInclude

type BoardDetailRow = Prisma.TableroGetPayload<{ include: typeof boardDetailInclude }>

function serializeBoardList(b: BoardListRow, usuarioId: string) {
  const tareas = b.columnas.reduce((acc, c) => acc + c._count.tareas, 0)
  const done = b.columnas
    .filter((c) => c.titulo.toUpperCase() === 'TERMINADO')
    .reduce((acc, c) => acc + c._count.tareas, 0)

  return {
    id: b.id,
    nombre: b.nombre,
    descripcion: b.descripcion,
    color: b.color,
    plantilla: b.plantilla,
    esPrivado: b.esPrivado,
    esFavorito: b.favoritos.some((f) => f.usuarioId === usuarioId),
    tareas,
    done,
    updatedAt: b.updatedAt.toISOString(),
    creadoPor: basicUser(b.creadoPor),
    miembros: b.miembros.map((m) => memberDto(m)),
  }
}

function nombreCompleto(u?: { nombre?: string; apellidos?: string } | null) {
  return u ? `${u.nombre} ${u.apellidos}`.trim() : 'Alguien'
}

type MembresiaRow = Prisma.MembresiaGetPayload<{
  include: { usuario: { select: typeof userSelect } }
}>

function serializeBoardDetail(
  b: BoardDetailRow,
  usuarioId: string,
  extras?: { membresias?: MembresiaRow[]; invitacionesAll?: { usuarioId: string; createdAt: Date }[] },
) {
  const membresias = extras?.membresias ?? []
  const invitadoMap = new Map<string, string>()
  for (const inv of extras?.invitacionesAll ?? []) {
    if (!invitadoMap.has(inv.usuarioId)) {
      invitadoMap.set(inv.usuarioId, inv.createdAt.toISOString())
    }
  }
  const activasByUser = new Map<string, MembresiaRow>()
  const historial: MembresiaRow[] = []
  for (const m of membresias) {
    if (m.salidaAt) {
      historial.push(m)
    } else if (!activasByUser.has(m.usuarioId)) {
      activasByUser.set(m.usuarioId, m)
    }
  }

  return {
    id: b.id,
    nombre: b.nombre,
    descripcion: b.descripcion,
    color: b.color,
    plantilla: b.plantilla,
    esPrivado: b.esPrivado,
    esFavorito: b.favoritos.some((f) => f.usuarioId === usuarioId),
    updatedAt: b.updatedAt.toISOString(),
    creadoPor: basicUser(b.creadoPor),
    miembros: b.miembros.map((m) =>
      memberDto(m, {
        ingresoAt: activasByUser.get(m.usuario.id)?.ingresoAt.toISOString() ?? null,
        invitadoAt: invitadoMap.get(m.usuario.id) ?? null,
      }),
    ),
    etiquetas: b.etiquetas.map((e) => ({
      id: e.id,
      texto: e.texto,
      color: e.color,
    })),
    invitaciones: b.invitaciones.map((inv) => ({
      id: inv.id,
      rol: inv.rol,
      usuario: memberDto({ usuario: inv.usuario, rol: inv.rol }),
      creadoPor: basicUser(inv.creadoPor),
      createdAt: inv.createdAt.toISOString(),
    })),
    columnas: b.columnas.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      color: c.color,
      posicion: c.posicion,
      tareas: c.tareas.map(serializeTaskDetail),
    })),
    historialMiembros: historial.map((m) => ({
      usuario: {
        ...basicUser(m.usuario),
        online: m.usuario.esOnline ?? false,
        ultimoVistoAt: m.usuario.ultimoVistoAt?.toISOString() ?? null,
      },
      rol: m.rol,
      ingresoAt: m.ingresoAt.toISOString(),
      salidaAt: m.salidaAt!.toISOString(),
    })),
  }
}

async function boardForUser(boardId: string, usuarioId: string) {
  return prisma.tablero.findFirst({
    where: { id: boardId, miembros: { some: { usuarioId } } },
    include: boardListInclude,
  })
}

async function isMember(boardId: string, usuarioId: string) {
  return prisma.tableroMiembro.findUnique({
    where: { tableroId_usuarioId: { tableroId: boardId, usuarioId } },
  })
}

async function editableMember(res: Response, boardId: string, usuarioId: string) {
  const member = await isMember(boardId, usuarioId)
  if (!member) {
    res.status(404).json({ error: 'Tablero no encontrado' })
    return null
  }
  if (member.rol === 'LECTURA') {
    res.status(403).json({ error: 'Tu rol no permite modificar las columnas' })
    return null
  }
  return member
}

async function notificarColumnasCambiadas(boardId: string, usuarioId: string) {
  const miembros = await prisma.tableroMiembro.findMany({
    where: { tableroId: boardId },
    select: { usuarioId: true },
  })
  const ids = [...new Set([...miembros.map((m) => m.usuarioId), usuarioId])]
  await emitToUsers(ids, 'columna:cambio', { tableroId: boardId })
}

// GET /api/boards — listar tableros del usuario logueado
router.get('/', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const boards = await prisma.tablero.findMany({
    where: { miembros: { some: { usuarioId: userId } } },
    orderBy: { updatedAt: 'desc' },
    include: boardListInclude,
  })
  res.json({ boards: boards.map((b) => serializeBoardList(b, userId)) })
})

// GET /api/boards/:id — detalle con columnas y tareas
router.get('/:id', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)
  const board = await prisma.tablero.findFirst({
    where: { id, miembros: { some: { usuarioId: userId } } },
    include: boardDetailInclude,
  })
  if (!board) {
    res.status(404).json({ error: 'Tablero no encontrado' })
    return
  }
  const [membresias, invitacionesAll] = await Promise.all([
    prisma.membresia.findMany({
      where: { tableroId: id },
      orderBy: { ingresoAt: 'asc' as const },
      include: { usuario: { select: userSelect } },
    }),
    prisma.invitacion.findMany({
      where: { tableroId: id },
      select: { usuarioId: true, createdAt: true },
      orderBy: { createdAt: 'asc' as const },
    }),
  ])
  res.json({
    board: serializeBoardDetail(board, userId, { membresias, invitacionesAll }),
  })
})

// GET /api/boards/:id/actividades — historial de actividades del tablero
router.get('/:id/actividades', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)
  const member = await isMember(id, userId)
  if (!member) {
    res.status(404).json({ error: 'Tablero no encontrado' })
    return
  }
  const actividades = await prisma.actividad.findMany({
    where: { tableroId: id },
    orderBy: { createdAt: 'desc' as const },
    take: 200,
    include: {
      autor: { select: userSelect },
      usuario: { select: userSelect },
    },
  })
  res.json({ actividades: actividades.map(serializeActividad) })
})

// POST /api/boards/:id/columnas — agregar columna al final del tablero
router.post('/:id/columnas', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)
  const member = await editableMember(res, id, userId)
  if (!member) return

  const parsed = columnaSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    return
  }

  const ultima = await prisma.columna.findFirst({
    where: { tableroId: id },
    orderBy: { posicion: 'desc' as const },
    select: { posicion: true },
  })
  const columna = await prisma.columna.create({
    data: {
      tableroId: id,
      titulo: parsed.data.titulo,
      color: parsed.data.color ?? '#94a3b8',
      posicion: (ultima?.posicion ?? -1) + 1,
    },
  })
  await notificarColumnasCambiadas(id, userId)
  res.status(201).json({ columna })
})

// PUT /api/boards/:id/columnas/orden — reordenar columnas (debe ir antes de :columnaId)
router.put('/:id/columnas/orden', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)
  const member = await editableMember(res, id, userId)
  if (!member) return

  const parsed = ordenColumnasSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Orden de columnas inválido' })
    return
  }

  const actuales = await prisma.columna.findMany({
    where: { tableroId: id },
    select: { id: true },
  })
  const actualesIds = new Set(actuales.map((c) => c.id))
  const ids = parsed.data.ids
  if (ids.length !== actualesIds.size || ids.some((cid) => !actualesIds.has(cid))) {
    res.status(400).json({ error: 'El orden debe incluir todas las columnas del tablero' })
    return
  }

  await prisma.$transaction(
    ids.map((cid, i) =>
      prisma.columna.update({ where: { id: cid }, data: { posicion: i } }),
    ),
  )
  await notificarColumnasCambiadas(id, userId)
  const columnas = await prisma.columna.findMany({
    where: { tableroId: id },
    orderBy: { posicion: 'asc' as const },
  })
  res.json({ columnas })
})

// PUT /api/boards/:id/columnas/:columnaId — renombrar o cambiar color
router.put('/:id/columnas/:columnaId', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)
  const columnaId = String(req.params.columnaId)
  const member = await editableMember(res, id, userId)
  if (!member) return

  const found = await prisma.columna.findFirst({
    where: { id: columnaId, tableroId: id },
  })
  if (!found) {
    res.status(404).json({ error: 'Columna no encontrada' })
    return
  }

  const parsed = columnaSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    return
  }
  if (parsed.data.titulo === undefined && parsed.data.color === undefined) {
    res.status(400).json({ error: 'Envía al menos el título o el color' })
    return
  }

  const columna = await prisma.columna.update({
    where: { id: columnaId },
    data: {
      ...(parsed.data.titulo !== undefined ? { titulo: parsed.data.titulo } : {}),
      ...(parsed.data.color !== undefined ? { color: parsed.data.color } : {}),
    },
  })
  await notificarColumnasCambiadas(id, userId)
  res.json({ columna })
})

// DELETE /api/boards/:id/columnas/:columnaId — eliminar columna
router.delete('/:id/columnas/:columnaId', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)
  const columnaId = String(req.params.columnaId)
  const member = await editableMember(res, id, userId)
  if (!member) return

  const found = await prisma.columna.findFirst({
    where: { id: columnaId, tableroId: id },
    include: { _count: { select: { tareas: true } } },
  })
  if (!found) {
    res.status(404).json({ error: 'Columna no encontrada' })
    return
  }

  const total = await prisma.columna.count({ where: { tableroId: id } })
  if (total <= 1) {
    res.status(400).json({ error: 'El tablero debe tener al menos una columna' })
    return
  }

  const moverA = typeof req.query.moverA === 'string' ? req.query.moverA : ''
  if (found._count.tareas > 0) {
    if (!moverA) {
      res.status(400).json({
        error: 'La columna tiene tareas. Indica a qué columna moverlas con ?moverA=',
        requiereDestino: true,
        tareas: found._count.tareas,
      })
      return
    }
    const destino = await prisma.columna.findFirst({
      where: { id: moverA, tableroId: id },
    })
    if (!destino) {
      res.status(400).json({ error: 'La columna destino no pertenece al tablero' })
      return
    }
    await prisma.$transaction(async (tx) => {
      const destinoTareas = await tx.tarea.count({ where: { columnaId: destino.id } })
      await tx.tarea.updateMany({
        where: { columnaId: found.id },
        data: { columnaId: destino.id, posicion: destinoTareas },
      })
      await tx.columna.delete({ where: { id: found.id } })
      await tx.columna.updateMany({
        where: { tableroId: id, posicion: { gt: found.posicion } },
        data: { posicion: { decrement: 1 } },
      })
    })
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.columna.delete({ where: { id: found.id } })
      await tx.columna.updateMany({
        where: { tableroId: id, posicion: { gt: found.posicion } },
        data: { posicion: { decrement: 1 } },
      })
    })
  }

  await notificarColumnasCambiadas(id, userId)
  res.status(204).end()
})

// POST /api/boards — crear tablero (creador como Administrador y columnas iniciales)
router.post('/', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const parsed = createBoardSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    return
  }
  const { nombre, descripcion, color, plantilla, esPrivado } = parsed.data

  const created = await prisma.$transaction(async (tx) => {
    const nuevo = await tx.tablero.create({
      data: {
        nombre,
        descripcion: descripcion ?? null,
        color,
        plantilla,
        esPrivado,
        creadoPorId: userId,
      },
    })

    await tx.tableroMiembro.create({
      data: { tableroId: nuevo.id, usuarioId: userId, rol: 'ADMINISTRADOR' },
    })

    const contenedores = columnsFor(plantilla)
    await Promise.all(
      contenedores.map((c, i) =>
        tx.columna.create({
          data: { tableroId: nuevo.id, titulo: c.titulo, color: c.color, posicion: i },
        }),
      ),
    )

    return nuevo
  })

  await registrarIngreso(created.id, userId, 'ADMINISTRADOR')
  await registrarActividad({
    tableroId: created.id,
    autorId: userId,
    tipo: 'TABLERO_CREADO',
    detalle: `Creó el tablero «${nombre}»`,
  })

  const board = await boardForUser(created.id, userId)
  res.status(201).json({ board: board ? serializeBoardList(board, userId) : null })
})

// PUT /api/boards/:id — actualizar datos (no permite rol LECTURA)
router.put('/:id', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)
  const member = await isMember(id, userId)
  if (!member) {
    res.status(404).json({ error: 'Tablero no encontrado' })
    return
  }
  if (member.rol === 'LECTURA') {
    res.status(403).json({ error: 'Tu rol no permite editar este tablero' })
    return
  }

  const parsed = updateBoardSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    return
  }

  const data: Prisma.TableroUpdateInput = {}
  if (parsed.data.nombre !== undefined) data.nombre = parsed.data.nombre
  if (parsed.data.descripcion !== undefined) data.descripcion = parsed.data.descripcion
  if (parsed.data.color !== undefined) data.color = parsed.data.color
  if (parsed.data.plantilla !== undefined) data.plantilla = parsed.data.plantilla
  if (parsed.data.esPrivado !== undefined) data.esPrivado = parsed.data.esPrivado

  const updated = await prisma.tablero.update({
    where: { id },
    data,
    include: boardListInclude,
  })
  res.json({ board: serializeBoardList(updated, userId) })
})

// PUT /api/boards/:id/favorite — marcar/desmarcar favorito (por usuario)
router.put('/:id/favorite', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)
  const member = await isMember(id, userId)
  if (!member) {
    res.status(404).json({ error: 'Tablero no encontrado' })
    return
  }

  const parsed = favoriteSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Falta el campo esFavorito' })
    return
  }

  if (parsed.data.esFavorito) {
    await prisma.favoritoTablero.upsert({
      where: { tableroId_usuarioId: { tableroId: id, usuarioId: userId } },
      create: { tableroId: id, usuarioId: userId },
      update: {},
    })
  } else {
    await prisma.favoritoTablero
      .delete({ where: { tableroId_usuarioId: { tableroId: id, usuarioId: userId } } })
      .catch(() => undefined)
  }

  res.json({ board: { id, esFavorito: parsed.data.esFavorito } })
})

async function requireAdmin(res: Response, boardId: string, usuarioId: string) {
  const member = await isMember(boardId, usuarioId)
  if (!member) {
    res.status(404).json({ error: 'Tablero no encontrado' })
    return null
  }
  if (member.rol !== 'ADMINISTRADOR') {
    res.status(403).json({ error: 'Solo el administrador puede gestionar miembros' })
    return null
  }
  return member
}

async function adminCount(boardId: string) {
  return prisma.tableroMiembro.count({
    where: { tableroId: boardId, rol: 'ADMINISTRADOR' },
  })
}

// POST /api/boards/:id/members — añadir un usuario existente con un rol
router.post('/:id/members', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)
  const admin = await requireAdmin(res, id, userId)
  if (!admin) return

  const parsed = addMemberSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    return
  }

  const exists = await prisma.usuario.findUnique({
    where: { id: parsed.data.usuarioId },
    select: { id: true },
  })
  if (!exists) {
    res.status(404).json({ error: 'Usuario no encontrado' })
    return
  }

  const alreadyMember = await isMember(id, parsed.data.usuarioId)
  const row = await prisma.tableroMiembro.upsert({
    where: { tableroId_usuarioId: { tableroId: id, usuarioId: parsed.data.usuarioId } },
    create: { tableroId: id, usuarioId: parsed.data.usuarioId, rol: parsed.data.rol },
    update: { rol: parsed.data.rol },
    include: { usuario: { select: userSelect } },
  })
  if (!alreadyMember) {
    await registrarIngreso(id, parsed.data.usuarioId, parsed.data.rol)
    const target = await prisma.usuario.findUnique({
      where: { id: parsed.data.usuarioId },
      select: { nombre: true, apellidos: true },
    })
    await registrarActividad({
      tableroId: id,
      autorId: userId,
      tipo: 'MIEMBRO_UNIDO',
      usuarioId: parsed.data.usuarioId,
      detalle: `Añadió a ${nombreCompleto(target)} al tablero`,
    })
  }
  res.status(201).json({ member: memberDto(row) })
})

// PUT /api/boards/:id/members/:usuarioId — cambiar el rol de un miembro
router.put('/:id/members/:usuarioId', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)
  const targetId = String(req.params.usuarioId)
  const admin = await requireAdmin(res, id, userId)
  if (!admin) return

  const parsed = updateMemberSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    return
  }

  const target = await isMember(id, targetId)
  if (!target) {
    res.status(404).json({ error: 'El usuario no es miembro de este tablero' })
    return
  }

  if (parsed.data.rol !== 'ADMINISTRADOR' && target.rol === 'ADMINISTRADOR') {
    const admins = await adminCount(id)
    if (admins <= 1) {
      res.status(400).json({ error: 'No se puede quitar el único administrador' })
      return
    }
  }

  const row = await prisma.tableroMiembro.update({
    where: { tableroId_usuarioId: { tableroId: id, usuarioId: targetId } },
    data: { rol: parsed.data.rol },
    include: { usuario: { select: userSelect } },
  })
  await registrarIngreso(id, targetId, parsed.data.rol)
  res.json({ member: memberDto(row) })
})

// DELETE /api/boards/:id/members/:usuarioId — quitar un miembro
router.delete('/:id/members/:usuarioId', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)
  const targetId = String(req.params.usuarioId)
  const admin = await requireAdmin(res, id, userId)
  if (!admin) return

  const target = await isMember(id, targetId)
  if (!target) {
    res.status(404).json({ error: 'El usuario no es miembro de este tablero' })
    return
  }

  const board = await prisma.tablero.findUnique({
    where: { id },
    select: { creadoPorId: true },
  })
  if (board?.creadoPorId === targetId) {
    res.status(400).json({ error: 'El creador del tablero no se puede quitar' })
    return
  }

  if (target.rol === 'ADMINISTRADOR') {
    const admins = await adminCount(id)
    if (admins <= 1) {
      res.status(400).json({ error: 'No se puede quitar el único administrador' })
      return
    }
  }

  await prisma.tableroMiembro.delete({
    where: { tableroId_usuarioId: { tableroId: id, usuarioId: targetId } },
  })
  await registrarSalida(id, targetId)
  const targetUser = await prisma.usuario.findUnique({
    where: { id: targetId },
    select: { nombre: true, apellidos: true },
  })
  await registrarActividad({
    tableroId: id,
    autorId: userId,
    tipo: 'MIEMBRO_REMOVIDO',
    usuarioId: targetId,
    detalle: `Quitó a ${nombreCompleto(targetUser)} del tablero`,
  })
  res.status(204).end()
})

// POST /api/boards/:id/invitaciones — invitar a un usuario registrado (solo admin)
router.post('/:id/invitaciones', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)
  const admin = await requireAdmin(res, id, userId)
  if (!admin) return

  const parsed = sendInviteSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    return
  }
  const { usuarioId, email, rol, mensaje } = parsed.data

  const usuarioid = usuarioId ?? null
  if (!usuarioid && email) {
    const byEmail = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, estado: true },
    })
    if (!byEmail) {
      res.status(404).json({ error: 'No existe un usuario registrado con ese correo' })
      return
    }
    const targetUsuarioId = byEmail.id
    await inviteUser(res, id, userId, targetUsuarioId, rol, mensaje ?? null)
    return
  }

  await inviteUser(res, id, userId, usuarioid ?? '', rol, mensaje ?? null)
})

async function inviteUser(
  res: Response,
  id: string,
  userId: string,
  usuarioId: string,
  rol: RolTablero,
  mensaje: string | null,
) {
  const target = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, estado: true, nombre: true, apellidos: true },
  })
  if (!target || target.estado !== 'ACTIVO') {
    res.status(404).json({ error: 'Usuario no encontrado' })
    return
  }
  if (usuarioId === userId) {
    res.status(400).json({ error: 'No puedes invitarte a ti mismo' })
    return
  }

  const alreadyMember = await prisma.tableroMiembro.findUnique({
    where: { tableroId_usuarioId: { tableroId: id, usuarioId } },
  })
  if (alreadyMember) {
    res.status(400).json({ error: 'El usuario ya es miembro de este tablero' })
    return
  }

  const existing = await prisma.invitacion.findUnique({
    where: { tableroId_usuarioId: { tableroId: id, usuarioId } },
  })
  if (existing?.estado === 'PENDIENTE') {
    res.status(400).json({ error: 'Ya existe una invitación pendiente para este usuario' })
    return
  }

  const invitacion = await prisma.invitacion.upsert({
    where: { tableroId_usuarioId: { tableroId: id, usuarioId } },
    create: { tableroId: id, usuarioId, creadoPorId: userId, rol, mensaje: mensaje },
    update: { estado: 'PENDIENTE', respondidaAt: null, rol, mensaje, creadoPorId: userId },
  })

  const board = await prisma.tablero.findUnique({
    where: { id },
    select: { id: true, nombre: true },
  })
  await crearNotificacion({
    usuarioId,
    tipo: 'INVITACION',
    titulo: `Te invitaron a «${board?.nombre ?? 'un tablero'}»`,
    cuerpo: `Se te invitó para colaborar en el tablero.`,
    tableroId: id,
    invitacionId: invitacion.id,
  })
  await registrarActividad({
    tableroId: id,
    autorId: userId,
    tipo: 'MIEMBRO_INVITADO',
    usuarioId,
    detalle: `Invitó a ${nombreCompleto(target)} al tablero`,
  })

  res.status(201).json({ invitacion })
}

// PUT /api/boards/:id/invitaciones/:usuarioId — cambiar el rol de una invitación pendiente
router.put(
  '/:id/invitaciones/:usuarioId',
  async (req: Request, res: Response) => {
    const { userId } = req as AuthedRequest
    const id = String(req.params.id)
    const usuarioId = String(req.params.usuarioId)
    const admin = await requireAdmin(res, id, userId)
    if (!admin) return

    const parsed = updateMemberSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Rol no válido' })
      return
    }

    const invite = await prisma.invitacion.findUnique({
      where: { tableroId_usuarioId: { tableroId: id, usuarioId } },
    })
    if (!invite) {
      res.status(404).json({ error: 'No existe una invitación para este usuario' })
      return
    }
    if (invite.estado !== 'PENDIENTE') {
      res.status(400).json({ error: 'Solo se puede cambiar el rol de una invitación pendiente' })
      return
    }

    const invitacion = await prisma.invitacion.update({
      where: { id: invite.id },
      data: { rol: parsed.data.rol },
    })
    res.json({ invitacion })
  },
)

// DELETE /api/boards/:id/invitaciones/:usuarioId — cancelar invitación pendiente (solo admin)
router.delete(
  '/:id/invitaciones/:usuarioId',
  async (req: Request, res: Response) => {
    const { userId } = req as AuthedRequest
    const id = String(req.params.id)
    const usuarioId = String(req.params.usuarioId)
    const admin = await requireAdmin(res, id, userId)
    if (!admin) return

    const invite = await prisma.invitacion.findUnique({
      where: { tableroId_usuarioId: { tableroId: id, usuarioId } },
    })
    if (!invite) {
      res.status(404).json({ error: 'No existe una invitación para este usuario' })
      return
    }
    if (invite.estado !== 'PENDIENTE') {
      res.status(400).json({ error: 'Solo se puede cancelar una invitación pendiente' })
      return
    }
    await prisma.invitacion.delete({ where: { id: invite.id } })
    res.status(204).end()
  },
)

// DELETE /api/boards/:id — eliminar (solo el dueño/creador del tablero)
router.delete('/:id', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)
  const board = await prisma.tablero.findUnique({
    where: { id },
    select: { id: true, creadoPorId: true },
  })
  if (!board) {
    res.status(404).json({ error: 'Tablero no encontrado' })
    return
  }
  if (board.creadoPorId !== userId) {
    res.status(403).json({ error: 'Solo el dueño del tablero puede eliminarlo' })
    return
  }

  await prisma.tablero.delete({ where: { id } })
  res.status(204).end()
})

export default router