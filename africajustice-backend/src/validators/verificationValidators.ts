import { body, ValidationChain } from 'express-validator'
import { optionalShortText, shortText } from './common'

export const createVerificationValidator: ValidationChain[] = [
  shortText('claim', 'claim', 8, 2000),
  optionalShortText('source', 'source', 300),
  body('confidence')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: 100 })
    .withMessage('confidence must be a number between 0 and 100.'),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(['pending', 'reviewed'])
    .withMessage('status must be one of: pending, reviewed.'),
]
