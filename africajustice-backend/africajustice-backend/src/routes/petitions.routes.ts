import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { auditWriteAction } from '../middleware/audit'
import { validateRequest } from '../middleware/validation'
import { createPetitionValidator, signPetitionValidator } from '../validators/petitionValidators'
import {
  createPetitionController,
  getPetitionsController,
  getPetitionByIdController,
  signPetitionController,
  updatePetitionStatusController,
} from '../controllers/petitionController'

const router = Router()

router.get('/', getPetitionsController)

router.post(
  '/',
  authMiddleware,
  createPetitionValidator,
  validateRequest,
  auditWriteAction('petitions.create'),
  createPetitionController,
)

router.get('/:id', getPetitionByIdController)

router.post(
  '/:id/sign',
  authMiddleware,
  signPetitionValidator,
  validateRequest,
  auditWriteAction('petitions.sign'),
  signPetitionController,
)

router.patch(
  '/:id/status',
  authMiddleware,
  auditWriteAction('petitions.update'),
  updatePetitionStatusController,
)

export default router
