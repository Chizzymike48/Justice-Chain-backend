import chatbotService, { ChatbotHistoryTurn, ChatbotLanguage, ChatbotResponse } from '../services/chatbotService'

export const chatbotClient = {
  initialize: () => true,
  sendMessage: async (
    message: string,
    history: ChatbotHistoryTurn[] = [],
    preferredLanguage: ChatbotLanguage = 'en',
  ): Promise<ChatbotResponse> => {
    return chatbotService.sendMessage(message, history, preferredLanguage)
  },
}

export default chatbotClient
