import { Request, Response, NextFunction } from 'express'
import { captureError, captureMessage, addBreadcrumb } from '../config/sentry'

/**
 * Extended error interface with metadata
 */
interface ErrorResponse extends Error {
  statusCode?: number
  code?: string
  isOperational?: boolean
}

/**
 * Error categorization for different error types
 */
enum ErrorCategory {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  CONFLICT = 'CONFLICT_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  SERVER = 'SERVER_ERROR',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE_ERROR',
}

/**
 * Categorize error based on status code or error properties
 */
function categorizeError(err: ErrorResponse): ErrorCategory {
  const statusCode = err.statusCode || 500

  if (statusCode === 400) return ErrorCategory.VALIDATION
  if (statusCode === 401) return ErrorCategory.AUTHENTICATION
  if (statusCode === 403) return ErrorCategory.AUTHORIZATION
  if (statusCode === 404) return ErrorCategory.NOT_FOUND
  if (statusCode === 409) return ErrorCategory.CONFLICT
  if (statusCode === 429) return ErrorCategory.RATE_LIMIT
  if (statusCode >= 500) return ErrorCategory.SERVER

  if (err.message?.includes('MongoDB') || err.message?.includes('database')) {
    return ErrorCategory.DATABASE
  }

  if (err.message?.includes('external') || err.message?.includes('service')) {
    return ErrorCategory.EXTERNAL_SERVICE
  }

  return ErrorCategory.SERVER
}

/**
 * Global error handler middleware
 * Logs errors, categorizes them, and sends appropriate responses
 */
const errorHandler = (
  err: ErrorResponse,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500
  const category = categorizeError(err)
  const requestId = (req as any).id || 'unknown'

  // Add breadcrumb for error context
  addBreadcrumb('Error occurred', 'error', 'error', {
    status: statusCode,
    category,
    path: req.path,
    method: req.method,
    requestId,
  })

  // Log error based on severity
  if (statusCode >= 500) {
    console.error(`[${requestId}] ${category}:`, {
      message: err.message,
      stack: err.stack,
      statusCode,
      path: req.path,
      method: req.method,
    })

    // Capture server errors in Sentry for monitoring
    captureError(err, {
      context: 'globalErrorHandler',
      tags: {
        category,
        endpoint: `${req.method} ${req.path}`,
        statusCode: statusCode.toString(),
      },
      extra: {
        requestId,
        body: sanitizeBody(req.body),
        query: req.query,
      },
    })
  } else {
    console.warn(`[${requestId}] ${category}:`, {
      message: err.message,
      statusCode,
      path: req.path,
    })

    // Capture non-500 errors as messages for analysis
    captureMessage(`${category}: ${err.message}`, 'warning', {
      extra: {
        statusCode,
        requestId,
        endpoint: `${req.method} ${req.path}`,
      },
    })
  }

  // Send error response
  const response: any = {
    success: false,
    message: err.message || 'An error occurred',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    category: process.env.NODE_ENV === 'development' ? category : undefined,
    requestId,
  }

  // Add retry hint for specific error types
  if (category === ErrorCategory.RATE_LIMIT) {
    response.retryAfter = 300 // 5 minutes
  }

  res.status(statusCode).json(response)
}

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeBody(body: any): any {
  if (!body) return body

  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization']
  const sanitized = { ...body }

  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***'
    }
  })

  return sanitized
}

export default errorHandler
export { ErrorCategory }
