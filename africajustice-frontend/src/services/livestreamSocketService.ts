import { io, Socket } from 'socket.io-client'

interface StreamCallbacks {
  onViewerCount?: (count: number) => void
  onStreamChunk?: (data: unknown) => void
  onStreamEnded?: () => void
  onError?: (error: string) => void
  onChatMessage?: (message: unknown) => void
}

const resolveSocketOrigin = (): string => {
  const fallback = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined
  if (!apiUrl) return fallback
  try {
    return new URL(apiUrl).origin
  } catch {
    return apiUrl.replace(/\/api\/v1\/?$/i, '') || fallback
  }
}

class LiveStreamSocketService {
  private socket: Socket | null = null
  private streamId: string | null = null
  private callbacks: StreamCallbacks = {}

  connect(streamId: string, callbacks: StreamCallbacks): void {
    try {
      this.streamId = streamId
      this.callbacks = callbacks

      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      if (!token) {
        callbacks.onError?.('Authentication token not found')
        return
      }

      const socketOrigin = resolveSocketOrigin().replace(/\/+$/, '')
      const socketUrl = `${socketOrigin}/livestream`

      this.socket = io(socketUrl, {
        path: '/socket.io/',
        auth: {
          token,
        },
        query: {
          streamId,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      })

      this.setupListeners()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed'
      callbacks.onError?.(errorMessage)
    }
  }

  private setupListeners(): void {
    if (!this.socket || !this.callbacks) return

    this.socket.on('connect', () => {
      console.log('Connected to livestream server')
      // Join livestream namespace
      if (this.streamId) {
        this.socket?.emit('stream:ready', { streamId: this.streamId })
      }
    })

    this.socket.on('viewer-count', (data: { count: number }) => {
      this.callbacks.onViewerCount?.(data.count)
    })

    this.socket.on('stream-chunk', (data: unknown) => {
      this.callbacks.onStreamChunk?.(data)
    })

    this.socket.on('stream-ended', () => {
      this.callbacks.onStreamEnded?.()
    })

    this.socket.on('chat-message', (data: unknown) => {
      this.callbacks.onChatMessage?.(data)
    })

    this.socket.on('viewer-joined', () => {
      console.log('New viewer joined')
    })

    this.socket.on('viewer-left', () => {
      console.log('Viewer left')
    })

    this.socket.on('error', (error: unknown) => {
      console.error('Socket error:', error)
      this.callbacks.onError?.(`Connection error: ${error}`)
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from livestream server')
      this.callbacks.onStreamEnded?.()
    })
  }

  sendStreamChunk(data: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit('stream-chunk', data)
    }
  }

  sendStatusUpdate(status: 'initializing' | 'active' | 'stopped'): void {
    if (this.socket?.connected) {
      this.socket.emit('stream-status', { status })
    }
  }

  sendChatMessage(text: string, username: string): void {
    if (this.socket?.connected) {
      this.socket.emit('chat-message', { text, username })
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.emit('stream:end', { streamId: this.streamId })
      this.socket.disconnect()
      this.socket = null
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export const livestreamSocketService = new LiveStreamSocketService()
export default livestreamSocketService
