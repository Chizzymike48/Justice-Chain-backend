// LiveStream Socket handlers
import { Server, Socket } from 'socket.io'

interface ChatMessage {
  id: string
  streamId: string
  username: string
  message: string
  timestamp: number
  role?: string
}

export const setupLiveStreamHandlers = (io: Server, socket: Socket): void => {
  // Handle livestream start
  socket.on('livestream:start', (data) => {
    io.emit('livestream:started', data)
  })

  // Handle livestream end
  socket.on('livestream:end', (data) => {
    io.emit('livestream:ended', data)
  })

  // Handle joining a livestream room
  socket.on('livestream:join', (data: { streamId: string; caseId?: string; userId?: string; username?: string }) => {
    const roomId = `stream_${data.streamId}`
    socket.join(roomId)

    // Notify others that someone joined
    io.to(roomId).emit('livestream:user_joined', {
      username: data.username || 'Anonymous',
      timestamp: Date.now(),
    })
  })

  // Handle livestream chat messages
  socket.on('livestream:message', (message: ChatMessage) => {
    if (!message.streamId) {
      return
    }

    const roomId = `stream_${message.streamId}`
    io.to(roomId).emit('livestream:message', {
      ...message,
      id: `${Date.now()}`,
      timestamp: Date.now(),
    })
  })

  // Handle leaving livestream
  socket.on('livestream:leave', (data: { streamId: string; username?: string }) => {
    const roomId = `stream_${data.streamId}`
    socket.leave(roomId)

    io.to(roomId).emit('livestream:user_left', {
      username: data.username || 'Anonymous',
      timestamp: Date.now(),
    })
  })
}
