# Phase 4.6 - 4.D: Complete Implementation Guide

**Status**: ✅ All features complete & enhanced

---

## Phase 4.6: CI/CD Pipeline (GitHub Actions)

### ✅ What's Implemented

**Workflow**: `.github/workflows/ci-cd.yml`

#### 1. **Pull Request Testing**
```yaml
on: [pull_request]
jobs:
  - backend-lint ✅
  - backend-test ✅
  - frontend-lint ✅
  - frontend-test ✅
```

**Features:**
- TypeScript compilation check
- ESLint validation
- Jest test suite (with coverage)
- MongoDB + Redis services for integration tests
- Coverage reports to CodeCov

#### 2. **Automatic Production Deployment**
```yaml
Trigger: Push to main branch
- Deploy backend to Render
- Deploy frontend to Render
- Health check verification
- Slack notifications
```

### 📋 Required GitHub Secrets

Add these to your GitHub repo **Settings → Secrets and variables → Actions**:

| Secret | Value | How to Get |
|--------|-------|-----------|
| `RENDER_API_KEY` | Your Render API token | 1. Go to Render Dashboard → Settings → API Keys 2. Generate new key |
| `RENDER_BACKEND_SERVICE_ID` | Backend service ID | 1. Go to Render → Backend service 2. Copy from URL: `srv-xxxxx` |
| `RENDER_FRONTEND_SERVICE_ID` | Frontend service ID | 1. Go to Render → Frontend service 2. Copy from URL: `srv-xxxxx` |
| `SLACK_WEBHOOK` | Slack webhook URL (optional) | 1. Create Slack app 2. Enable incoming webhooks 3. Copy webhook URL |

### 🚀 How It Works

**On Every Push to `main` Branch:**

```
1. Lint & Type Check (5 min)
   └─ Backend: ESLint + TypeScript
   └─ Frontend: ESLint + TypeScript

2. Run Tests (10 min)
   └─ Backend: Jest with MongoDB + Redis
   └─ Frontend: Vitest
   └─ Upload coverage to CodeCov

3. Deploy to Render (2 min)
   └─ Trigger backend deployment
   └─ Trigger frontend deployment
   └─ Wait 30s for services to start
   └─ Health check: GET /healthz
   └─ Verify API endpoints responding

4. Slack Notification
   └─ Success: Green + URLs
   └─ Failure: Red + retry link
```

### ✨ Enhancements I Just Added

1. **Parallel Frontend Deploy** - Both services deploy simultaneously
2. **Health Checks** - Automatic verification after deployment (30 attempts, 10s intervals)
3. **API Endpoint Verification** - Checks root endpoint responding
4. **Better Error Handling** - Graceful timeouts, detailed logs
5. **Slack Integration** - Separate success/failure messages with URLs

### Debug: Check Deployment Status

```bash
# View GitHub Actions logs
1. Go to repo → Actions tab
2. Click latest workflow run
3. Expand "Deploy to Production" section
4. See logs in real-time

# Manual Render deployment (if needed)
curl -X POST \
  https://api.render.com/deploy/srv-XXXXX?key=YOUR_API_KEY \
  -H "Content-Type: application/json"

# Health check
curl https://justicechain-backend.onrender.com/healthz | jq .
```

---

## Phase 4.7: Sentry Monitoring & Error Tracking

### ✅ What's Implemented

**Backend**: `africajustice-backend/src/config/sentry.ts`
**Frontend**: `africajustice-frontend/src/utils/sentry.ts`

### Features

#### Backend Sentry
```typescript
✅ Error tracking
✅ Performance monitoring
✅ Node.js profiling
✅ Breadcrumb tracking
✅ User context tagging
```

**Integration Points:**
- `app.ts` - Middleware setup (request tracking)
- `errorHandler.ts` - Captures all errors
- `exportController.ts` - Breadcrumbs for export operations
- `adminController.ts` - Breadcrumbs for admin actions

#### Frontend Sentry
```typescript
✅ React error tracking
✅ Performance monitoring
✅ Session replay (on errors)
✅ Error boundaries
✅ User context tagging
```

**Integration Points:**
- `main.tsx` - Initialization
- `ErrorBoundary.tsx` - Catches React errors
- `AuthContext.tsx` - Sets user context on login
- All API services - Auto-tracked

### 📋 Setup Sentry (One-time)

#### Step 1: Create Sentry Account
```
1. Go to https://sentry.io
2. Sign up (free tier available)
3. Create organization
4. Create two projects:
   - "africajustice-backend" (Node.js)
   - "africajustice-frontend" (React)
```

#### Step 2: Get DSN URLs
```
For each project:
1. Settings → Projects → [project]
2. Copy "DSN" value
3. Format: https://key@sentry.io/project-id
```

#### Step 3: Add Environment Variables

**Render Dashboard → Backend Service → Environment:**
```
SENTRY_DSN=https://your-backend-dsn@sentry.io/backend-project-id
RELEASE_VERSION=1.0.0
```

**Render Dashboard → Frontend Service → Environment:**
```
VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/frontend-project-id
VITE_RELEASE_VERSION=1.0.0
```

**Local Development (.env files):**

Backend:
```bash
# .env
SENTRY_DSN=https://your-backend-dsn@sentry.io/backend-project-id
RELEASE_VERSION=1.0.0
```

Frontend:
```bash
# africajustice-frontend/.env.local
VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/frontend-project-id
VITE_RELEASE_VERSION=1.0.0
```

### 🎯 What Gets Tracked

| Event | Backend | Frontend | Notes |
|-------|---------|----------|-------|
| Unhandled errors | ✅ | ✅ | Auto-captured |
| API errors (500, 401, etc) | ✅ | ✅ | Breadcrumbs logged |
| Slow requests (>5s) | ✅ | ✅ | Performance monitoring |
| User actions | Breadcrumb | Breadcrumb | Login, logout, export, etc. |
| Navigation | - | Breadcrumb | Page views tracked |
| Console errors | Auto | Auto | When level=error |
| Session data | ✅ | ✅ (replay) | User ID, email, roles |

### 📊 Sentry Dashboard Usage

#### View Errors
```
1. Sentry Dashboard → Issues
2. See all errors grouped by type
3. Click error to see:
   - Stack trace
   - All occurrences
   - Browser/device info
   - User context
   - Breadcrumb trail (what led to error)
```

#### Performance Monitoring
```
1. Sentry Dashboard → Performance
2. See slow transactions
3. Identify bottlenecks
   - Slow API calls
   - Slow database queries
   - Frontend render issues
```

#### Alerts & Notifications
```
1. Settings → Alerts
2. Create alerts for:
   - New errors
   - Error spike (>10 in 5 min)
   - Errors by specific user
3. Route to Slack/Email
```

### 🔧 Manual Event Capture

If you want to capture custom events:

**Backend:**
```typescript
import { captureMessage, captureError, addBreadcrumb } from './config/sentry'

captureMessage('Custom event', 'info')
captureError(new Error('Something failed'), { userId: user.id })
addBreadcrumb('User clicked export', 'user-action', 'info', { documentType: 'PDF' })
```

**Frontend:**
```typescript
import { captureMessage, captureException, trackUserAction } from './utils/sentry'

captureMessage('Custom event', 'info')
captureException(new Error('Something failed'), { userId: user.id })
trackUserAction('export_report', { format: 'PDF' })
```

---

## Phase 4.D: Data Export (PDF/CSV)

### ✅ What's Implemented

**Controller**: `africajustice-backend/src/controllers/exportController.ts`
**Services:**
- `exportService/pdfExportService.ts` - PDF generation
- `exportService/csvExportService.ts` - CSV generation
**Routes**: `africajustice-backend/src/routes/export.routes.ts`

### Export Endpoints

#### 1. **Export Single Report as PDF**
```http
GET /api/v1/export/report/:reportId/pdf
Authorization: Bearer {token}

Response: PDF file (attachment)
```

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  -o report.pdf \
  https://justicechain-backend.onrender.com/api/v1/export/report/REPORT_ID/pdf
```

#### 2. **Export Bulk Reports as PDF**
```http
POST /api/v1/export/reports/pdf
Authorization: Bearer {token}
Content-Type: application/json

Body: {
  "reportIds": ["id1", "id2", "id3"],
  "filters": {
    "status": "verified",
    "caseType": "corruption"
  }
}

Response: PDF file (attachment)
```

#### 3. **Export Single Report as CSV**
```http
GET /api/v1/export/report/:reportId/csv
Authorization: Bearer {token}

Response: CSV file (attachment)
```

#### 4. **Export Evidence as CSV**
```http
POST /api/v1/export/evidence/csv
Authorization: Bearer {token}
Content-Type: application/json

Body: {
  "filters": {
    "reportId": "string",
    "status": "verified",
    "type": "document"
  }
}

Response: CSV file (attachment)
```

#### 5. **Export Analytics as CSV**
```http
POST /api/v1/export/analytics/csv
Authorization: Bearer {token}
Content-Type: application/json

Body: {
  "dateRange": {
    "startDate": "2026-01-01",
    "endDate": "2026-03-14"
  },
  "groupBy": "caseType"
}

Response: CSV file (attachment)
```

### 🧪 Test Export Endpoints

**Using curl:**

```bash
# 1. Get your auth token
TOKEN=$(curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  https://justicechain-backend.onrender.com/api/v1/auth/login \
  | jq -r '.data.token')

# 2. Export report as PDF
curl -H "Authorization: Bearer $TOKEN" \
  -o report.pdf \
  https://justicechain-backend.onrender.com/api/v1/export/report/REPORT_ID/pdf

# 3. Export bulk reports
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reportIds":["id1","id2"]}' \
  -o reports.pdf \
  https://justicechain-backend.onrender.com/api/v1/export/reports/pdf

# 4. Export analytics as CSV
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dateRange":{"startDate":"2026-01-01","endDate":"2026-03-14"}}' \
  -o analytics.csv \
  https://justicechain-backend.onrender.com/api/v1/export/analytics/csv
```

**Using Postman:**

1. Create request: `POST /api/v1/export/reports/pdf`
2. Add header: `Authorization: Bearer YOUR_TOKEN`
3. Body (JSON):
```json
{
  "reportIds": [],
  "filters": {
    "status": "published",
    "createdAt": {
      "$gte": "2026-01-01",
      "$lte": "2026-03-14"
    }
  }
}
```
4. Click **Send** → File downloads

### 📋 Supported Filters

**For Report Export:**
```typescript
{
  "status": "draft" | "review" | "published" | "rejected",
  "caseType": string,
  "region": string,
  "priority": "low" | "medium" | "high",
  "classification": string,
  "createdBy": string,
  "dateRange": {
    "startDate": ISOString,
    "endDate": ISOString
  }
}
```

**For Evidence Export:**
```typescript
{
  "reportId": string,
  "status": "pending" | "verified" | "rejected",
  "type": "document" | "image" | "video" | "audio",
  "uploadedBy": string,
  "dateRange": {
    "startDate": ISOString,
    "endDate": ISOString
  }
}
```

### 🎨 PDF Template

Generated PDFs include:
- Header with report title, ID, date
- Report metadata (status, priority, classification)
- Report content/summary
- Associated evidence (with file references)
- Verification status
- Footer with generation timestamp

### 📊 CSV Format

**Reports CSV Columns:**
```
ID, Title, Status, CaseType, Priority, Region, CreatedAt, UpdatedAt
```

**Evidence CSV Columns:**
```
ID, ReportID, Type, FileName, Status, UploadedBy, CreatedAt
```

**Analytics CSV Columns:**
```
Date, ReportCount, EvidenceCount, Verifications, AverageResolutionTime
```

---

## Complete Deployment Checklist

### ✅ Phase 4.6: CI/CD
- [ ] Add `RENDER_API_KEY` to GitHub Secrets
- [ ] Add `RENDER_BACKEND_SERVICE_ID` to GitHub Secrets
- [ ] Add `RENDER_FRONTEND_SERVICE_ID` to GitHub Secrets
- [ ] Add `SLACK_WEBHOOK` to GitHub Secrets (optional)
- [ ] Test by pushing to main branch
- [ ] Monitor deployment in Actions tab

### ✅ Phase 4.7: Sentry
- [ ] Create Sentry account at sentry.io
- [ ] Create backend project (Node.js)
- [ ] Create frontend project (React)
- [ ] Copy backend DSN → Render env var `SENTRY_DSN`
- [ ] Copy frontend DSN → Render env var `VITE_SENTRY_DSN`
- [ ] Redeploy both services
- [ ] Trigger test error and verify in Sentry dashboard

### ✅ Phase 4.D: Data Export
- [ ] Test export endpoints with valid auth token
- [ ] Verify PDF generation works
- [ ] Verify CSV generation works
- [ ] Test with different filters
- [ ] Check Sentry tracks export breadcrumbs

---

## Monitoring Your Production App

### Daily Tasks
1. **Check Sentry** - Any new errors?
2. **Monitor Render** - Any resource issues?
3. **Review logs** - Render dashboard → Logs

### Weekly Tasks
1. **Review Sentry analytics** - Top errors, affected users
2. **Check performance** - Average response times
3. **Verify backups** - MongoDB data integrity

### Monthly Tasks
1. **Analyze export usage** - Popular reports/formats
2. **Review security** - Auth logs, access patterns
3. **Plan upgrades** - Scale if needed

---

## Troubleshooting

### ❌ Deployment fails
```
Check: GitHub Actions → Logs
- Tests passing locally? npm run test
- File syntax? npm run type-check
- Render secrets set correctly?
```

### ❌ Sentry not capturing errors
```
Check:
1. SENTRY_DSN env var set in Render?
2. Logs show "Sentry initialized"?
3. Check Sentry project settings (allowed domains)
4. Refresh Sentry dashboard
```

### ❌ Export endpoint returns 500
```
Check:
1. Auth token valid? curl /api/v1/auth/me
2. Report exists? curl /api/v1/reports/REPORT_ID
3. Render logs for error details
4. Check Sentry for error context
```

---

## Next: Production Monitoring

After deployment:
1. **Set up error alerts** in Sentry
2. **Enable performance monitoring** (track slow routes)
3. **Configure database backups** (MongoDB Atlas)
4. **Add CDN** for static assets (optional)
5. **Monitor costs** - Render, Sentry, MongoDB

---

**You're now production-ready with CI/CD, error tracking, and data export! 🚀**
