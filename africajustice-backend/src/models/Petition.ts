import { Schema, model } from 'mongoose'

export interface IPetition {
  title: string
  description: string
  createdBy?: string
  supporters: number
  status: string
  createdAt?: Date
  updatedAt?: Date
}

const petitionSchema = new Schema<IPetition>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  createdBy: { type: String, required: false, default: '' },
  supporters: { type: Number, required: false, min: 0, default: 0 },
  status: { type: String, required: false, default: 'open' },
}, {
  timestamps: true,
})

// Add performance indexes for common queries
petitionSchema.index({ status: 1, createdAt: -1 })
petitionSchema.index({ createdBy: 1 })
petitionSchema.index({ createdAt: -1 })

petitionSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: { _id?: { toString(): string }; id?: string }) => {
    ret.id = ret._id?.toString()
    delete ret._id
  },
})

export const Petition = model<IPetition>('Petition', petitionSchema)
