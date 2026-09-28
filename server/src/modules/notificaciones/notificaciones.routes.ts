import { Router, type Request, type Response } from 'express'
import { prisma } from '../../lib/prisma'
import { requireAuth, type AuthedRequest } from '../../middleware/auth'
import { notificacionInclude, serializeNotificacion } from '../../lib/notificaciones'

const router = Router()
router.use(requireAuth)

// GET /api/notificaciones — listar notificaciones del usuario
router.get('/', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const notificaciones = await prisma.notificacion.findMany({
    where: { usuarioId: userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: notificacionInclude,
  })
  res.json({ notificaciones: notificaciones.map(serializeNotificacion) })
})

// PUT /api/notificaciones/:id/leer — marcar como leída
router.put('/:id/leer', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  const id = String(req.params.id)

  await prisma.notificacion
    .updateMany({
      where: { id, usuarioId: userId },
      data: { leida: true },
    })
    .catch(() => undefined)

  res.json({ ok: true })
})

// PUT /api/notificaciones/leidas — marcar todas como leídas
router.put('/leidas', async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest
  await prisma.notificacion.updateMany({
    where: { usuarioId: userId, leida: false },
    data: { leida: true },
  })
  res.json({ ok: true })
})

export default router