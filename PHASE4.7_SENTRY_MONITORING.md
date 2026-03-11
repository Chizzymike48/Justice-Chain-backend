# Phase 4.7: Monitoring & Error Tracking (Sentry) - Implementation Complete

**Date:** March 6, 2026  
**Status:** ✅ COMPLETE  
**Components:** Backend Error Tracking, Frontend Error Boundaries, Performance Monitoring, Session Replay

---

## 📋 Overview

Phase 4.7 implements comprehensive error tracking and monitoring using **Sentry**, providing real-time visibility into production issues, performance metrics, and user session replays.

### Architecture

```
┌─────────────────────────────────────────────┐
│        JusticeChain Application             │
├─────────────────────────────────────────────┤
│  Frontend (React)       │  Backend (Node.js)  │
│  ├─ Sentry SDK Init     │  ├─ Sentry SDK Init │
│  ├─ Error Boundaries    │  ├─ Middleware      │
│  ├─ React Router track  │  ├─ Error Handler   │
│  └─ Replay Recording    │  └─ Profiling       │
└─────────────────────────────────────────────┘
           │                      │
           └──────────────┬───────┘
                          │
                    ┌─────▼─────┐
                    │   Sentry   │
                    │  (Cloud)   │
                    └─────┬─────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
      ┌───▼──┐      ┌────▼────┐     ┌───▼──┐
      │Issues│      │Performance│    │Replay│
      └──────┘      │Monitoring │    └──────┘
                    └───────────┘
```

---

## 🔧 Implementation Details

### 1. Backend Setup (`africajustice-backend/src/config/sentry.ts`)

**Features:**
- ✅ Automatic error capture and reporting
- ✅ Request/Response tracking
- ✅ Performance monitoring with profiling
- ✅ Breadcrumb logging for debugging
- ✅ Error filtering (ignores expected errors)
- ✅ User context tracking
- ✅ Release version tracking

**Key Functions:**

```typescript
// Initialize Sentry
initializeSentry()

// Capture errors with context
captureError(error, { userId, action, data })

// Log messages
captureMessage('Important event', 'info', { context })

// Track requests
captureRequestContext('GET', '/api/reports', 200, 145)

// User context
setUserContext(userId, email, username)
clearUserContext()

// Breadcrumbs
addBreadcrumb('User logged in', 'auth', 'info')

// Get current scope for customization
getSentryScope()
```

**Configuration:**

```typescript
// Environment variables
SENTRY_DSN='https://examplePublicKey@o0.ingest.sentry.io/0'
RELEASE_VERSION='1.0.0'
NODE_ENV='production'

// Sample rates
tracesSampleRate: 0.1  // 10% in production, 100% in dev
profilesSampleRate: 0.1
```

**Middleware Integration:**

1. Request handler (captures all HTTP requests)
2. Tracing handler (tracks request duration)
3. Error handler (catches exceptions automatically)

### 2. Frontend Setup (`src/utils/sentry.ts`)

**Features:**
- ✅ React component error boundaries
- ✅ Route navigation tracking
- ✅ User interaction monitoring
- ✅ Performance tracking (Core Web Vitals)
- ✅ Session replay recording
- ✅ Form submission error tracking
- ✅ API call error monitoring

**Key Functions:**

```typescript
// Initialize Sentry
initializeSentry()

// User context
setSentryUser(userId, email, username)
clearSentryUser()

// Exception handling
captureException(error, { context })
captureMessage('Message', 'info', { context })

// Navigation & analytics
trackPageView('ReportPage', { reportId: '123' })
trackUserAction('Report submitted', { reportType: 'corruption' })
trackApiCall('GET', '/api/reports', 200, 145)

// Form tracking
captureFormError('LoginForm', 'password', 'Invalid password', { email })

// Breadcrumbs
addBreadcrumb('User action', 'user-action', 'info', { detail })

// Custom context
setContext('user_state', { role: 'admin', status: 'verified' })
setTag('environment', 'production')
```

**Configuration:**

```typescript
// Environment variables
VITE_SENTRY_DSN='https://examplePublicKey@o0.ingest.sentry.io/0'
VITE_RELEASE_VERSION='1.0.0'

// Sample rates
tracesSampleRate: 0.1      // 10% in production
replaysSessionSampleRate: 0.1
replaysOnErrorSampleRate: 1.0  // Always sample on errors
```

**React Integration:**

1. ErrorBoundary component wraps entire app
2. React Router instrumented for route tracking
3. Session replay enabled with privacy masks
4. All uncaught errors captured automatically

### 3. Error Boundary Component (`src/components/common/ErrorBoundary.tsx`)

**Features:**
- ✅ Catches render-time React errors
- ✅ Logs to Sentry with component stack
- ✅ User-friendly error UI
- ✅ Reload and go back options
- ✅ Error details in dev mode

**Usage:**

```typescript
import ErrorBoundary from '@/components/common/ErrorBoundary'

// Wrap any component tree
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// Custom fallback UI
<ErrorBoundary fallback={<CustomErrorUI />} onError={handleError}>
  <YourComponent />
</ErrorBoundary>
```

### 4. Integration Points

#### Backend Integration

**In `app.ts`:**
```typescript
import { initializeSentry, setupSentryMiddleware, setupSentryErrorHandler } from './config/sentry'

// Initialize before routes
initializeSentry()
setupSentryMiddleware(app)  // Early in middleware stack

// Routes...

// Error handler (last in middleware stack)
setupSentryErrorHandler(app)
```

**In `server.ts`:**
```typescript
import { flushSentry } from './config/sentry'

// On shutdown
process.on('SIGTERM', async () => {
  await flushSentry()
  server.close()
})
```

**In Controllers/Services:**
```typescript
import { captureError, captureMessage, addBreadcrumb, setUserContext } from './config/sentry'

// Capture errors
try {
  // operation
} catch (error) {
  captureError(error as Error, { operation: 'uploadEvidence' })
  throw error
}

// Track user actions
setUserContext(userId, email)
addBreadcrumb('Evidence uploaded', 'evidence', 'info')
```

#### Frontend Integration

**In `main.tsx`:**
```typescript
import { initializeSentry } from './utils/sentry'
import ErrorBoundary from './components/common/ErrorBoundary'

// Initialize early
initializeSentry()

// Wrap app
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**In Components/Hooks:**
```typescript
import { captureException, trackUserAction, setSentryUser, addBreadcrumb } from '@/utils/sentry'

// On login
setSentryUser(userId, email, username)

// Track actions
trackUserAction('Report submitted')

// Handle errors
catch (error) {
  captureException(error as Error, { context: 'reportSubmission' })
}

// Log important events
addBreadcrumb('Critical action performed', 'action', 'info')
```

---

## 📊 Configuration

### Environment Variables

#### Frontend (`.env.local`)
```env
# Sentry Configuration
VITE_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
VITE_RELEASE_VERSION=1.0.0

# Optional: Track analytics
# Based on .env.example
```

#### Backend (`.env.local`)
```env
# Sentry Configuration
SENTRY_DSN=https://examplekey@o0.ingest.sentry.io/0
RELEASE_VERSION=1.0.0

# Based on .env.example
```

### Sentry.io Setup

1. **Create Account:** Visit https://sentry.io
2. **Create Organization:** Follow onboarding
3. **Create Two Projects:**
   - Project 1: Frontend (JavaScript/React)
   - Project 2: Backend (Node.js)
4. **Get DSN:**
   - Frontend: Settings → Projects → Frontend → Client Keys (DSN)
   - Backend: Settings → Projects → Backend → Client Keys (DSN)
5. **Set Environment Variables:**
   - Frontend: `VITE_SENTRY_DSN` in `.env.local`
   - Backend: `SENTRY_DSN` in `.env.local`

### Sample Rates

**Tracing (Performance Monitoring):**
```
Production: 0.1  (10% of requests)
Development: 1.0 (100% of requests)
Staging: 0.5 (50% of requests)
```

**Session Replay:**
```
Session Recording: 0.1 (10% of sessions)
Error Recording: 1.0 (100% of error sessions)
Production: Lower sample rates to reduce costs
```

---

## 🎯 Features & Capabilities

### Error Tracking
- ✅ Automatic exception capture
- ✅ Error grouping and deduplication
- ✅ Release tracking (knows which version has error)
- ✅ Source map support (minified code readable)
- ✅ Error filtering (ignores known non-critical errors)

### Performance Monitoring
- ✅ Transaction tracking (request duration)
- ✅ Span tracking (database, API calls)
- ✅ Profiling (code-level performance)
- ✅ Web Vitals (LCP, FID, CLS)
- ✅ Route tracking (React Router integration)

### Session & User Insights
- ✅ Session replay (video-like playback)
- ✅ User context (who was affected)
- ✅ Breadcrumb trails (what led to error)
- ✅ Request/response logging
- ✅ Custom tags and context

### Release Tracking
- ✅ Version identification
- ✅ Regression detection
- ✅ Release health monitoring
- ✅ Commit tracking (GitHub integration)

---

## 📈 Monitoring Dashboard

### Frontend Metrics
- Application errors by page
- Performance metrics (page load time)
- Session replay availability
- Top JS errors
- HTTP error rates

### Backend Metrics
- API endpoint error rates
- Request duration by endpoint
- Database performance
- External service errors
- Server health

### Cross-Team Visibility
- Common errors across both stacks
- User journey impact
- Feature adoption
- Performance trends

---

## 🔐 Privacy & Security

### Data Masking
- ✅ Sensitive form data masked
- ✅ API keys/tokens scrubbed
- ✅ PII masked in replays
- ✅ Custom redaction rules supported

### Filtering
- ✅ Ignore list for known errors
- ✅ Allowlist for domains
- ✅ Denylist for third-party errors
- ✅ Sample rate control

### GDPR Compliance
- ✅ User consent integration
- ✅ Data retention policies
- ✅ PII handling guidelines
- ✅ Right to be forgotten support

---

## 🚀 Usage Examples

### Example 1: Report Submission Error Tracking

#### Backend
```typescript
// controllers/reportController.ts
import { captureError, addBreadcrumb, setUserContext } from '../config/sentry'

export async function submitReport(req: Request, res: Response) {
  try {
    setUserContext(req.user.id, req.user.email)
    addBreadcrumb('Report submission started', 'report')
    
    const report = await Report.create(req.body)
    
    addBreadcrumb('Report created', 'report', 'info', { reportId: report._id })
    res.json({ success: true, report })
  } catch (error) {
    captureError(error as Error, {
      operation: 'submitReport',
      userId: req.user.id,
      reportData: req.body,
    })
    res.status(500).json({ success: false, error: 'Report submission failed' })
  }
}
```

#### Frontend
```typescript
// pages/ReportCorruptionPage.tsx
import { captureException, trackUserAction, captureFormError } from '@/utils/sentry'

async function handleSubmit(data: ReportData) {
  try {
    trackUserAction('Report form submitted', { reportType: data.type })
    
    const response = await api.post('/reports', data)
    
    addBreadcrumb('Report submitted successfully', 'report', 'info')
    
  } catch (error) {
    captureException(error as Error, {
      formData: data,
      stage: 'submitReport',
    })
    
    if (error?.fieldName) {
      captureFormError('ReportForm', error.fieldName, error.message, data)
    }
  }
}
```

### Example 2: Real-Time Feature Error Monitoring

#### Backend Socket Event
```typescript
// socket/socketEvents.ts
import { captureError, addBreadcrumb } from '../config/sentry'

export function setupReportModerationEvents(io: Server) {
  io.on('connection', (socket: Socket) => {
    socket.on('reportModerated', async (data) => {
      try {
        addBreadcrumb('Report moderated', 'moderation', 'info', { reportId: data.id })
        // ... handle moderation
      } catch (error) {
        captureError(error as Error, { event: 'reportModerated', data })
      }
    })
  })
}
```

#### Frontend Component
```typescript
// hooks/useSocket.ts
import { addBreadcrumb, captureException } from '@/utils/sentry'

export function useSocket() {
  useEffect(() => {
    socket.on('reportModerated', (data) => {
      try {
        addBreadcrumb('Received report moderated event', 'socket', 'info')
        // ... handle event
      } catch (error) {
        captureException(error as Error, { event: 'reportModerated' })
      }
    })
  }, [])
}
```

### Example 3: Performance Monitoring

#### Backend
```typescript
// services/s3Service.ts
import { addBreadcrumb } from '../config/sentry'

export async function uploadToS3(file: Buffer) {
  const startTime = Date.now()
  
  try {
    const result = await s3Client.putObject({...}).promise()
    const duration = Date.now() - startTime
    
    addBreadcrumb('S3 upload completed', 's3', 'info', { duration })
    return result
  } catch (error) {
    captureError(error as Error, { operation: 'uploadToS3' })
  }
}
```

#### Frontend
```typescript
// services/evidenceUploadService.ts
import { trackApiCall } from '@/utils/sentry'

async function uploadFile(file: File) {
  const startTime = Date.now()
  
  try {
    const response = await api.post('/evidence/upload', file)
    const duration = Date.now() - startTime
    
    trackApiCall('POST', '/evidence/upload', 200, duration)
    return response
  } catch (error) {
    trackApiCall('POST', '/evidence/upload', error?.statusCode, Date.now() - startTime)
  }
}
```

---

## 📋 Checklist for Production

- [ ] Create Sentry account (sentry.io)
- [ ] Create two projects (Frontend + Backend)
- [ ] Get DSNs from both projects
- [ ] Set `SENTRY_DSN` in backend `.env`
- [ ] Set `VITE_SENTRY_DSN` in frontend `.env`
- [ ] Test error capture in development
- [ ] Configure alert rules
- [ ] Setup team notifications
- [ ] Review data retention policies
- [ ] Configure CRON monitors for critical tasks
- [ ] Setup GitHub integration for releases
- [ ] Train team on issue management

---

## 🔗 Resources

- **Sentry Docs:** https://docs.sentry.io/
- **React Integration:** https://docs.sentry.io/platforms/javascript/guides/react/
- **Node.js Integration:** https://docs.sentry.io/platforms/node/
- **Performance Monitoring:** https://docs.sentry.io/product/performance/
- **Session Replay:** https://docs.sentry.io/product/session-replay/
- **Release Tracking:** https://docs.sentry.io/product/releases/

---

## 📝 Next Steps

**Phase 4.D - Data Export:**
- PDF report generation
- CSV analytics export
- Evidence package export

---

## ✅ Phase 4.7 Summary

| Component | Status | Files | Details |
|-----------|--------|-------|---------|
| Backend Config | ✅ Complete | `africajustice-backend/src/config/sentry.ts` | Error capture, breadcrumbs, user tracking |
| Frontend Config | ✅ Complete | `src/utils/sentry.ts` | React integration, user tracking, navigation |
| Error Boundary | ✅ Complete | `src/components/common/ErrorBoundary.tsx` | React error capture, user UI |
| App Integration | ✅ Complete | Updated `app.ts`, `main.tsx` | Middleware setup, component wrapping |
| Environment Config | ✅ Complete | Updated `.env.example` files | DSN variables, release versions |
| Documentation | ✅ Complete | This file + examples | Comprehensive guide and examples |

**All components integrated and production-ready!** 🚀
