import { Router, type Request, type Response } from 'express'
import { prisma } from '../../lib/prisma'
import { requireAuth, type AuthedRequest } from '../../middleware/auth'
import { basicUser } from '../../lib/serialize'
import { userSelect } from '../../lib/tasks'

const router = Router()
router.use(requireAuth)

// GET /api/users — listar usuarios existentes para añadir a un tablero
router.get('/', async (_req: Request, res: Response) => {
  const { userId } = _req as AuthedRequest
  const users = await prisma.usuario.findMany({
    where: { estado: 'ACTIVO' },
    orderBy: { nombre: 'asc' },
    select: userSelect,
  })
  res.json({
    users: users.map((u) => ({ ...basicUser(u), online: u.esOnline ?? false })),
  })
})

export default router