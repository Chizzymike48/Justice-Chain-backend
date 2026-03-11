import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { upload } from '../middleware/multer'
import { auditWriteAction } from '../middleware/audit'
import { validateRequest } from '../middleware/validation'
import { createEvidenceValidator } from '../validators/evidenceValidators'
import {
  uploadEvidenceController,
  getEvidenceController,
  getEvidenceByIdController,
  updateEvidenceStatusController,
} from '../controllers/evidenceController'

const router = Router()

router.get('/', getEvidenceController)

router.post(
  '/',
  authMiddleware,
  upload.single('file'),
  createEvidenceValidator,
  validateRequest,
  auditWriteAction('evidence.create'),
  uploadEvidenceController,
)

router.get('/:id', getEvidenceByIdController)

router.patch(
  '/:id/status',
  authMiddleware,
  auditWriteAction('evidence.update'),
  updateEvidenceStatusController,
)

export default router
