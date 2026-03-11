import { Schema, model } from 'mongoose'

export interface IProject {
  title: string
  description: string
  budget: number
  status: string
  agency: string
  location?: string
  progress?: number
  createdAt?: Date
  updatedAt?: Date
}

const projectSchema = new Schema<IProject>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: Number, required: true },
  status: { type: String, default: 'on_track' },
  agency: { type: String, required: true },
  location: { type: String, required: false, default: '' },
  progress: { type: Number, required: false, min: 0, max: 100, default: 0 },
}, {
  timestamps: true,
})

// Add performance indexes for common queries
projectSchema.index({ status: 1, createdAt: -1 })
projectSchema.index({ agency: 1 })
projectSchema.index({ location: 1 })
projectSchema.index({ createdAt: -1 })

projectSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: { _id?: { toString(): string }; id?: string }) => {
    ret.id = ret._id?.toString()
    delete ret._id
  },
})

export const Project = model<IProject>('Project', projectSchema)
