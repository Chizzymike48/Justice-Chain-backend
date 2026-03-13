import { Server, Socket } from 'socket.io'
import livestreamService from '../services/livestreamService'
import { LiveStream } from '../models/LiveStream'
import { verifyToken } from '../middleware/auth'

interface AuthSocket extends Socket {
  userId?: string
  streamId?: string
}

const coerceChunkBuffer = (payload: unknown): Buffer | null => {
  const raw = (payload as { data?: unknown } | undefined)?.data ?? payload
  if (!raw) return null
  if (Buffer.isBuffer(raw)) return raw
  if (raw instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(raw))
  }
  if (ArrayBuffer.isView(raw)) {
    return Buffer.from(raw.buffer)
  }
  if (typeof raw === 'object' && raw && (raw as { type?: string; data?: unknown }).type === 'Buffer') {
    const data = (raw as { data?: unknown }).data
    if (Array.isArray(data)) {
      return Buffer.from(data)
    }
  }
  return null
}

export const setupLiveStreamHandler = (io: Server): void => {
  const livestreamNamespace = io.of('/livestream')

  livestreamNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]
      const streamId = socket.handshake.query.streamId as string

      if (!streamId) {
        return next(new Error('Stream ID is required'))
      }

      if (!token) {
        return next(new Error('Authentication token is required'))
      }

      // Verify token and extract user
      const decoded = verifyToken(token)
      if (!decoded) {
        return next(new Error('Invalid token'))
      }

      const authSocket = socket as AuthSocket
      authSocket.userId = decoded.id
      authSocket.streamId = streamId

      // Log that user joined
      console.log(`User ${decoded.id} joined stream ${streamId}`)
      next()
    } catch (error) {
      console.error('Livestream auth error:', error)
      next(new Error('Authentication failed'))
    }
  })

  livestreamNamespace.on('connection', (socket: AuthSocket) => {
    const streamId = socket.streamId
    const userId = socket.userId

    if (!streamId || !userId) {
      socket.disconnect()
      return
    }

    // Get or create stream session
    const session = livestreamService.getStreamSession(streamId)
    if (!session) {
      socket.emit('error', 'Stream not found')
      socket.disconnect()
      return
    }

    // Join room
    socket.join(`stream-${streamId}`)

    // Add viewer to stream
    livestreamService.addViewer(streamId, socket as any)

    // Send initial viewer count
    socket.emit('viewer-count', {
      count: livestreamService.getViewerCount(streamId),
    })

    // Broadcast to stream that new viewer joined
    livestreamNamespace.to(`stream-${streamId}`).emit('viewer-joined', {
      totalViewers: livestreamService.getViewerCount(streamId),
    })

    // Handle stream chunks (from broadcaster)
    socket.on('stream-chunk', (data) => {
      if (session.userId === userId && session.status === 'active') {
        // Only the broadcaster can send stream chunks
        const chunkBuffer = coerceChunkBuffer(data)
        if (chunkBuffer) {
          livestreamService.recordStreamChunk(streamId, chunkBuffer)
        }
        livestreamNamespace.to(`stream-${streamId}`).emit('stream-chunk', data)
      }
    })

    // Handle chat messages
    socket.on('chat-message', async (message: { text: string; username?: string }) => {
      try {
        const chatMessage = {
          userId,
          username: message.username || 'Anonymous',
          text: message.text,
          timestamp: new Date(),
          streamId,
        }

        // Broadcast to all viewers in the stream
        livestreamNamespace.to(`stream-${streamId}`).emit('chat-message', chatMessage)

        // Optional: Save chat message to database
        console.log(`Chat message on stream ${streamId}:`, chatMessage)
      } catch (error) {
        console.error('Chat message error:', error)
      }
    })

    // Handle stream status updates
    socket.on('stream-status', async (data: { status: 'initializing' | 'active' | 'stopped' }) => {
      if (session.userId === userId) {
        livestreamService.updateStreamStatus(streamId, (data.status === 'initializing' ? 'active' : data.status) as 'active' | 'stopped')

        // Update database
        try {
          await LiveStream.findOneAndUpdate({ streamId }, { status: data.status })
        } catch (error) {
          console.error('Failed to update stream status in DB:', error)
        }

        // Notify all viewers
        livestreamNamespace.to(`stream-${streamId}`).emit('stream-status-changed', {
          status: data.status,
        })
      }
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      livestreamService.removeViewer(streamId, socket as any)

      // If streamer disconnects, end the stream
      if (session.userId === userId) {
        livestreamService.updateStreamStatus(streamId, 'stopped')
        livestreamNamespace.to(`stream-${streamId}`).emit('stream-ended')
        console.log(`Streamer ${userId} disconnected from stream ${streamId}`)
      } else {
        // Notify remaining viewers
        livestreamNamespace.to(`stream-${streamId}`).emit('viewer-left', {
          totalViewers: livestreamService.getViewerCount(streamId),
        })
      }

      console.log(`User ${userId} left stream ${streamId}`)
    })

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error on stream ${streamId}:`, error)
    })
  })
}

export default setupLiveStreamHandler
