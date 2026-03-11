import api from './api'

export interface OfficialPayload {
  name: string
  position: string
  agency: string
  district?: string
  trustScore?: number
}

export interface OfficialRecord extends OfficialPayload {
  id: string
  createdAt?: string
  updatedAt?: string
}

export const officialsService = {
  getOfficials: async (query?: string): Promise<OfficialRecord[]> => {
    const response = await api.get<{ success: boolean; data: OfficialRecord[] }>('/officials', {
      params: query ? { q: query } : {},
    })
    return response.data.data
  },
  createOfficial: async (payload: OfficialPayload): Promise<OfficialRecord> => {
    const response = await api.post<{ success: boolean; data: OfficialRecord }>('/officials', payload)
    return response.data.data
  },
}

export default officialsService
