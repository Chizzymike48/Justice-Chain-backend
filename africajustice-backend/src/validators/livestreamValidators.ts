import { body, ValidationChain } from 'express-validator'
import { optionalShortText, shortText } from './common'

export const createLiveStreamValidator: ValidationChain[] = [
  shortText('title', 'title', 4, 180),
  body('streamUrl')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('streamUrl must be a string.')
    .trim()
    .isLength({ min: 8, max: 500 })
    .withMessage('streamUrl must be between 8 and 500 characters.'),
  optionalShortText('description', 'description', 1200),
  optionalShortText('caseId', 'caseId', 120),
  optionalShortText('userId', 'userId', 120),
  body('status')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('status must be a string.')
    .trim()
    .isLength({ min: 2, max: 40 })
    .withMessage('status must be between 2 and 40 characters.'),
]
