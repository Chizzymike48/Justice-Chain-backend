import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middleware/auth'
import { auditWriteAction } from '../middleware/audit'
import { authLimiter } from '../middleware/rateLimit'
import { validateRequest } from '../middleware/validation'
import { loginValidator } from '../validators/authValidators'
import { registerController, loginController, logoutController, getCurrentUserController } from '../controllers/authController'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Auth routes ready' })
})

router.post('/register', authLimiter, loginValidator, validateRequest, auditWriteAction('auth.register'), registerController)

router.post('/login', authLimiter, loginValidator, validateRequest, auditWriteAction('auth.login'), loginController)

router.post('/logout', authMiddleware, auditWriteAction('auth.logout'), logoutController)

router.get('/me', authMiddleware, getCurrentUserController)

export default router
