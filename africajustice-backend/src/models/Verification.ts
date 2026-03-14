import { Schema, model } from 'mongoose'

export interface IVerification {
  claim: string
  source?: string
  confidence: number
  status: 'pending' | 'reviewed'
  reviewNotes?: string
  reviewedBy?: string
  reviewedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

const verificationSchema = new Schema<IVerification>({
  claim: { type: String, required: true },
  source: { type: String, required: false, default: '' },
  confidence: { type: Number, required: false, min: 0, max: 100, default: 50 },
  status: { type: String, required: false, enum: ['pending', 'reviewed'], default: 'pending' },
  reviewNotes: { type: String, required: false },
  reviewedBy: { type: String, required: false },
  reviewedAt: { type: Date, required: false },
}, {
  timestamps: true,
})

verificationSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: { _id?: { toString(): string }; id?: string }) => {
    ret.id = ret._id?.toString()
    delete ret._id
  },
})

export const Verification = model<IVerification>('Verification', verificationSchema)
