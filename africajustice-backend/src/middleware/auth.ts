import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { captureError, addBreadcrumb } from '../config/sentry'

interface AuthTokenPayload extends JwtPayload {
  id: string
  email: string
  role: string
}

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

/**
 * Parse Bearer token from Authorization header
 * Uses regex for robust parsing
 */
const readBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) {
    return null
  }

  // Use regex to safely parse Bearer token with flexible spacing
  const match = authorizationHeader.match(/^Bearer\s+(\S+)$/i)
  return match?.[1] || null
}

/**
 * Validate JWT secret is configured
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET

  // Fail fast if JWT_SECRET not configured
  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable is not configured. ' +
      'Application cannot start without proper authentication configuration.'
    )
  }

  // Warn if secret looks weak (development only)
  if (process.env.NODE_ENV !== 'production' && secret.length < 32) {
    console.warn('⚠️  JWT_SECRET is less than 32 characters. Consider using a stronger secret.')
  }

  return secret
}

/**
 * Authentication middleware - validates JWT tokens
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = readBearerToken(req.headers.authorization)

    if (!token) {
      addBreadcrumb('Missing authentication token', 'auth', 'warning', { path: req.path })
      res.status(401).json({
        success: false,
        message: 'Unauthorized: missing bearer token.',
      })
      return
    }

    const jwtSecret = getJwtSecret()

    try {
      const decoded = jwt.verify(token, jwtSecret) as AuthTokenPayload
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      }
      addBreadcrumb('User authenticated', 'auth', 'info', { userId: decoded.id })
      next()
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        addBreadcrumb('Token expired', 'auth', 'warning')
        res.status(401).json({
          success: false,
          message: 'Unauthorized: token has expired.',
        })
      } else if (err instanceof jwt.JsonWebTokenError) {
        captureError(err as Error, { context: 'tokenValidation' })
        res.status(401).json({
          success: false,
          message: 'Unauthorized: invalid token.',
        })
      } else {
        throw err
      }
    }
  } catch (error) {
    console.error('Authentication error:', error)
    captureError(error as Error, { context: 'authenticate' })
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    })
  }
}

/**
 * Authorization middleware - checks user roles
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      addBreadcrumb('Missing user context', 'auth', 'warning')
      res.status(401).json({
        success: false,
        message: 'Unauthorized: user context missing.',
      })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      addBreadcrumb('Insufficient permissions', 'auth', 'warning', {
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      })
      res.status(403).json({
        success: false,
        message: 'Forbidden: insufficient permissions.',
      })
      return
    }

    next()
  }
}

// Export aliases for backward compatibility
export const authMiddleware = authenticate
export const requireRoles = authorize

/**
 * Verify JWT token and return decoded payload
 * Used for Socket.io and other non-HTTP authentication
 */
export const verifyToken = (token: string): AuthTokenPayload | null => {
  try {
    const jwtSecret = getJwtSecret()
    const decoded = jwt.verify(token, jwtSecret) as AuthTokenPayload
    return decoded
  } catch (error) {
    return null
  }
}
