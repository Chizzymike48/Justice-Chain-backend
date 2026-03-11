import { body, ValidationChain } from 'express-validator'
import { optionalShortText, shortText } from './common'

export const createReportValidator: ValidationChain[] = [
  shortText('title', 'title', 3, 180),
  shortText('description', 'description', 10, 3000),
  body('category')
    .isString()
    .withMessage('category must be a string.')
    .trim()
    .isIn(['corruption', 'civic'])
    .withMessage('category must be one of: corruption, civic.'),
  optionalShortText('userId', 'userId', 120),
  optionalShortText('office', 'office', 180),
  body('amount')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('amount must be a non-negative number.'),
  optionalShortText('source', 'source', 120),
  body('status')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('status must be a string.')
    .trim()
    .isLength({ min: 2, max: 40 })
    .withMessage('status must be between 2 and 40 characters.'),
]
