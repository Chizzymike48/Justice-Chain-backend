import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import type { Express, NextFunction, Request, Response } from 'express';

const environment = process.env.NODE_ENV || 'development';
const sentryDsn = process.env.SENTRY_DSN;
const releaseVersion = process.env.RELEASE_VERSION || '1.0.0';

/**
 * Initialize Sentry for backend error tracking and performance monitoring
 */
export function initializeSentry(): void {
  if (!sentryDsn) {
    console.warn('SENTRY_DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment,
    release: releaseVersion,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Ignore certain errors that are expected
    ignoreErrors: [
      // Network errors
      'NetworkError',
      'Network request failed',
      'Failed to fetch',
      // Browser extensions
      'top.GLOBALS',
      // Random plugins/extensions
      "Can't execute code from a freed script",
      "Can't find variable: ZiteReader",
      // See http://toolbar.conduit.com/Developer/HtmlAndGadget
      'jigsaw is not defined',
      'ComboSearch is not defined',
      // http://metrics.itunes.apple.com/
      'Object.DeepCopyUndefinedHandler',
      // See http://toolbar.conduit.com/Developer/JSInjection
      'conduitPage',
      // Generic error messages that are useless
      'Non-Error promise rejection captured',
      'Script error',
      'ResizeObserver loop limit exceeded',
    ],
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
      // Ignore errors from third-party scripts
      /graph\.instagram\.com/i,
      /connect\.facebook\.net/i,
    ],
  });
}

/**
 * Setup Sentry middleware for Express
 * Should be called before other middleware and route handlers
 */
export function setupSentryMiddleware(app: Express): void {
  if (!sentryDsn) return;

  // Tracing middleware for performance monitoring
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.once('finish', () => {
      const duration = Date.now() - start;
      const breadcrumb = {
        category: 'http',
        message: `${req.method} ${req.path}`,
        level: 'info' as const,
        data: {
          method: req.method,
          url: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
        },
      };
      Sentry.captureMessage(breadcrumb.message);
    });
    next();
  });
}

/**
 * Setup Sentry error handler middleware
 * Should be called after all other middleware and routes
 */
export function setupSentryErrorHandler(app: Express): void {
  if (!sentryDsn) return;

  app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
    Sentry.captureException(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: environment === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
    });
  });
}

/**
 * Capture an error with additional context
 */
export function captureError(
  error: Error,
  context: Record<string, unknown> = {}
): void {
  if (!sentryDsn) {
    console.error('Error:', error, context);
    return;
  }

  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
}

/**
 * Capture a message with severity level
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context: Record<string, unknown> = {}
): void {
  if (!sentryDsn) {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    contexts: {
      custom: context,
    },
  });
}

/**
 * Add breadcrumb for tracking events
 */
export function addBreadcrumb(
  message: string,
  category: string = 'custom',
  level: Sentry.SeverityLevel = 'info',
  data: Record<string, unknown> = {}
): void {
  if (!sentryDsn) return;

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string, username?: string): void {
  if (!sentryDsn) return;

  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
  if (!sentryDsn) return;

  Sentry.setUser(null);
}

/**
 * Capture HTTP request details
 */
export function captureRequestContext(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  error?: string
): void {
  if (!sentryDsn) return;

  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warning' : 'info';
  
  addBreadcrumb(
    `${method} ${path}`,
    'http',
    level,
    {
      statusCode,
      duration: `${duration}ms`,
      error,
    }
  );
}

/**
 * Flush Sentry before shutdown
 */
export async function flushSentry(): Promise<boolean> {
  if (!sentryDsn) return Promise.resolve(true);

  try {
    return await Sentry.close(2000);
  } catch (error) {
    console.error('Error flushing Sentry:', error);
    return false;
  }
}

/**
 * Get current Sentry scope for modifications
 */
export function getSentryScope(): Sentry.Scope {
  return Sentry.getCurrentScope();
}

export default Sentry;
