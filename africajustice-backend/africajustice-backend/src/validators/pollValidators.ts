import { body, ValidationChain } from 'express-validator'
import { mongoIdParam, shortText } from './common'

export const createPollValidator: ValidationChain[] = [
  shortText('question', 'question', 5, 220),
  body('options')
    .isArray({ min: 2, max: 12 })
    .withMessage('options must be an array with 2 to 12 values.'),
  body('options.*')
    .isString()
    .withMessage('each option must be a string.')
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('each option must be between 1 and 120 characters.'),
]

export const votePollValidator: ValidationChain[] = [
  mongoIdParam('id'),
  body('optionIndex')
    .isInt({ min: 0 })
    .withMessage('optionIndex must be a non-negative integer.'),
]

