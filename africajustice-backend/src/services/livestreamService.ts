// LiveStream Service - Manages in-app live streaming with WebSocket support
import { WebSocket } from 'ws'
import fs from 'fs'
import path from 'path'

export interface StreamSession {
  streamId: string
  userId: string
  title: string
  status: 'initializing' | 'active' | 'stopped'
  viewers: Set<WebSocket>
  startedAt: Date
  endedAt?: Date
  caseId?: string
  recordingPath?: string
  recordingBuffer: Buffer[]
  totalFrames: number
  thumbnailPath?: string
  quality: 'low' | 'medium' | 'high'
}

const activeSessions = new Map<string, StreamSession>()
const RECORDING_DIR = path.join(process.cwd(), 'recordings')
const THUMBNAILS_DIR = path.join(process.cwd(), 'thumbnails')

// Ensure directories exist
const ensureDirectories = () => {
  if (!fs.existsSync(RECORDING_DIR)) {
    fs.mkdirSync(RECORDING_DIR, { recursive: true })
  }
  if (!fs.existsSync(THUMBNAILS_DIR)) {
    fs.mkdirSync(THUMBNAILS_DIR, { recursive: true })
  }
}

ensureDirectories()

export const livestreamService = {
  createStreamSession: (streamId: string, userId: string, title: string, caseId?: string): StreamSession => {
    const session: StreamSession = {
      streamId,
      userId,
      title,
      status: 'initializing',
      viewers: new Set(),
      startedAt: new Date(),
      caseId,
      recordingBuffer: [],
      totalFrames: 0,
      quality: 'high',
    }
    activeSessions.set(streamId, session)
    console.log(`Stream session created: ${streamId}`)
    return session
  },

  getStreamSession: (streamId: string): StreamSession | undefined => {
    return activeSessions.get(streamId)
  },

  addViewer: (streamId: string, ws: WebSocket): void => {
    const session = activeSessions.get(streamId)
    if (session) {
      session.viewers.add(ws)
      broadcastViewerCount(streamId)
      recordViewerAnalytics(streamId, 'joined', ws)
    }
  },

  removeViewer: (streamId: string, ws: WebSocket): void => {
    const session = activeSessions.get(streamId)
    if (session) {
      session.viewers.delete(ws)
      recordViewerAnalytics(streamId, 'left', ws)
      if (session.viewers.size === 0 && session.status === 'stopped') {
        saveStreamRecording(streamId)
        activeSessions.delete(streamId)
        console.log(`Stream session ended: ${streamId}`)
      } else {
        broadcastViewerCount(streamId)
      }
    }
  },

  recordStreamChunk: (streamId: string, chunk: Buffer): void => {
    const session = activeSessions.get(streamId)
    if (session && session.status === 'active') {
      // Store chunk in buffer for recording
      session.recordingBuffer.push(chunk)
      session.totalFrames++
    }
  },

  broadcastStreamChunk: (streamId: string, chunk: Buffer): void => {
    const session = activeSessions.get(streamId)
    if (session && session.viewers.size > 0) {
      const message = JSON.stringify({
        type: 'stream-chunk',
        data: chunk.toString('base64'),
        timestamp: Date.now(),
      })

      session.viewers.forEach((viewer) => {
        if (viewer.readyState === 1) {
          // WebSocket.OPEN
          viewer.send(message)
        }
      })
    }
  },

  setStreamQuality: (streamId: string, quality: 'low' | 'medium' | 'high'): void => {
    const session = activeSessions.get(streamId)
    if (session) {
      session.quality = quality
      broadcastQualityChange(streamId, quality)
    }
  },

  updateStreamStatus: (streamId: string, status: 'active' | 'stopped'): void => {
    const session = activeSessions.get(streamId)
    if (session) {
      session.status = status
      if (status === 'stopped') {
        session.endedAt = new Date()
        // Notify all viewers that the stream ended
        const endMessage = JSON.stringify({
          type: 'stream-ended',
          timestamp: Date.now(),
          duration: Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000),
          recordingId: generateRecordingId(streamId),
        })
        session.viewers.forEach((viewer) => {
          if (viewer.readyState === 1) {
            viewer.send(endMessage)
          }
        })
      }
    }
  },

  getActiveStreamCount: (): number => {
    return Array.from(activeSessions.values()).filter((s) => s.status === 'active').length
  },

  getViewerCount: (streamId: string): number => {
    const session = activeSessions.get(streamId)
    return session ? session.viewers.size : 0
  },

  getStreamDuration: (streamId: string): number => {
    const session = activeSessions.get(streamId)
    if (!session) return 0
    const endTime = session.endedAt || new Date()
    return Math.floor((endTime.getTime() - session.startedAt.getTime()) / 1000)
  },

  endStreamSession: (streamId: string): void => {
    const session = activeSessions.get(streamId)
    if (session) {
      livestreamService.updateStreamStatus(streamId, 'stopped')
      saveStreamRecording(streamId)
      activeSessions.delete(streamId)
      console.log(`Stream session terminated: ${streamId}`)
    }
  },
}

const broadcastViewerCount = (streamId: string): void => {
  const session = activeSessions.get(streamId)
  if (session) {
    const message = JSON.stringify({
      type: 'viewer-count',
      count: session.viewers.size,
    })
    session.viewers.forEach((viewer) => {
      if (viewer.readyState === 1) {
        viewer.send(message)
      }
    })
  }
}

export const updateStreamStatus = (streamId: string, status: 'active' | 'stopped'): void => {
  livestreamService.updateStreamStatus(streamId, status)
}

const broadcastQualityChange = (streamId: string, quality: string): void => {
  const session = activeSessions.get(streamId)
  if (session) {
    const message = JSON.stringify({
      type: 'quality-changed',
      quality,
    })
    session.viewers.forEach((viewer) => {
      if (viewer.readyState === 1) {
        viewer.send(message)
      }
    })
  }
}

const generateRecordingId = (streamId: string): string => {
  return `rec-${streamId}-${Date.now()}`
}

const saveStreamRecording = (streamId: string): void => {
  const session = activeSessions.get(streamId)
  if (!session || session.recordingBuffer.length === 0) return

  try {
    const recordingId = generateRecordingId(streamId)
    const recordingPath = path.join(RECORDING_DIR, `${recordingId}.webm`)

    // Concatenate all chunks
    const combinedBuffer = Buffer.concat(session.recordingBuffer)
    fs.writeFileSync(recordingPath, combinedBuffer)

    session.recordingPath = recordingPath
    console.log(`Stream recording saved: ${recordingPath}`)

    // Generate thumbnail (extract first frame)
    generateThumbnail(streamId, recordingId)
  } catch (error) {
    console.error('Failed to save stream recording:', error)
  }
}

const generateThumbnail = (streamId: string, recordingId: string): void => {
  // This is a placeholder - in production, you'd use ffmpeg to extract first frame
  const thumbnailPath = path.join(THUMBNAILS_DIR, `${recordingId}.jpg`)
  // Placeholder: create a dummy thumbnail
  fs.writeFileSync(thumbnailPath, Buffer.from('JPEG_PLACEHOLDER'))
  
  const session = activeSessions.get(streamId)
  if (session) {
    session.thumbnailPath = thumbnailPath
  }
  console.log(`Thumbnail generated: ${thumbnailPath}`)
}

const recordViewerAnalytics = (streamId: string, action: 'joined' | 'left', ws: WebSocket): void => {
  const session = activeSessions.get(streamId)
  if (!session) return

  const analytics = {
    streamId,
    action,
    timestamp: new Date(),
    totalViewers: session.viewers.size,
  }

  // In production, save to database
  console.log('Viewer analytics:', analytics)
}

export default livestreamService
