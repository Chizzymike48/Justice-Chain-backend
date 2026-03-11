import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { auditWriteAction } from '../middleware/audit'
import { validateRequest } from '../middleware/validation'
import { createProjectValidator } from '../validators/projectValidators'
import {
  createProjectController,
  getProjectsController,
  getProjectByIdController,
  updateProjectStatusController,
} from '../controllers/projectController'

const router = Router()

router.get('/', getProjectsController)

router.post(
  '/',
  authMiddleware,
  createProjectValidator,
  validateRequest,
  auditWriteAction('projects.create'),
  createProjectController,
)

router.get('/:id', getProjectByIdController)

router.patch(
  '/:id/status',
  authMiddleware,
  auditWriteAction('projects.update'),
  updateProjectStatusController,
)

export default router
