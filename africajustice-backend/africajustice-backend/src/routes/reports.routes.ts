import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { auditWriteAction } from '../middleware/audit'
import { reportLimiter } from '../middleware/rateLimit'
import { validateRequest } from '../middleware/validation'
import { createReportValidator } from '../validators/reportValidators'
import {
  createReportController,
  getReportsController,
  getReportByIdController,
  updateReportStatusController,
} from '../controllers/reportController'

const router = Router()

router.get('/', getReportsController)

router.post(
  '/',
  authMiddleware,
  reportLimiter,
  createReportValidator,
  validateRequest,
  auditWriteAction('reports.create'),
  createReportController,
)

router.get('/:id', getReportByIdController)

router.patch(
  '/:id/status',
  authMiddleware,
  auditWriteAction('reports.update'),
  updateReportStatusController,
)

export default router
