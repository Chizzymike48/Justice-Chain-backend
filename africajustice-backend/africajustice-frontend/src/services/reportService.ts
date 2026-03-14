import api from './api'

export interface ReportPayload {
  title: string
  category: string
  description: string
  userId?: string
  office?: string
  amount?: number
  source?: string
  status?: string
}

export interface ReportRecord extends ReportPayload {
  id: string
  createdAt?: string
  updatedAt?: string
}

export const reportService = {
  getReports: async () => {
    const response = await api.get<{ success: boolean; data: ReportRecord[] }>('/reports')
    return response.data.data
  },
  createReport: async (data: ReportPayload) => {
    try {
      const response = await api.post<{ success: boolean; data: ReportRecord; message?: string }>('/reports', data)
      return response.data.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Report creation failed:', {
          message: error.message,
          error: error,
        })
        
        // Try to extract backend error message
        if ('response' in error && error.response && typeof error.response === 'object') {
          const response = error.response as { data?: { message?: string; errors?: Array<{ field: string; message: string }> } }
          if (response.data?.errors && response.data.errors.length > 0) {
            const fieldErrors = response.data.errors.map((e) => `${e.field}: ${e.message}`).join(', ')
            throw new Error(`Validation failed: ${fieldErrors}`)
          }
          if (response.data?.message) {
            throw new Error(response.data.message)
          }
        }
      }
      throw error
    }
  },
}

export default reportService
