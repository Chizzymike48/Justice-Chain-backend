import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { auditWriteAction } from '../middleware/audit'
import { validateRequest } from '../middleware/validation'
import { createOfficialValidator } from '../validators/officialValidators'
import {
  createOfficialController,
  getOfficialsController,
  getOfficialByIdController,
  updateOfficialTrustScoreController,
} from '../controllers/officialController'

const router = Router()

router.get('/', getOfficialsController)

router.post(
  '/',
  authMiddleware,
  createOfficialValidator,
  validateRequest,
  auditWriteAction('officials.create'),
  createOfficialController,
)

router.get('/:id', getOfficialByIdController)

router.patch(
  '/:id/trust',
  authMiddleware,
  auditWriteAction('officials.update'),
  updateOfficialTrustScoreController,
)

export default router
