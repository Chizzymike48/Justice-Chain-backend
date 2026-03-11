import { randomBytes } from 'crypto'
import { v4 as uuidv4 } from 'uuid'

/**
 * Generate a cryptographically secure random ID
 * Uses UUID v4 for guaranteed uniqueness
 * @returns UUID string
 */
export const generateId = (): string => {
  return uuidv4()
}

/**
 * Generate a cryptographically secure random token
 * Useful for reset tokens, verification codes, etc.
 * @param length - Length of the token in bytes (default: 32)
 * @returns Base64-encoded random token
 */
export const generateSecureToken = (length: number = 32): string => {
  return randomBytes(length).toString('hex')
}

/**
 * Generate a short verification code (6 digits)
 * Useful for email/SMS verification
 * @returns 6-digit numeric string
 */
export const generateVerificationCode = (): string => {
  const min = 100000
  const max = 999999
  return Math.floor(Math.random() * (max - min + 1) + min).toString()
}

/**
 * Get current ISO timestamp
 * @returns ISO 8601 formatted timestamp
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString()
}

/**
 * Format date for display
 * @param date - Date object or ISO string
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format date and time for display
 * @param date - Date object or ISO string
 * @returns Formatted datetime string
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Calculate time difference in human-readable format
 * @param date - Date object or ISO string
 * @returns Human-readable time difference (e.g., "2 hours ago")
 */
export const timeAgo = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`

  return formatDate(d)
}

/**
 * Validate if string is a valid MongoDB ObjectId
 * @param id - String to validate
 * @returns true if valid ObjectId
 */
export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

/**
 * Slugify a string (convert to URL-safe format)
 * @param text - Text to slugify
 * @returns Slugified string
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/--+/g, '-')
}

/**
 * Truncate text to specified length with ellipsis
 * @param text - Text to truncate
 * @param length - Max length
 * @returns Truncated text
 */
export const truncateText = (text: string, length: number = 100): string => {
  if (text.length <= length) return text
  return text.substring(0, length).trim() + '...'
}
