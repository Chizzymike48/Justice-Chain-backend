import React from 'react';
import * as Sentry from '@sentry/react';
import { captureException, addBreadcrumb } from '../../utils/sentry';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component using Sentry for error capture
 * Catches React render errors and logs them to Sentry
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to console
    console.error('Error caught by boundary:', error, errorInfo);

    // Log to Sentry
    addBreadcrumb('Error boundary caught', 'error', 'error', {
      componentStack: errorInfo.componentStack,
    });

    captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4v2m0 4v2M6.73 5.27l1.415 1.414m9.704 9.704l1.414 1.414M6.73 18.73l1.415-1.415m9.704-9.704l1.414-1.414"
                  />
                </svg>
              </div>
              <h1 className="mt-4 text-xl font-semibold text-center text-gray-900">
                Oops! Something went wrong
              </h1>
              <p className="mt-2 text-center text-gray-600 text-sm">
                We're sorry for the inconvenience. Our team has been notified and is working on a fix.
              </p>
              <details className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-700 overflow-auto max-h-40">
                <summary className="cursor-pointer font-semibold">Error details</summary>
                <pre className="mt-2 text-gray-600">{this.state.error?.message}</pre>
              </details>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.history.back()}
                className="mt-2 w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Go Back
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

const SentryErrorBoundary = Sentry.withErrorBoundary(ErrorBoundary, {
  fallback: (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">Application Error</h1>
        <p className="mt-2 text-gray-600">Please reload the page or contact support.</p>
      </div>
    </div>
  ),
});

SentryErrorBoundary.displayName = 'SentryErrorBoundary';

export default SentryErrorBoundary;
