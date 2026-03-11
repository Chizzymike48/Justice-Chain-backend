import api from './api'

export interface EvidencePayload {
  caseId: string
  fileName: string
  sourceNote?: string
}

export interface EvidenceRecord extends EvidencePayload {
  id: string
  status: string
  createdAt?: string
  updatedAt?: string
}

export const evidenceService = {
  getEvidence: async (caseId?: string): Promise<EvidenceRecord[]> => {
    const response = await api.get<{ success: boolean; data: EvidenceRecord[] }>('/evidence', {
      params: caseId ? { caseId } : {},
    })
    return response.data.data
  },
  uploadEvidence: async (caseId: string, file: File, sourceNote: string = ''): Promise<EvidenceRecord> => {
    const formData = new FormData()
    formData.append('caseId', caseId)
    formData.append('file', file)
    formData.append('sourceNote', sourceNote)

    try {
      const response = await api.post<{ success: boolean; data: EvidenceRecord; message?: string }>('/evidence', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Evidence upload failed:', {
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

export default evidenceService
