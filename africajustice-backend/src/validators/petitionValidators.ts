import { ValidationChain } from 'express-validator'
import { mongoIdParam, optionalShortText, shortText } from './common'

export const createPetitionValidator: ValidationChain[] = [
  shortText('title', 'title', 5, 180),
  shortText('description', 'description', 10, 2500),
  optionalShortText('createdBy', 'createdBy', 120),
]

export const signPetitionValidator: ValidationChain[] = [mongoIdParam('id')]
