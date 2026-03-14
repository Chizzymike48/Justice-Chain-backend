import api from './api'

export interface ChatbotMetrics {
  reports: number
  projects: number
  verifications: number
  evidence: number
  petitions: number
}

export interface ChatbotHistoryTurn {
  role: 'user' | 'assistant'
  text: string
}

export type ChatbotLanguage = 'en' | 'pidgin' | 'hausa' | 'yoruba' | 'igbo'

export interface ChatbotResponse {
  reply: string
  suggestions: string[]
  metrics: ChatbotMetrics
  provider: 'openai' | 'fallback'
}

export const chatbotService = {
  sendMessage: async (
    message: string,
    history: ChatbotHistoryTurn[] = [],
    preferredLanguage: ChatbotLanguage = 'en',
  ): Promise<ChatbotResponse> => {
    const response = await api.post<{ success: boolean; data: ChatbotResponse }>('/ai/chat', {
      message,
      history,
      preferredLanguage,
    })
    return response.data.data
  },
}

export default chatbotService
