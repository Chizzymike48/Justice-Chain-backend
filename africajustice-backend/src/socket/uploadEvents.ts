import type { Server as IOServer } from 'socket.io'

export interface UploadProgressEvent {
  evidenceId: string
  fileName: string
  progress: number // 0-100
  uploadedBytes: number
  totalBytes: number
  speed: number // bytes/second
  eta: number // estimated time remaining in seconds
  status: 'uploading' | 'processing' | 'scanning' | 'completed' | 'error'
  error?: string
}

/**
 * Upload Events - Real-time upload progress tracking via Socket.io
 */
export class UploadEvents {
  private io: IOServer

  constructor(io: IOServer) {
    this.io = io
  }

  /**
   * Emit upload progress event to specific user
   */
  public emitUploadProgress(userId: string, event: UploadProgressEvent): void {
    try {
      this.io.to(`user:${userId}`).emit('upload:progress', event)
      console.log(`[Socket] Upload progress: ${event.fileName} - ${event.progress}%`)
    } catch (error) {
      console.error('[Socket] Failed to emit upload progress:', error)
    }
  }

  /**
   * Emit upload started event
   */
  public emitUploadStarted(userId: string, event: {
    evidenceId: string
    fileName: string
    fileSize: number
  }): void {
    try {
      this.io.to(`user:${userId}`).emit('upload:started', event)
      console.log(`[Socket] Upload started: ${event.fileName}`)
    } catch (error) {
      console.error('[Socket] Failed to emit upload started:', error)
    }
  }

  /**
   * Emit upload completed event
   */
  public emitUploadCompleted(userId: string, event: {
    evidenceId: string
    fileName: string
    s3Url: string
    fileSize: number
    uploadTime: number // ms
  }): void {
    try {
      this.io.to(`user:${userId}`).emit('upload:completed', event)
      console.log(`[Socket] Upload completed: ${event.fileName}`)
    } catch (error) {
      console.error('[Socket] Failed to emit upload completed:', error)
    }
  }

  /**
   * Emit upload failed event
   */
  public emitUploadFailed(userId: string, event: {
    evidenceId: string
    fileName: string
    error: string
    errorCode?: string
  }): void {
    try {
      this.io.to(`user:${userId}`).emit('upload:failed', event)
      console.log(`[Socket] Upload failed: ${event.fileName} - ${event.error}`)
    } catch (error) {
      console.error('[Socket] Failed to emit upload failed:', error)
    }
  }

  /**
   * Emit virus scan started event
   */
  public emitVirusScanStarted(userId: string, event: {
    evidenceId: string
    fileName: string
  }): void {
    try {
      this.io.to(`user:${userId}`).emit('upload:scanning', event)
      console.log(`[Socket] Virus scan started: ${event.fileName}`)
    } catch (error) {
      console.error('[Socket] Failed to emit virus scan started:', error)
    }
  }

  /**
   * Emit virus scan completed event
   */
  public emitVirusScanCompleted(userId: string, event: {
    evidenceId: string
    fileName: string
    clean: boolean
    threat?: string
    scanTime: number
  }): void {
    try {
      this.io.to(`user:${userId}`).emit('upload:scan-completed', event)
      console.log(`[Socket] Virus scan completed: ${event.fileName} - ${event.clean ? 'Clean' : 'Infected'}`)
    } catch (error) {
      console.error('[Socket] Failed to emit virus scan completed:', error)
    }
  }

  /**
   * Broadcast upload notification to moderators
   */
  public emitEvidenceUploaded(event: {
    evidenceId: string
    caseId: string
    fileName: string
    uploadedBy: string
    uploadedAt: Date
  }): void {
    try {
      this.io.to('moderators').emit('evidence:uploaded', event)
      console.log(`[Socket] Evidence uploaded broadcast: ${event.fileName}`)
    } catch (error) {
      console.error('[Socket] Failed to broadcast evidence uploaded:', error)
    }
  }

  /**
   * Emit upload resume information
   */
  public emitUploadResume(userId: string, event: {
    evidenceId: string
    fileName: string
    resumeFrom: number // byte offset to resume from
  }): void {
    try {
      this.io.to(`user:${userId}`).emit('upload:resume', event)
      console.log(`[Socket] Upload resume info sent: ${event.fileName}`)
    } catch (error) {
      console.error('[Socket] Failed to emit upload resume:', error)
    }
  }
}

export const initializeUploadEvents = (io: IOServer) => new UploadEvents(io)
export default UploadEvents
