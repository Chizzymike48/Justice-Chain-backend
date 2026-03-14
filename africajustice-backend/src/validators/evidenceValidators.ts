import { ValidationChain } from 'express-validator'
import { optionalShortText, shortText } from './common'

export const createEvidenceValidator: ValidationChain[] = [
  shortText('caseId', 'caseId', 2, 180),
  optionalShortText('sourceNote', 'sourceNote', 400),
  // fileName comes from multer file object, not form body
]
