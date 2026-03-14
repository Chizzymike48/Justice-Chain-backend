import { StreamRecording, IStreamRecording } from '../models/StreamRecording'

export interface CreateRecordingPayload {
  streamId: string
  title: string
  userId: string
  duration: number
  frameCount: number
  recordingPath: string
  thumbnailPath?: string
  caseId?: string
  quality?: 'low' | 'medium' | 'high'
  viewerCount?: number
  peakViewers?: number
  startedAt: Date
  endedAt: Date
  fileSize?: number
}

export interface RecordingAnalytics {
  duration: number
  frameCount: number
  viewerCount?: number
  peakViewers?: number
  quality?: 'low' | 'medium' | 'high'
  fileSize?: number
  startedAt: Date
  endedAt: Date
}

export const recordingService = {
  createRecording: async (payload: CreateRecordingPayload): Promise<IStreamRecording> => {
    const recording = await StreamRecording.create({
      streamId: payload.streamId,
      title: payload.title,
      userId: payload.userId,
      duration: payload.duration,
      frameCount: payload.frameCount,
      recordingPath: payload.recordingPath,
      thumbnailPath: payload.thumbnailPath,
      caseId: payload.caseId,
      quality: payload.quality || 'high',
      viewerCount: payload.viewerCount || 0,
      peakViewers: payload.peakViewers || 0,
      startedAt: payload.startedAt,
      endedAt: payload.endedAt,
      status: 'ready',
      fileSize: payload.fileSize,
    })
    return recording
  },

  getRecording: async (streamId: string): Promise<IStreamRecording | null> => {
    return StreamRecording.findOne({ streamId })
  },

  getRecordingById: async (id: string): Promise<IStreamRecording | null> => {
    return StreamRecording.findById(id)
  },

  getRecordingsByUser: async (userId: string, limit = 20, skip = 0): Promise<IStreamRecording[]> => {
    return StreamRecording.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
  },

  getRecordingsByCase: async (caseId: string): Promise<IStreamRecording[]> => {
    return StreamRecording.find({ caseId }).sort({ createdAt: -1 })
  },

  updateRecording: async (id: string, updates: Partial<IStreamRecording>): Promise<IStreamRecording | null> => {
    return StreamRecording.findByIdAndUpdate(id, updates, { new: true })
  },

  deleteRecording: async (id: string): Promise<void> => {
    await StreamRecording.findByIdAndDelete(id)
  },

  getPublicRecordings: async (limit = 20, skip = 0): Promise<IStreamRecording[]> => {
    return StreamRecording.find({ isPublic: true, status: 'ready' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
  },

  searchRecordings: async (query: string, limit = 20): Promise<IStreamRecording[]> => {
    return StreamRecording.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit)
  },

  getAnalytics: async (streamId: string): Promise<RecordingAnalytics | null> => {
    const recording = await StreamRecording.findOne({ streamId })
    if (!recording) return null

    return {
      duration: recording.duration,
      frameCount: recording.frameCount,
      viewerCount: recording.viewerCount,
      peakViewers: recording.peakViewers,
      quality: recording.quality,
      fileSize: recording.fileSize,
      startedAt: recording.startedAt,
      endedAt: recording.endedAt,
    }
  },
}

export default recordingService
