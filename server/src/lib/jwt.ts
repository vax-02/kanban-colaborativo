import jwt from 'jsonwebtoken'
import { JWT_EXPIRES_IN, config } from '../config'
import type { Usuario } from '@prisma/client'

export type UserClaims = {
  sub: string
  email: string
}

export function signToken(user: Pick<Usuario, 'id' | 'email'>): string {
  return jwt.sign({ email: user.email }, config.jwtSecret, {
    subject: user.id,
    expiresIn: JWT_EXPIRES_IN,
  })
}

export function verifyToken(token: string): UserClaims {
  const payload = jwt.verify(token, config.jwtSecret)
  if (typeof payload === 'string' || !payload.sub) {
    throw new Error('Token inválido')
  }
  return { sub: payload.sub, email: payload.email as string }
}