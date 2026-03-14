import { Schema, model } from 'mongoose'

export interface IStreamRecording {
  streamId: string
  title: string
  description?: string
  userId: string
  caseId?: string
  recordingPath: string
  thumbnailPath?: string
  duration: number
  frameCount: number
  quality: 'low' | 'medium' | 'high'
  viewerCount: number
  peakViewers: number
  startedAt: Date
  endedAt: Date
  isPublic: boolean
  status: 'recording' | 'processing' | 'ready' | 'archived'
  fileSize?: number
  createdAt?: Date
  updatedAt?: Date
}

const streamRecordingSchema = new Schema<IStreamRecording>({
  streamId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  userId: { type: String, required: true },
  caseId: { type: String, required: false },
  recordingPath: { type: String, required: true },
  thumbnailPath: { type: String, required: false },
  duration: { type: Number, default: 0 },
  frameCount: { type: Number, default: 0 },
  quality: { type: String, enum: ['low', 'medium', 'high'], default: 'high' },
  viewerCount: { type: Number, default: 0 },
  peakViewers: { type: Number, default: 0 },
  startedAt: { type: Date, required: true },
  endedAt: { type: Date, required: true },
  isPublic: { type: Boolean, default: false },
  status: { type: String, enum: ['recording', 'processing', 'ready', 'archived'], default: 'recording' },
  fileSize: { type: Number, required: false },
}, {
  timestamps: true,
})

streamRecordingSchema.index({ userId: 1, createdAt: -1 })
streamRecordingSchema.index({ caseId: 1 })
streamRecordingSchema.index({ status: 1 })
streamRecordingSchema.index({ createdAt: -1 })

streamRecordingSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: { _id?: { toString(): string }; id?: string }) => {
    ret.id = ret._id?.toString()
    delete ret._id
  },
})

export const StreamRecording = model<IStreamRecording>('StreamRecording', streamRecordingSchema)
