import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { auditWriteAction } from '../middleware/audit'
import { validateRequest } from '../middleware/validation'
import { createPollValidator, votePollValidator } from '../validators/pollValidators'
import {
  createPollController,
  getPollsController,
  getPollByIdController,
  votePollController,
  updatePollStatusController,
} from '../controllers/pollController'

const router = Router()

router.get('/', getPollsController)

router.post(
  '/',
  authMiddleware,
  createPollValidator,
  validateRequest,
  auditWriteAction('polls.create'),
  createPollController,
)

router.get('/:id', getPollByIdController)

router.post(
  '/:id/vote',
  authMiddleware,
  votePollValidator,
  validateRequest,
  auditWriteAction('polls.vote'),
  votePollController,
)

router.patch(
  '/:id/status',
  authMiddleware,
  auditWriteAction('polls.update'),
  updatePollStatusController,
)


export default router
