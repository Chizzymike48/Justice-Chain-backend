import { Schema, model } from 'mongoose'

export interface IEvidence {
  caseId: string
  fileName: string
  sourceNote?: string
  status: string
  language?: 'en' | 'fr' | 'es' | 'sw' | 'pt' | 'am' | 'ha' | 'yo' | 'ig'
  s3Key?: string // S3 object key
  s3Url?: string // Signed S3 URL
  fileSize?: number // File size in bytes
  mimeType?: string // MIME type (e.g., application/pdf)
  virusScanResult?: {
    clean: boolean
    threat?: string
    scanTime?: number
    engine?: string
  }
  uploadedBy?: string // User ID who uploaded
  uploadProgress?: number // Upload progress percentage (0-100)
  uploadedAt?: Date // When file was uploaded to S3
  reviewReason?: string // Reason for review rejection
  reviewedBy?: string // User ID who reviewed
  reviewedAt?: Date // When evidence was reviewed
  createdAt?: Date
  updatedAt?: Date
}

const evidenceSchema = new Schema<IEvidence>({
  caseId: { type: String, required: true },
  fileName: { type: String, required: true },
  sourceNote: { type: String, required: false, default: '' },
  status: { type: String, required: false, default: 'queued' },
  language: { type: String, enum: ['en', 'fr', 'es', 'sw', 'pt', 'am', 'ha', 'yo', 'ig'], default: 'en' },
  s3Key: { type: String, required: false },
  s3Url: { type: String, required: false },
  fileSize: { type: Number, required: false },
  mimeType: { type: String, required: false, default: 'application/octet-stream' },
  virusScanResult: {
    clean: { type: Boolean, required: false, default: true },
    threat: { type: String, required: false },
    scanTime: { type: Number, required: false },
    engine: { type: String, required: false },
  },
  uploadedBy: { type: String, required: false },
  uploadProgress: { type: Number, required: false, default: 0, min: 0, max: 100 },
  uploadedAt: { type: Date, required: false },
  reviewReason: { type: String, required: false },
  reviewedBy: { type: String, required: false },
  reviewedAt: { type: Date, required: false },
}, {
  timestamps: true,
})

// Add performance indexes for common queries
evidenceSchema.index({ caseId: 1 })
evidenceSchema.index({ uploadedBy: 1 })
evidenceSchema.index({ status: 1 })
evidenceSchema.index({ uploadedAt: -1 })

evidenceSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: { _id?: { toString(): string }; id?: string }) => {
    ret.id = ret._id?.toString()
    delete ret._id
  },
})

export const Evidence = model<IEvidence>('Evidence', evidenceSchema)
