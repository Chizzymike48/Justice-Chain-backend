import { Request, Response, Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { auditWriteAction } from '../middleware/audit'
import { aiLimiter } from '../middleware/rateLimit'
import { validateRequest } from '../middleware/validation'
import { ChatTurn, generateAssistantResponse, normalizeChatLanguage } from '../services/aiService'
import { chatRequestValidator } from '../validators/aiValidators'

const router = Router()

router.post('/chat', authMiddleware, aiLimiter, chatRequestValidator, validateRequest, auditWriteAction('ai.chat'), async (req: Request, res: Response) => {
  const { message, history, preferredLanguage } = req.body as {
    message?: string
    history?: ChatTurn[]
    preferredLanguage?: 'en' | 'pidgin' | 'hausa' | 'yoruba' | 'igbo'
  }

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'message is required.',
    })
  }

  try {
    const safeHistory = Array.isArray(history) ? history : []
    const data = await generateAssistantResponse(
      message,
      safeHistory,
      normalizeChatLanguage(preferredLanguage),
    )
    return res.json({
      success: true,
      data,
    })
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Unable to process chatbot request.',
    })
  }
})

export default router
