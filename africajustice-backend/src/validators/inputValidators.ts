import { body, param, query, ValidationChain } from 'express-validator'
import { sanitizeInput, sanitizeEmail } from '../utils/sanitization'

/**
 * Comprehensive input validation for API endpoints
 * Prevents injection attacks and enforces business logic
 */

// ============ Report Validators ============

export const validateCreateReport = (): ValidationChain[] => [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters')
    .customSanitizer(value => sanitizeInput(value, 200)),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters')
    .customSanitizer(value => sanitizeInput(value, 5000)),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['corruption', 'fraud', 'embezzlement', 'misappropriation', 'bribery', 'nepotism', 'other'])
    .withMessage('Invalid category'),

  body('userId')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Invalid user ID'),

  body('office')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Office name too long')
    .customSanitizer(value => sanitizeInput(value, 200)),

  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),

  body('source')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Source too long')
    .customSanitizer(value => sanitizeInput(value, 500)),
]

export const validateUpdateReport = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid report ID'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters')
    .customSanitizer(value => sanitizeInput(value, 200)),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters')
    .customSanitizer(value => sanitizeInput(value, 5000)),

  body('category')
    .optional()
    .trim()
    .isIn(['corruption', 'fraud', 'embezzlement', 'misappropriation', 'bribery', 'nepotism', 'other'])
    .withMessage('Invalid category'),

  body('status')
    .optional()
    .trim()
    .isIn(['open', 'pending', 'investigating', 'resolved', 'rejected'])
    .withMessage('Invalid status'),
]

export const validateGetReports = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Limit must be between 1 and 500'),

  query('status')
    .optional()
    .isIn(['open', 'pending', 'investigating', 'resolved', 'rejected'])
    .withMessage('Invalid status filter'),

  query('category')
    .optional()
    .isIn(['corruption', 'fraud', 'embezzlement', 'misappropriation', 'bribery', 'nepotism', 'other'])
    .withMessage('Invalid category filter'),
]

// ============ Evidence Validators ============

export const validateUploadEvidence = (): ValidationChain[] => [
  body('caseId')
    .trim()
    .notEmpty()
    .withMessage('Case ID is required')
    .isMongoId()
    .withMessage('Invalid case ID'),

  body('fileName')
    .trim()
    .notEmpty()
    .withMessage('File name is required')
    .isLength({ max: 255 })
    .withMessage('File name too long')
    .customSanitizer(value => sanitizeInput(value, 255)),

  body('sourceNote')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Source note too long')
    .customSanitizer(value => sanitizeInput(value, 1000)),
]

// ============ Verification Validators ============

export const validateCreateVerification = (): ValidationChain[] => [
  body('claim')
    .trim()
    .notEmpty()
    .withMessage('Claim is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Claim must be between 10 and 2000 characters')
    .customSanitizer(value => sanitizeInput(value, 2000)),

  body('source')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Source too long')
    .customSanitizer(value => sanitizeInput(value, 500)),
]

export const validateReviewVerification = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid verification ID'),

  body('action')
    .notEmpty()
    .withMessage('Action is required')
    .isIn(['verify', 'dispute'])
    .withMessage('Invalid action'),

  body('confidence')
    .notEmpty()
    .withMessage('Confidence score is required')
    .isInt({ min: 0, max: 100 })
    .withMessage('Confidence must be between 0 and 100'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes too long')
    .customSanitizer(value => sanitizeInput(value, 1000)),
]

// ============ Petition Validators ============

export const validateCreatePetition = (): ValidationChain[] => [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters')
    .customSanitizer(value => sanitizeInput(value, 200)),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 3000 })
    .withMessage('Description must be between 10 and 3000 characters')
    .customSanitizer(value => sanitizeInput(value, 3000)),

  body('createdBy')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID'),
]

// ============ Auth Validators ============

export const validateLogin = (): ValidationChain[] => [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address')
    .customSanitizer(value => sanitizeEmail(value)),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
]

export const validateRegister = (): ValidationChain[] => [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address')
    .customSanitizer(value => sanitizeEmail(value)),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),

  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
]

// ============ Export Validators ============

export const validateExportReports = (): ValidationChain[] => [
  body('reportIds')
    .optional()
    .isArray()
    .withMessage('reportIds must be an array')
    .custom(value => {
      if (value && value.length > 500) {
        throw new Error('Cannot export more than 500 reports at once')
      }
      return true
    }),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (value && req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date')
      }
      return true
    }),
]

// ============ Pagination Validators ============

export const validatePagination = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 })
    .toInt()
    .withMessage('Limit must be between 1 and 500'),
]
