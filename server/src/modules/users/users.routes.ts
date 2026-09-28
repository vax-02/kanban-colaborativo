import { Router, type Request, type Response } from 'express'
import { prisma } from '../../lib/prisma'
import { requireAuth } from '../../middleware/auth'
import { basicUser } from '../../lib/serialize'
import { userSelect } from '../../lib/tasks'

const router = Router()
router.use(requireAuth)

// GET /api/users?buscar=... — buscar usuarios existentes para invitar a un tablero
router.get('/', async (req: Request, res: Response) => {
  const buscar = String(req.query.buscar ?? '').trim().toLowerCase()

  const where =
    buscar.length > 0
      ? {
          estado: 'ACTIVO' as const,
          OR: [
            { email: { contains: buscar } },
            { nombre: { contains: buscar } },
            { apellidos: { contains: buscar } },
          ],
        }
      : { estado: 'ACTIVO' as const }

  const users = await prisma.usuario.findMany({
    where,
    orderBy: { nombre: 'asc' },
    take: 20,
    select: userSelect,
  })
  res.json({
    users: users.map((u) => ({ ...basicUser(u), online: u.esOnline ?? false })),
  })
})

export default router