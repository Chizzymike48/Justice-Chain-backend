import * as Sentry from '@sentry/react'

const environment = import.meta.env.MODE || 'development'
const sentryDsn = import.meta.env.VITE_SENTRY_DSN
const releaseVersion = import.meta.env.VITE_RELEASE_VERSION || '1.0.0'

/**
 * Initialize Sentry for frontend error tracking and performance monitoring
 */
export function initializeSentry(): void {
  if (!sentryDsn) {
    console.warn('VITE_SENTRY_DSN not configured, error tracking disabled')
    return
  }

  Sentry.init({
    dsn: sentryDsn,
    environment,
    release: releaseVersion,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
        maskAllInputs: true,
      }),
    ],
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    tracePropagationTargets: ['localhost', /^\//],
    replaysSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: [
      'NetworkError',
      'Network request failed',
      'Failed to fetch',
      'ResizeObserver loop limit exceeded',
      'chrome-extension://',
      'moz-extension://',
      /top\.GLOBALS/,
    ],
    allowUrls: [
      /https?:\/\/localhost/,
      /https?:\/\/(api\.)?justicechain\./,
    ],
  })
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(userId: string, email?: string, username?: string): void {
  if (!sentryDsn) return

  Sentry.setUser({
    id: userId,
    email,
    username,
  })
}

/**
 * Clear user context
 */
export function clearSentryUser(): void {
  if (!sentryDsn) return

  Sentry.setUser(null)
}

/**
 * Capture an exception
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (!sentryDsn) {
    console.error('Error:', error, context)
    return
  }

  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  })
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Record<string, unknown>
): void {
  if (!sentryDsn) {
    console.log(`[${level.toUpperCase()}] ${message}`, context)
    return
  }

  Sentry.captureMessage(message, {
    level,
    contexts: {
      custom: context,
    },
  })
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(
  message: string,
  category: string = 'custom',
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  data?: Record<string, unknown>
): void {
  if (!sentryDsn) return

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  })
}

/**
 * Track page view
 */
export function trackPageView(pageName: string, properties?: Record<string, unknown>): void {
  addBreadcrumb(`Viewed ${pageName}`, 'navigation', 'info', properties)
}

/**
 * Track user action
 */
export function trackUserAction(action: string, details?: Record<string, unknown>): void {
  addBreadcrumb(`User ${action}`, 'user-action', 'info', details)
}

/**
 * Track API call
 */
export function trackApiCall(
  method: string,
  endpoint: string,
  statusCode?: number,
  duration?: number
): void {
  const level = statusCode && statusCode >= 400 ? 'warning' : 'info'
  addBreadcrumb(
    `${method} ${endpoint}`,
    'http',
    level,
    {
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
    }
  )
}

/**
 * Capture form submission error
 */
export function captureFormError(
  formName: string,
  fieldName: string,
  error: string,
  data?: Record<string, unknown>
): void {
  if (!sentryDsn) {
    console.error(`Form error in ${formName}.${fieldName}: ${error}`, data)
    return
  }

  addBreadcrumb(
    `Form error: ${formName}`,
    'form',
    'warning',
    {
      field: fieldName,
      error,
      ...data,
    }
  )
}

/**
 * Set custom context
 */
export function setContext(name: string, context: Record<string, unknown>): void {
  if (!sentryDsn) return

  Sentry.setContext(name, context)
}

/**
 * Set tag for filtering
 */
export function setTag(key: string, value: string | number | boolean): void {
  if (!sentryDsn) return

  Sentry.setTag(key, value)
}

export default Sentry
