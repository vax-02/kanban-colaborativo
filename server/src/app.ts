import express from 'express'
import cors from 'cors'
import authRoutes from './modules/auth/auth.routes'
import boardsRoutes from './modules/boards/boards.routes'
import tasksRoutes from './modules/tasks/tasks.routes'
import usersRoutes from './modules/users/users.routes'
import invitacionesRoutes from './modules/invitaciones/invitaciones.routes'
import chatRoutes from './modules/chat/chat.routes'
import notificacionesRoutes from './modules/notificaciones/notificaciones.routes'
import { config } from './config'
import initializePassport from './modules/auth/passport'
import passport from 'passport'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true,
    }),
  )
  app.use(express.json())

  // Inicializar Passport (usamos sesión falsa, solo para el flujo de OAuth)
  app.use(passport.initialize())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', ts: new Date().toISOString() })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/boards', boardsRoutes)
  app.use('/api/tasks', tasksRoutes)
  app.use('/api/users', usersRoutes)
  app.use('/api/invitaciones', invitacionesRoutes)
  app.use('/api/chat', chatRoutes)
  app.use('/api/notificaciones', notificacionesRoutes)

  app.use((_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' })
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  })

  return app
}