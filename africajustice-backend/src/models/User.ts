import { Schema, model } from 'mongoose'

export interface IUser {
  email: string
  password: string
  name: string
  role: string
  preferredLanguage?: 'en' | 'fr' | 'es' | 'sw' | 'pt' | 'am' | 'ha' | 'yo' | 'ig'
  createdAt?: Date
  updatedAt?: Date
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: 'citizen' },
  preferredLanguage: { type: String, enum: ['en', 'fr', 'es', 'sw', 'pt', 'am', 'ha', 'yo', 'ig'], default: 'en' },
}, {
  timestamps: true,
})

userSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: { _id?: { toString(): string }; password?: string; id?: string }) => {
    ret.id = ret._id?.toString()
    delete ret._id
    delete ret.password
  },
})

export const User = model<IUser>('User', userSchema)
