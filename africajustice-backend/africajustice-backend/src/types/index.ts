import { Request } from 'express'

export interface IUser {
  id: string
  email: string
  role: string
}

export interface AuthRequest extends Request {
  user?: IUser
}

export type IAuthRequest = AuthRequest

export interface IReport {
  _id?: string
  title: string
  description: string
  category: string
  type?: string
  status: string
  location?: string
  userId?: string
  office?: string
  amount?: number
  source?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface IEvidence {
  _id?: string
  reportId: string
  type?: string
  description?: string
  status: string
  fileName?: string
  fileSize?: number
  uploadedBy?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface IVerification {
  _id?: string
  reportId: string
  status: string
  verifiedBy?: string
  verifierRole?: string
  notes?: string
  riskLevel?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface IAnalytics {
  totalReports: number
  totalVerifications: number
  totalEvidence: number
  reportsByStatus?: Record<string, number>
  reportsByType?: Record<string, number>
  verificationsByStatus?: Record<string, number>
}
