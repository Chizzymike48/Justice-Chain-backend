import { body, param, ValidationChain } from 'express-validator'

export const shortText = (field: string, label: string, min = 2, max = 160): ValidationChain =>
  body(field)
    .isString()
    .withMessage(`${label} must be a string.`)
    .trim()
    .isLength({ min, max })
    .withMessage(`${label} must be between ${min} and ${max} characters.`)

export const optionalShortText = (field: string, label: string, max = 160): ValidationChain =>
  body(field)
    .optional({ values: 'falsy' })
    .isString()
    .withMessage(`${label} must be a string.`)
    .trim()
    .isLength({ max })
    .withMessage(`${label} must be at most ${max} characters.`)

export const mongoIdParam = (name = 'id'): ValidationChain =>
  param(name).isMongoId().withMessage(`${name} must be a valid MongoDB id.`)
