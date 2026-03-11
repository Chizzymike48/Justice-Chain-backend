import { Schema, model } from 'mongoose'

export interface ILiveStream {
  title: string
  description?: string
  streamUrl?: string
  streamId?: string
  caseId?: string
  userId?: string
  status: 'initializing' | 'active' | 'stopped'
  viewerCount?: number
  createdAt?: Date
  updatedAt?: Date
}

const liveStreamSchema = new Schema<ILiveStream>({
  title: { type: String, required: true },
  description: { type: String },
  streamUrl: { type: String, required: false },
  streamId: { type: String, required: false, unique: false },
  caseId: { type: String, required: false },
  userId: { type: String, required: false },
  status: { type: String, enum: ['initializing', 'active', 'stopped'], default: 'initializing' },
  viewerCount: { type: Number, default: 0 },
}, {
  timestamps: true,
})

liveStreamSchema.index({ caseId: 1, createdAt: -1 })
liveStreamSchema.index({ status: 1 })
liveStreamSchema.index({ userId: 1 })
liveStreamSchema.index({ streamId: 1 })

liveStreamSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: { _id?: { toString(): string }; id?: string }) => {
    ret.id = ret._id?.toString()
    delete ret._id
  },
})

export const LiveStream = model<ILiveStream>('LiveStream', liveStreamSchema)
