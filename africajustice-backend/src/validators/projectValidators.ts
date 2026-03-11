import { body, ValidationChain } from 'express-validator'
import { optionalShortText, shortText } from './common'

export const createProjectValidator: ValidationChain[] = [
  shortText('title', 'title', 4, 180),
  shortText('description', 'description', 8, 2500),
  shortText('agency', 'agency', 2, 180),
  body('budget')
    .isFloat({ min: 0 })
    .withMessage('budget must be a non-negative number.'),
  optionalShortText('location', 'location', 180),
  body('progress')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: 100 })
    .withMessage('progress must be a number between 0 and 100.'),
  body('status')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('status must be a string.')
    .trim()
    .isLength({ min: 2, max: 40 })
    .withMessage('status must be between 2 and 40 characters.'),
]
