import rateLimit from 'express-rate-limit'
import { RATE_LIMITS } from '../config/constants'

const createLimiter = (
  config: { windowMs: number; max: number },
  message: string,
): ReturnType<typeof rateLimit> =>
  rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  })

const generalLimiter = createLimiter(
  RATE_LIMITS.GENERAL,
  'Too many requests. Please try again later.',
)
const authLimiter = createLimiter(
  RATE_LIMITS.AUTH,
  'Too many authentication attempts. Please wait and try again.',
)
const reportLimiter = createLimiter(
  RATE_LIMITS.REPORTS,
  'Report submission rate limit reached. Please try again later.',
)
const verificationLimiter = createLimiter(
  RATE_LIMITS.VERIFICATION,
  'Verification submission rate limit reached. Please try again later.',
)
const aiLimiter = createLimiter(
  RATE_LIMITS.AI_CHAT,
  'AI assistant rate limit reached. Please try again shortly.',
)

export {
  generalLimiter,
  authLimiter,
  reportLimiter,
  verificationLimiter,
  aiLimiter,
}
