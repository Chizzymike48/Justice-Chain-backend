import rateLimit from 'express-rate-limit'
import { Request } from 'express'

/**
 * Rate limiting configuration for different endpoint types
 * Protects against abuse and resource exhaustion
 */

/**
 * Standard rate limiter for general API endpoints
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health'
  },
})

/**
 * Auth rate limiter for login endpoints
 * 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Export rate limiter for data export endpoints
 * Prevents abuse of resource-intensive export operations
 * 5 requests per 15 minutes per user (via user ID in request)
 */
export const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many export requests. Please wait before requesting another export.',
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID if available, fall back to IP
  keyGenerator: (req: Request) => {
    return (req as any).user?.id || req.ip || 'anonymous'
  },
  skip: (req: Request) => {
    // Only apply to admin users and above for export endpoints
    // Non-admin users get lower rate limit
    return false
  },
})

/**
 * Strict rate limiter for admin operations
 * More lenient for admins doing batch operations
 * 20 requests per 15 minutes
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Admin request limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (req as any).user?.id || req.ip || 'anonymous'
  },
})

/**
 * Socket.io connection rate limiter
 * Prevents connection spam
 * 10 connections per 15 minutes per IP
 */
export const socketConnectionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many socket connections',
  standardHeaders: false,
  legacyHeaders: false,
  skip: () => false,
})
