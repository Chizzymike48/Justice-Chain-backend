import { Schema, model } from 'mongoose'

export interface IReport {
  title: string
  description: string
  category: string
  userId?: string
  office?: string
  amount?: number
  source?: string
  status: string
  moderationReason?: string
  moderatedBy?: string
  moderatedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

const reportSchema = new Schema<IReport>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  userId: { type: String, required: false },
  office: { type: String, required: false },
  amount: { type: Number, required: false },
  source: { type: String, required: false },
  status: { type: String, default: 'open' },
  moderationReason: { type: String, required: false },
  moderatedBy: { type: String, required: false },
  moderatedAt: { type: Date, required: false },
}, {
  timestamps: true,
})

// Add performance indexes for common queries
reportSchema.index({ userId: 1 })
reportSchema.index({ status: 1, createdAt: -1 })
reportSchema.index({ category: 1 })
reportSchema.index({ createdAt: -1 })

reportSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: { _id?: { toString(): string }; id?: string }) => {
    ret.id = ret._id?.toString()
    delete ret._id
  },
})

export const Report = model<IReport>('Report', reportSchema)
