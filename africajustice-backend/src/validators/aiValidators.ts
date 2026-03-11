import { body, ValidationChain } from 'express-validator'

export const chatRequestValidator: ValidationChain[] = [
  body('message')
    .isString()
    .withMessage('message must be a string.')
    .trim()
    .isLength({ min: 1, max: 3000 })
    .withMessage('message must be between 1 and 3000 characters.'),
  body('history')
    .optional({ values: 'falsy' })
    .isArray({ max: 20 })
    .withMessage('history must be an array with at most 20 turns.'),
  body('history.*.role')
    .optional({ values: 'falsy' })
    .isIn(['user', 'assistant'])
    .withMessage('history role must be user or assistant.'),
  body('history.*.text')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('history text must be a string.')
    .isLength({ max: 3000 })
    .withMessage('history text must not exceed 3000 characters.'),
  body('preferredLanguage')
    .optional({ values: 'falsy' })
    .isIn(['en', 'pidgin', 'hausa', 'yoruba', 'igbo'])
    .withMessage('preferredLanguage must be one of en, pidgin, hausa, yoruba, igbo.'),
]

