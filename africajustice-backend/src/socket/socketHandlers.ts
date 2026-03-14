import { Server, Socket } from 'socket.io'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { setupLiveStreamHandlers } from './liveStream'
import { setupLiveStreamHandler } from './livestreamHandler'
import { getSocketServer } from './socketRegistry'
import { User } from '../models/User'

interface SocketUser {
  id: string
  role: string
  name: string
}

interface CustomSocket extends Socket {
  user?: SocketUser
}

const extractToken = (socket: CustomSocket): string | undefined => {
  const authToken = socket.handshake.auth && socket.handshake.auth.token
  if (authToken) {
    return authToken
  }

  const header = socket.handshake.headers
    ? socket.handshake.headers.authorization
    : undefined
  if (header && header.startsWith('Bearer ')) {
    return header.split(' ')[1]
  }

  return undefined
}

const attachUser = async (socket: CustomSocket): Promise<void> => {
  const token = extractToken(socket)
  if (!token) {
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '')
    if (typeof decoded === 'string') {
      return
    }
    const payload = decoded as JwtPayload & { id?: string }
    if (!payload.id) {
      return
    }
    const user = await User.findById(payload.id)
    if (!user) {
      return
    }

    socket.user = {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
    }

    // Join user's role-based room for notifications
    if (user.role === 'admin' || user.role === 'moderator') {
      socket.join('moderators')
    }
    socket.join(`user:${user._id}`)
  } catch (error) {
    socket.emit('error', { message: 'Socket authentication failed' })
    socket.disconnect(true)
  }
}

const registerSocketHandlers = (io: Server): void => {
  io.use(async (socket: CustomSocket, next) => {
    await attachUser(socket)
    return next()
  })

  io.on('connection', (socket: CustomSocket) => {
    socket.emit('socket:connected', {
      id: socket.id,
      user: socket.user || null,
    })

    setupLiveStreamHandlers(io, socket)

    socket.on('room:join', (room: string) => {
      if (room) {
        socket.join(room)
      }
    })

    socket.on('room:leave', (room: string) => {
      if (room) {
        socket.leave(room)
      }
    })

    socket.on('disconnect', () => {
      // User disconnected
    })
  })

  // Setup in-app livestream handler with WebSocket support
  setupLiveStreamHandler(io)
}

export { registerSocketHandlers, CustomSocket, SocketUser }
export const getIO = (): Server => {
  return getSocketServer()
}
