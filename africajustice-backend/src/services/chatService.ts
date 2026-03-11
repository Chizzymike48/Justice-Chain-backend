import ChatMessage from '../models/ChatMessage';
import { getTranslatedBotResponse } from '../locales/chatResponses';
import { generateAssistantResponse, normalizeChatLanguage } from './aiService';

const BOT_RESPONSES = {
  greetings: [
    'Hello! 👋 I\'m your Justice Chain Assistant. How can I help you today?',
    'Welcome to Justice Chain! I\'m here to help you report corruption and track cases. What can I do for you?',
    'Hi there! Need help with reporting or tracking a case? I\'m here to assist!',
    'Greetings! Ask me about reporting corruption, uploading evidence, or checking case status.',
  ],
  reportHelp: 'reportHelp',
  evidenceHelp: 'evidenceHelp',
  caseStatus: 'caseStatus',
  security: 'security',
  default: 'default',
  // Enhanced responses
  help: 'help',
  contact: 'contact',
  login: 'login',
  signup: 'signup',
  about: 'about',
  thanks: 'thanks',
  goodbye: 'goodbye',
};

const KEYWORDS = {
  report: ['report', 'submit', 'file', 'corruption', 'corrupt', 'bribe', 'bribery', 'fraud', 'abuse', ' misconduct', 'scandal'],
  evidence: ['evidence', 'upload', 'photo', 'video', 'document', 'stream', 'live', 'recording', 'audio', 'file', 'attachment'],
  case: ['case', 'status', 'progress', 'track', 'my', 'update', 'timeline', 'resolved', 'pending'],
  security: ['security', 'private', 'safe', 'anonymous', 'encrypt', 'privacy', 'confidential', 'protect'],
  greeting: ['hello', 'hi', 'hey', 'help', 'start', 'greetings', 'good morning', 'good afternoon', 'good evening'],
  help: ['help', 'assist', 'support', 'guide', 'how to', 'what can you do', 'instructions'],
  contact: ['contact', 'reach', 'email', 'phone', 'call', 'talk to', 'speak with'],
  login: ['login', 'sign in', 'log in', 'access', 'account'],
  signup: ['register', 'sign up', 'signin', 'create account', 'join', 'new user'],
  about: ['about', 'what is', 'who is', 'information', 'details', 'explain'],
  thanks: ['thank', 'thanks', 'appreciate', 'grateful', 'thx'],
  goodbye: ['bye', 'goodbye', 'see you', 'later', 'farewell', 'quit', 'exit'],
};

export class ChatService {
  async saveMessage(userId: string, sender: 'user' | 'bot', message: string, messageType: 'text' | 'voice' | 'audio-response' = 'text', voiceUrl?: string, audioResponseUrl?: string) {
    try {
      const chatMessage = new ChatMessage({
        userId,
        sender,
        message,
        messageType,
        voiceUrl,
        audioResponseUrl,
      });
      await chatMessage.save();
      return chatMessage;
    } catch (error) {
      console.warn('Warning: Failed to save chat message to database:', (error as Error).message);
      // Return a mock message object if MongoDB is unavailable
      return {
        _id: Date.now().toString(),
        userId,
        sender,
        message,
        messageType,
        voiceUrl,
        audioResponseUrl,
        createdAt: new Date(),
      } as any;
    }
  }

  async getConversationHistory(userId: string, limit: number = 50) {
    try {
      const messages = await ChatMessage.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
      return messages.reverse();
    } catch (error) {
      console.warn('Warning: Failed to fetch conversation history from database:', (error as Error).message);
      // Return empty array if MongoDB is unavailable
      return [];
    }
  }

  async getCaseRelatedMessages(caseId: string) {
    try {
      const messages = await ChatMessage.find({ caseId })
        .sort({ createdAt: -1 })
        .exec();
      return messages;
    } catch (error) {
      console.warn('Warning: Failed to fetch case messages from database:', (error as Error).message);
      // Return empty array if MongoDB is unavailable
      return [];
    }
  }

  async rateChatResponse(messageId: string, rating: number) {
    try {
      const message = await ChatMessage.findByIdAndUpdate(
        messageId,
        { rating },
        { new: true }
      );
      return message;
    } catch (error) {
      console.warn('Warning: Failed to rate message in database:', (error as Error).message);
      // Return a mock response if MongoDB is unavailable
      return { _id: messageId, rating } as any;
    }
  }

  async generateBotResponse(userMessage: string, userId: string, language: string = 'en', useAI: boolean = true): Promise<string> {
    // Normalize language to valid ChatLanguage type
    const chatLanguage = normalizeChatLanguage(language);
    
    // Option A & C: Try AI first if enabled
    if (useAI) {
      try {
        const aiResult = await generateAssistantResponse(userMessage, [], chatLanguage);
        if (aiResult && aiResult.reply) {
          return aiResult.reply;
        }
      } catch (error) {
        console.warn('AI service unavailable, falling back to keyword responses:', (error as Error).message);
      }
    }

    // Option B: Enhanced keyword-based responses (fallback or primary)
    const lowerMessage = userMessage.toLowerCase();

    // Check for keywords and return appropriate translated responses
    if (KEYWORDS.greeting.some((kw) => lowerMessage.includes(kw))) {
      return BOT_RESPONSES.greetings[Math.floor(Math.random() * BOT_RESPONSES.greetings.length)];
    }

    if (KEYWORDS.report.some((kw) => lowerMessage.includes(kw))) {
      return getTranslatedBotResponse('reportHelp', language) ||
        'To report corruption, please go to the "Report Corruption" section and provide details about the incident, including date, location, and individuals involved.';
    }

    if (KEYWORDS.evidence.some((kw) => lowerMessage.includes(kw))) {
      return getTranslatedBotResponse('evidenceHelp', language) ||
        'Evidence can include documents, photos, videos, or audio recordings. You can upload evidence from the Evidence Upload section.';
    }

    if (KEYWORDS.case.some((kw) => lowerMessage.includes(kw))) {
      return getTranslatedBotResponse('caseStatus', language) ||
        'You can view your case status in the "My Cases" dashboard. Cases go through several stages: submitted, under review, verified, and resolved.';
    }

    if (KEYWORDS.security.some((kw) => lowerMessage.includes(kw))) {
      return getTranslatedBotResponse('security', language) ||
        'Your data is encrypted and stored securely. All communications are private, and you can report anonymously.';
    }

    // Additional keyword handlers
    if (KEYWORDS.thanks.some((kw) => lowerMessage.includes(kw))) {
      return "You're welcome! 😊 Is there anything else I can help you with?";
    }

    if (KEYWORDS.goodbye.some((kw) => lowerMessage.includes(kw))) {
      return "Goodbye! 👋 Feel free to come back if you need any help. Stay safe!";
    }

    if (KEYWORDS.help.some((kw) => lowerMessage.includes(kw))) {
      return getTranslatedBotResponse('help', language) || 
        "I can help you with:\n📝 Reporting corruption\n📎 Uploading evidence\n🔍 Checking case status\n🔒 Security & privacy\n💬 General questions\n\nJust ask me anything!";
    }

    if (KEYWORDS.about.some((kw) => lowerMessage.includes(kw))) {
      return "Justice Chain is a platform for reporting corruption, tracking civic issues, and verifying claims. We help citizens and officials work together for transparency and accountability.";
    }

    if (KEYWORDS.login.some((kw) => lowerMessage.includes(kw))) {
      return "To log in, go to the Login page and enter your email and password. If you don't have an account, you can sign up to start reporting and tracking cases.";
    }

    if (KEYWORDS.signup.some((kw) => lowerMessage.includes(kw))) {
      return "To create an account, click 'Sign Up' and fill in your details. Having an account lets you submit reports, track cases, and receive updates.";
    }

    if (KEYWORDS.contact.some((kw) => lowerMessage.includes(kw))) {
      return "You can contact us through the Help page or by emailing support@justicechain.org. For emergencies, please use the official emergency contacts.";
    }

    return getTranslatedBotResponse('default', language) || 
      "I'm here to help! You can ask me about reporting corruption, uploading evidence, tracking cases, or anything else about Justice Chain. How can I assist you?";
  }

  async searchChatHistory(userId: string, query: string) {
    try {
      const messages = await ChatMessage.find({
        userId,
        message: { $regex: query, $options: 'i' },
      }).sort({ createdAt: -1 });
      return messages;
    } catch (error) {
      console.warn('Warning: Failed to search chat history in database:', (error as Error).message);
      // Return empty array if MongoDB is unavailable
      return [];
    }
  }

  async deleteOldMessages(userId: string, daysOld: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await ChatMessage.deleteMany({
        userId,
        createdAt: { $lt: cutoffDate },
      });

      return result;
    } catch (error) {
      console.warn('Warning: Failed to delete old messages from database:', (error as Error).message);
      // Return a success response even if MongoDB is unavailable
      return { deletedCount: 0 } as any;
    }
  }

  async getConversationStats(userId: string) {
    try {
      const totalMessages = await ChatMessage.countDocuments({ userId });
      const botMessages = await ChatMessage.countDocuments({ userId, sender: 'bot' });
      const userMessages = await ChatMessage.countDocuments({ userId, sender: 'user' });

      const ratedMessages = await ChatMessage.find({ userId, rating: { $ne: null } });
      const averageRating = ratedMessages.length > 0 ? ratedMessages.reduce((sum, msg) => sum + msg.rating!, 0) / ratedMessages.length : 0;

      return {
        totalMessages,
        botMessages,
        userMessages,
        averageRating: averageRating.toFixed(2),
        ratedCount: ratedMessages.length,
      };
    } catch (error) {
      console.warn('Warning: Failed to get conversation stats from database:', (error as Error).message);
      // Return default stats if MongoDB is unavailable
      return {
        totalMessages: 0,
        botMessages: 0,
        userMessages: 0,
        averageRating: '0.00',
        ratedCount: 0,
      };
    }
  }
}

export default new ChatService();
