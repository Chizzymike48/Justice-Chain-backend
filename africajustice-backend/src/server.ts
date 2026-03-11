import http from 'http'
import { Server, Socket } from 'socket.io'
import { createClient, RedisClientType } from 'redis'
import { createAdapter } from '@socket.io/redis-adapter'
import app from './app'
import { registerSocketHandlers } from './socket/socketHandlers'
import { setSocketServer } from './socket/socketRegistry'

const PORT = process.env.PORT || 5000
const socketAllowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000']

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: socketAllowedOrigins,
    credentials: true,
  },
})

setSocketServer(io)

registerSocketHandlers(io)

interface SocketAdapterClients {
  pubClient: any
  subClient: any
}

const setupSocketAdapter = async (): Promise<SocketAdapterClients | null> => {
  const adapterSetting = process.env.SOCKET_REDIS_ADAPTER?.trim()
  if (!adapterSetting || adapterSetting === 'false') {
    return null
  }

  const redisUrl = adapterSetting === 'true'
    ? process.env.REDIS_URL?.trim()
    : adapterSetting

  const host = process.env.REDIS_HOST || 'localhost'
  const port = parseInt(process.env.REDIS_PORT || '6379', 10)
  const password = process.env.REDIS_PASSWORD || undefined

  const clientOptions = redisUrl
    ? { url: redisUrl, socket: { connectTimeout: 5000 }, ...(password ? { password } : {}) }
    : { socket: { host, port, connectTimeout: 5000 }, ...(password ? { password } : {}) }

  const pubClient: any = createClient(clientOptions)
  const subClient: any = pubClient.duplicate()

  try {
    // Connect with timeout
    await Promise.race([
      Promise.all([pubClient.connect(), subClient.connect()]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Socket adapter Redis connection timeout')), 5000)
      ),
    ])
    io.adapter(createAdapter(pubClient, subClient))

    return { pubClient, subClient }
  } catch (error) {
    // Clean up on error
    try {
      await pubClient.quit()
      await subClient.quit()
    } catch {
      // Ignore cleanup errors
    }
    throw error
  }
}

let socketAdapterClients: SocketAdapterClients | null = null
setupSocketAdapter()
  .then((clients) => {
    socketAdapterClients = clients
  })
  .catch((error) => {
    console.warn('Socket adapter setup failed, continuing without it')
    console.warn((error as Error).message)
  })

server.listen(PORT, () => {
  console.log(
    `dYs? Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  )
  console.log(`dY"­ API URL: http://localhost:${PORT}`)
})

process.on('unhandledRejection', (err) => {
  const error = err as Error
  console.error('ƒ?O Unhandled Rejection:', error.message)
  io.close(() => {
    server.close(() => process.exit(1))
  })
})

process.on('SIGTERM', () => {
  console.log('dY`< SIGTERM received, shutting down gracefully')
  io.close(async () => {
    if (socketAdapterClients) {
      await Promise.all([
        socketAdapterClients.pubClient.quit(),
        socketAdapterClients.subClient.quit(),
      ])
    }

    server.close(() => {
      console.log('ƒo. Process terminated')
    })
  })
})

process.on('SIGINT', () => {
  console.log('dY`< SIGINT received, shutting down gracefully')
  io.close(async () => {
    if (socketAdapterClients) {
      await Promise.all([
        socketAdapterClients.pubClient.quit(),
        socketAdapterClients.subClient.quit(),
      ])
    }

    server.close(() => {
      console.log('ƒo. Process terminated')
    })
  })
})

export default server
