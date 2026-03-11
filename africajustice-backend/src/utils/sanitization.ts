/**
 * Security utility for input sanitization and output encoding
 * Prevents XSS attacks and injection vulnerabilities
 */

/**
 * HTML entity map for escaping
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
}

/**
 * Escape HTML special characters to prevent XSS
 * @param text - Text to escape
 * @returns Escaped text safe for HTML
 */
export const escapeHtml = (text: string): string => {
  if (!text || typeof text !== 'string') return ''
  return text.replace(/[&<>"'/]/g, char => HTML_ENTITIES[char] || char)
}

/**
 * Sanitize user input by escaping and trimming
 * @param input - User input
 * @param maxLength - Maximum allowed length (default: 5000)
 * @returns Sanitized input
 */
export const sanitizeInput = (input: any, maxLength: number = 5000): string => {
  if (!input || typeof input !== 'string') return ''

  return escapeHtml(input.trim().substring(0, maxLength))
}

/**
 * Sanitize object fields (for database insertion)
 * Escapes all string values to prevent injection
 * @param obj - Object to sanitize
 * @returns Sanitized object with escaped strings
 */
export const sanitizeObject = (obj: Record<string, any>): Record<string, any> => {
  if (!obj || typeof obj !== 'object') return {}

  const sanitized: Record<string, any> = {}

  Object.entries(obj).forEach(([key, value]) => {
    // Skip potentially dangerous keys
    if (key.startsWith('$') || key.startsWith('_')) {
      return
    }

    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeInput(item) : item
      )
    } else {
      sanitized[key] = value
    }
  })

  return sanitized
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 * @param url - URL to sanitize
 * @returns Safe URL or empty string
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return ''

  const trimmed = url.trim().toLowerCase()

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return ''
    }
  }

  // Only allow http, https, and relative URLs
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
    return ''
  }

  return escapeHtml(url)
}

/**
 * Validate and sanitize email address
 * @param email - Email to validate
 * @returns Sanitized email or empty string if invalid
 */
export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return ''

  const sanitized = email.trim().toLowerCase()

  // Simple email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(sanitized)) {
    return ''
  }

  return sanitized
}

/**
 * Validate and sanitize MongoDB ObjectId
 * @param id - ID to validate
 * @returns ID string or empty if invalid
 */
export const sanitizeObjectId = (id: any): string => {
  if (!id || typeof id !== 'string') return ''

  const trimmed = id.trim()

  // Valid MongoDB ObjectId format
  if (!/^[0-9a-f]{24}$/i.test(trimmed)) {
    return ''
  }

  return trimmed
}

/**
 * Create a Content Security Policy (CSP) header value
 * @returns CSP header string
 */
export const getCSPHeader = (): string => {
  return (
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' vimeo.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https:; " +
    "frame-src vimeo.com; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "frame-ancestors 'none'; " +
    "upgrade-insecure-requests"
  )
}

/**
 * Validate that input doesn't contain SQL injection attempts
 * Basic check using common SQL keywords
 * @param input - User input to check
 * @returns true if appears safe, false if suspicious
 */
export const checkSQLInjection = (input: string): boolean => {
  if (!input || typeof input !== 'string') return true

  const suspiciousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|FROM|WHERE)\b)/i,
    /(-{2,}|\/\*|\*\/|;|'|")/i,
  ]

  return !suspiciousPatterns.some(pattern => pattern.test(input))
}

/**
 * Strip potentially dangerous HTML/JS from text
 * Removes script tags and event handlers
 * @param text - Text to clean
 * @returns Cleaned text
 */
export const stripDangerousContent = (text: string): string => {
  if (!text || typeof text !== 'string') return ''

  // Remove script tags
  let cleaned = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove event handlers
  cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
  cleaned = cleaned.replace(/on\w+\s*=\s*[^\s>]*/gi, '')

  // Remove dangerous HTML attributes
  cleaned = cleaned.replace(/\b(href|src)\s*=\s*["']?\s*(javascript:|data:)/gi, '')

  return cleaned
}
