import { createServer } from 'http'
import { createApp } from './app'
import { config } from './config'
import { prisma } from './lib/prisma'
import { initSocket } from './lib/socket'

const app = createApp()
const httpServer = createServer(app)
initSocket(httpServer)

async function main() {
  await prisma.$connect()
  httpServer.listen(config.port, () => {
    console.log(`API escuchando en http://localhost:${config.port}`)
  })
}

main().catch((err) => {
  console.error('No se pudo iniciar el servidor:', err)
  process.exit(1)
})