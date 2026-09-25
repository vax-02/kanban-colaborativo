import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { verifyToken } from '../lib/jwt'

export type AuthedRequest = Request & { userId: string; email: string }

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined

  if (!token) {
    res.status(401).json({ error: 'No autorizado: falta el token' })
    return
  }

  try {
    const claims = verifyToken(token)
    const user = await prisma.usuario.findUnique({
      where: { id: claims.sub },
      select: { id: true, email: true, estado: true },
    })

    if (!user || user.estado !== 'ACTIVO') {
      res.status(401).json({ error: 'No autorizado: usuario no válido' })
      return
    }

    ;(req as AuthedRequest).userId = user.id
    ;(req as AuthedRequest).email = user.email
    next()
  } catch {
    res.status(401).json({ error: 'No autorizado: token expirado o inválido' })
  }
}