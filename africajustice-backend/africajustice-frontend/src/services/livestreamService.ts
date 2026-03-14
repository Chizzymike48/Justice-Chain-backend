import api from './api'

export interface LiveStreamPayload {
  title: string
  description?: string
  streamUrl?: string
  caseId?: string
  status?: string
  streamId?: string
}

export interface LiveStreamRecord extends LiveStreamPayload {
  id: string
  userId?: string
  createdAt?: string
  updatedAt?: string
  viewerCount?: number
}

export const livestreamService = {
  getLiveStreams: async (caseId?: string): Promise<LiveStreamRecord[]> => {
    const response = await api.get<{ success: boolean; data: LiveStreamRecord[] }>('/livestream', {
      params: caseId ? { caseId } : {},
    })
    return response.data.data
  },

  createLiveStream: async (payload: LiveStreamPayload): Promise<LiveStreamRecord> => {
    const response = await api.post<{ success: boolean; data: LiveStreamRecord }>('/livestream', payload)
    return response.data.data
  },

  updateLiveStreamStatus: async (streamId: string, status: string): Promise<LiveStreamRecord> => {
    const response = await api.patch<{ success: boolean; data: LiveStreamRecord }>(
      `/livestream/${streamId}`,
      { status },
    )
    return response.data.data
  },

  getLiveStreamById: async (streamId: string): Promise<LiveStreamRecord> => {
    const response = await api.get<{ success: boolean; data: LiveStreamRecord }>(`/livestream/${streamId}`)
    return response.data.data
  },

  getActiveStreams: async (): Promise<LiveStreamRecord[]> => {
    const response = await api.get<{ success: boolean; data: LiveStreamRecord[] }>('/livestream/active')
    return response.data.data
  },
}

export default livestreamService
