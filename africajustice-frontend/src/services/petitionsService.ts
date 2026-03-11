import api from './api'

export interface PetitionPayload {
  title: string
  description: string
  createdBy?: string
}

export interface PetitionRecord extends PetitionPayload {
  id: string
  supporters: number
  status: string
  createdAt?: string
  updatedAt?: string
}

export const petitionsService = {
  getPetitions: async (): Promise<PetitionRecord[]> => {
    const response = await api.get<{ success: boolean; data: PetitionRecord[] }>('/petitions')
    return response.data.data
  },
  createPetition: async (payload: PetitionPayload): Promise<PetitionRecord> => {
    const response = await api.post<{ success: boolean; data: PetitionRecord }>('/petitions', payload)
    return response.data.data
  },
  signPetition: async (id: string): Promise<PetitionRecord> => {
    const response = await api.post<{ success: boolean; data: PetitionRecord }>(`/petitions/${id}/sign`)
    return response.data.data
  },
}

export default petitionsService
