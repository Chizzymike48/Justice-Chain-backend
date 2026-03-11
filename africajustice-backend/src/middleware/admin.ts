import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'

/**
 * Admin Authorization Middleware
 * Checks if user has admin role
 */
export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    })
    return
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Admin access required.',
    })
    return
  }

  next()
}

/**
 * Moderator Authorization Middleware
 * Checks if user has moderator or admin role
 */
export const moderatorMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    })
    return
  }

  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    res.status(403).json({
      success: false,
      message: 'Moderator access required.',
    })
    return
  }

  next()
}
