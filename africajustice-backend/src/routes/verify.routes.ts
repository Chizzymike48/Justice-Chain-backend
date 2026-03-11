import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { auditWriteAction } from '../middleware/audit'
import { verificationLimiter } from '../middleware/rateLimit'
import { validateRequest } from '../middleware/validation'
import { createVerificationValidator } from '../validators/verificationValidators'
import {
  submitVerificationController,
  getVerificationsController,
  getVerificationByIdController,
  reviewVerificationController,
} from '../controllers/verificationController'

const router = Router()

router.get('/', getVerificationsController)

router.post(
  '/',
  authMiddleware,
  verificationLimiter,
  createVerificationValidator,
  validateRequest,
  auditWriteAction('verification.create'),
  submitVerificationController,
)

router.get('/:id', getVerificationByIdController)

router.patch(
  '/:id/review',
  authMiddleware,
  auditWriteAction('verification.review'),
  reviewVerificationController,
)

export default router
