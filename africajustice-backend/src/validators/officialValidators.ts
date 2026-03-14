import { body, ValidationChain } from 'express-validator'
import { optionalShortText, shortText } from './common'

export const createOfficialValidator: ValidationChain[] = [
  shortText('name', 'name', 2, 180),
  shortText('position', 'position', 2, 180),
  shortText('agency', 'agency', 2, 180),
  optionalShortText('district', 'district', 140),
  body('trustScore')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: 100 })
    .withMessage('trustScore must be a number between 0 and 100.'),
]
