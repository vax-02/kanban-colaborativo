import type { Server as HttpServer } from 'http'
import { Server, type Socket } from 'socket.io'
import { config } from '../config'
import { verifyToken } from './jwt'
import { prisma } from './prisma'

let io: Server | null = null

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: config.clientOrigin, credentials: true },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined
    if (!token) return next(new Error('No autorizado'))
    try {
      const claims = verifyToken(token)
      socket.data.userId = claims.sub
      next()
    } catch {
      next(new Error('Token inválido'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string
    socket.join(`user:${userId}`)

    void prisma.usuario
      .update({
        where: { id: userId },
        data: { esOnline: true, ultimoVistoAt: new Date() },
      })
      .catch(() => undefined)

    io?.emit('user:presence', { userId, online: true })

    socket.on(
      'chat:typing',
      ({ to, conversationId }: { to: string; conversationId: string }) => {
        socket.to(`user:${to}`).emit('chat:typing', {
          from: userId,
          conversationId,
        })
      },
    )

    socket.on('disconnect', async () => {
      const sockets = await io?.fetchSockets().catch(() => [])
      const stillConnected = (sockets ?? []).some(
        (s) => s.id !== socket.id && s.data.userId === userId,
      )
      if (!stillConnected) {
        await prisma.usuario
          .update({
            where: { id: userId },
            data: { esOnline: false, ultimoVistoAt: new Date() },
          })
          .catch(() => undefined)
        io?.emit('user:presence', { userId, online: false })
      }
    })
  })

  return io
}

export function getIO() {
  return io
}

export async function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload)
}

export async function emitToUsers(userIds: string[], event: string, payload: unknown) {
  for (const id of userIds) await emitToUser(id, event, payload)
}