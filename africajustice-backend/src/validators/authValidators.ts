import { body, ValidationChain } from 'express-validator'
import { optionalShortText } from './common'

export const loginValidator: ValidationChain[] = [
  body('email')
    .isString()
    .withMessage('email must be a string.')
    .trim()
    .isEmail()
    .withMessage('email must be a valid email address.'),
  body('password')
    .isString()
    .withMessage('password must be a string.')
    .isLength({ min: 6, max: 128 })
    .withMessage('password must be between 6 and 128 characters.'),
  optionalShortText('name', 'name', 80),
]
