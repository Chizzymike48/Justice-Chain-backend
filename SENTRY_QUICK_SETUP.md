# Sentry Integration - Quick Setup Guide

## ⚡ 5-Minute Setup

### 1. Create Sentry Account
```bash
# Go to https://sentry.io
# Sign up for free account
# Create new organization
```

### 2. Create Projects
- **Frontend Project:** JavaScript/React
- **Backend Project:** Node.js

### 3. Get DSNs
```
Frontend: https://[key]@[org].ingest.sentry.io/[project-id]
Backend:  https://[key]@[org].ingest.sentry.io/[project-id]
```

### 4. Configure Environment

**Frontend (`.env.local`):**
```env
VITE_SENTRY_DSN=https://[your-frontend-dsn]
VITE_RELEASE_VERSION=1.0.0
```

**Backend (`.env.local`):**
```env
SENTRY_DSN=https://[your-backend-dsn]
RELEASE_VERSION=1.0.0
```

### 5. Test Integration

**Frontend:**
```typescript
import { captureException } from '@/utils/sentry'

// In component or handler:
try {
  throw new Error('Test error')
} catch (error) {
  captureException(error)
}
```

**Backend:**
```typescript
import { captureError } from '@/config/sentry'

// In controller or service:
try {
  throw new Error('Test error')
} catch (error) {
  captureError(error as Error)
}
```

---

## 🎯 Common Usage Patterns

### Track User Actions
```typescript
// Frontend
import { trackUserAction } from '@/utils/sentry'
trackUserAction('Report submitted', { reportType: 'corruption' })

// Backend
import { addBreadcrumb } from '@/config/sentry'
addBreadcrumb('Report processed', 'report')
```

### Set User Context
```typescript
// Frontend
import { setSentryUser } from '@/utils/sentry'
setSentryUser(userId, email, username)

// Backend
import { setUserContext } from '@/config/sentry'
setUserContext(userId, email, username)
```

### Capture Form Errors
```typescript
// Frontend
import { captureFormError } from '@/utils/sentry'
captureFormError('LoginForm', 'email', 'Invalid email format')
```

### Track API Calls
```typescript
// Frontend
import { trackApiCall } from '@/utils/sentry'
trackApiCall('POST', '/api/reports', 201, 145)
```

---

## 📊 Sentry Dashboard

### View Errors
1. Go to Sentry dashboard
2. Click "Issues" tab
3. See all errors grouped by type
4. Click error to see:
   - Stack trace
   - User affected
   - Breadcrumbs (what led to error)
   - Session replay (if enabled)

### View Performance
1. Go to Sentry dashboard
2. Click "Performance" tab
3. See transaction durations
4. Identify slow endpoints/pages

### Set Up Alerts
1. Go to "Alerts" tab
2. Click "Create Alert Rule"
3. Set conditions (errors > 5 per minute)
4. Choose notification method (email, Slack)

---

## 🔐 Privacy Settings

### Mask Sensitive Data
Sentry automatically masks:
- Form field values (password, credit card)
- Cookies and headers with 'auth'
- API keys and tokens

### Custom Masking
```typescript
// In Sentry config
beforeSend(event) {
  if (event.request?.cookies?.sessionId) {
    event.request.cookies.sessionId = '[REDACTED]'
  }
  return event
}
```

---

## 💡 Best Practices

✅ **Do:**
- Set user context on login/logout
- Use breadcrumbs for important events
- Capture form submission errors
- Monitor API performance
- Set meaningful tags (env, version)

❌ **Don't:**
- Capture passwords or PII directly
- Send excessive debug logs
- Sample rate too high (increases costs)
- Ignore Sentry alerts

---

## 🐛 Debugging

### Check if Sentry is working

**Frontend Console:**
```javascript
// Check if initialized
console.log(window.__SENTRY_RELEASE__)

// Trigger test event
Sentry.captureMessage('Test message', 'info')
```

**Backend Logs:**
```bash
# Look for Sentry initialization message
npm run dev

# Should see: "Sentry initialized" or DSN info
```

### Common Issues

| Issue | Solution |
|-------|----------|
| No events showing | Check DSN in .env, restart app |
| Sample rate too low | Increase in dev (set to 1.0) |
| Events not grouped | Add release version |
| High costs | Reduce sample rate in prod |

---

## 📱 Mobile Testing

### Test on Device
```bash
# Build frontend
npm run build

# Serve dist folder
npx serve dist

# Access on mobile via local IP
# Check Sentry dashboard
```

---

## 🚀 Production Checklist

- [ ] Sentry account created
- [ ] Both projects created
- [ ] DSNs configured in .env
- [ ] Error boundary working
- [ ] Backend middleware active
- [ ] Test errors captured
- [ ] Alerts configured
- [ ] Team invited to Sentry
- [ ] Data retention set
- [ ] GitHub integration linked

---

## 📞 Support

- **Sentry Docs:** https://docs.sentry.io
- **Status Page:** https://status.sentry.io
- **Support:** https://sentry.io/support

**Questions?** Check the comprehensive guide in `PHASE4.7_SENTRY_MONITORING.md`
