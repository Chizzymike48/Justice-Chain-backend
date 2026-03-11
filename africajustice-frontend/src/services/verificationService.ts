import api from './api'

export interface VerificationPayload {
  claim: string
  source?: string
  confidence?: number
  status?: 'pending' | 'reviewed'
}

export interface VerificationRecord extends VerificationPayload {
  id: string
  createdAt?: string
  updatedAt?: string
}

export const verificationService = {
  getVerifications: async () => {
    const response = await api.get<{ success: boolean; data: VerificationRecord[] }>('/verify')
    return response.data.data
  },
  submitVerification: async (data: VerificationPayload) => {
    const response = await api.post<{ success: boolean; data: VerificationRecord }>('/verify', data)
    return response.data.data
  },
}

export default verificationService
