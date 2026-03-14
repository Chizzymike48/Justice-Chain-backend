import { Schema, model } from 'mongoose'

interface PollOption {
  label: string
  votes: number
}

export interface IPoll {
  question: string
  options: PollOption[]
  status: string
  createdAt?: Date
  updatedAt?: Date
}

const pollSchema = new Schema<IPoll>({
  question: { type: String, required: true },
  options: [{
    label: { type: String, required: true },
    votes: { type: Number, required: false, min: 0, default: 0 },
  }],
  status: { type: String, required: false, default: 'open' },
}, {
  timestamps: true,
})

pollSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: { _id?: { toString(): string }; id?: string }) => {
    ret.id = ret._id?.toString()
    delete ret._id
  },
})

export const Poll = model<IPoll>('Poll', pollSchema)
