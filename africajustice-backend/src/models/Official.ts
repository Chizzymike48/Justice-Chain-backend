import { Schema, model } from 'mongoose'

export interface IOfficial {
  name: string
  position: string
  agency: string
  district?: string
  trustScore: number
  createdAt?: Date
  updatedAt?: Date
}

const officialSchema = new Schema<IOfficial>({
  name: { type: String, required: true },
  position: { type: String, required: true },
  agency: { type: String, required: true },
  district: { type: String, required: false, default: '' },
  trustScore: { type: Number, default: 50 },
}, {
  timestamps: true,
})

officialSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: { _id?: { toString(): string }; id?: string }) => {
    ret.id = ret._id?.toString()
    delete ret._id
  },
})

export const Official = model<IOfficial>('Official', officialSchema)
