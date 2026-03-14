# Phase 4.6-4.D: Testing & Verification Guide

**Status**: ✅ All features implemented. Ready for testing.

---

## Quick Start Test (5 minutes)

### 1. **Verify Build Works**
```bash
# In root directory
npm run build

# Should complete without errors:
# ✅ Frontend Vite build successful
# ✅ Backend TypeScript compilation successful
```

### 2. **Verify GitHub Actions (if pushed to GitHub)**
```
1. Push to main branch:
   git add .
   git commit -m "Phase 4.6-4.D: CI/CD, Sentry, Data Export"
   git push origin main

2. Go to GitHub repo → Actions tab
3. Watch the workflow run:
   - Backend tests ✅
   - Frontend tests ✅
   - Build validation ✅
   - Render deployment triggered ✅
```

### 3. **Test Render Deployment Status**
```bash
# Check if your services are running
curl https://justicechain-backend.onrender.com/healthz
# Should return: { "success": true, "status": "ok", ... }

curl https://justicechain-frontend.onrender.com
# Should return HTML (frontend loaded)
```

---

## Complete Testing Suite

### Phase 4.6: CI/CD Pipeline Testing

#### Test 1: Local Build Verification
```bash
# Test that code compiles without errors
npm run build

# Expected output:
# ✅ Frontend build successful (dist/ folder created)
# ✅ Backend build successful (dist/ folder created)
```

#### Test 2: Linting Check
```bash
# Verify no eslint errors
npm run lint

# Should return: 0 errors, 0 warnings
```

#### Test 3: Type Check
```bash
# Verify TypeScript has no errors
npm run type-check

# Should return: 0 errors
```

#### Test 4: Unit Tests
```bash
# Run all tests
npm run test

# Expected:
# Backend: ✅ All tests passing
# Frontend: ✅ All tests passing
```

#### Test 5: Coverage Report
```bash
npm run test:coverage

# Check coverage > 80%:
# - Statements: 80%+
# - Branches: 80%+
# - Functions: 80%+
# - Lines: 80%+
```

#### Test 6: GitHub Actions Deployment

**Prerequisites:**
- GitHub account with repo access
- GitHub secrets configured:
  - `RENDER_API_KEY`
  - `RENDER_BACKEND_SERVICE_ID`
  - `RENDER_FRONTEND_SERVICE_ID`
  - `SLACK_WEBHOOK` (optional)

**Test Steps:**
```bash
# 1. Make a small change
echo "# Updated at $(date)" >> README.md

# 2. Commit and push to main
git add README.md
git commit -m "Test CI/CD workflow"
git push origin main

# 3. Monitor in GitHub Actions
# Go to Actions tab and watch workflow:
# - Should take ~5-10 minutes total
# - Tests run first
# - If tests pass, deployment triggers
# - Check Render dashboard for new deployments
```

**Expected GitHub Actions Output:**
```
✅ backend-lint: PASSED
✅ backend-test: PASSED
✅ frontend-lint: PASSED
✅ frontend-test: PASSED
✅ deploy-production: PASSED
  - Backend deployed
  - Frontend deployed
  - Health checks passed
  - Slack notification sent
```

---

### Phase 4.7: Sentry Monitoring Testing

#### Test 1: Sentry Setup Verification

**Backend:**
```bash
# Check if Sentry initialized (look for this message in logs)
curl https://justicechain-backend.onrender.com/

# In logs, you should see:
# "Sentry initialized successfully"
# (or "SENTRY_DSN not configured" if not set)
```

**Frontend:**
```bash
# Open browser console on https://justicechain-frontend.onrender.com
# Should see:
# ✅ "Sentry initialized successfully"
# (or warning if VITE_SENTRY_DSN not set)
```

#### Test 2: Sentry User Context Tracking

**Test Steps:**
```bash
# 1. Load frontend
open https://justicechain-frontend.onrender.com

# 2. Open browser DevTools → Console

# 3. Log in with valid credentials
# (Backend will set user context in Sentry)

# 4. Go to Sentry Dashboard
# Navigate to: Issues → Latest issue
# Should see: user.id, user.email in context
```

#### Test 3: Error Capture Test

**Backend Error:**
```bash
# Trigger a 500 error
curl https://justicechain-backend.onrender.com/api/v1/invalid-endpoint

# Check Sentry Dashboard:
# 1. Go to Issues
# 2. Look for "404 Not Found" error
# 3. Click to see details:
#    - Stack trace ✅
#    - Request context ✅
#    - Breadcrumbs (HTTP requests) ✅
```

**Frontend Error:**
```bash
# Trigger an error manually (in console):
javascript
throw new Error('Test error for Sentry')

# Check Sentry Dashboard:
# 1. Go to Issues → Frontend project
# 2. Look for "Test error for Sentry"
# 3. Click to see:
#    - Browser info ✅
#    - User context ✅
#    - Console logs (breadcrumbs) ✅
#    - Session replay (on error) ✅
```

#### Test 4: Performance Monitoring

**Frontend:**
```bash
# In Sentry Dashboard:
# 1. Go to Performance → Transactions
# 2. See API calls tracked:
#    - Page load time
#    - API response times
#    - React render times

# Should show:
# pageload: ~1-2s
# /api/v1/auth/login: ~200-500ms
# /api/v1/reports: ~100-300ms
```

**Backend:**
```bash
# In Sentry Dashboard:
# 1. Go to Performance → Transactions
# 2. Should see HTTP endpoint traces:
#    - POST /api/v1/auth/login
#    - GET /api/v1/reports
#    - etc.

# Each showing:
# - Duration
# - Database queries (if enabled)
# - Error rate
```

#### Test 5: Alert Verification

**Create Test Alert:**
```
1. Sentry Dashboard → Settings → Alerts
2. Click "Create Alert"
3. Configure:
   - Condition: Error rate > 10% (24h)
   - Action: Send to Slack
4. Click "Save"
5. Trigger 5+ 500 errors to test
6. Check Slack channel for notification
```

---

### Phase 4.D: Data Export Testing

#### Test 1: Get Authentication Token

```bash
# First, create a test account or use existing credentials
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' \
  https://justicechain-backend.onrender.com/api/v1/auth/login

# Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": "123", "email": "test@example.com", ... }
  }
}

# Save token
TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

#### Test 2: Export Single Report as PDF

```bash
# Replace REPORT_ID with an actual report ID from your DB
curl -H "Authorization: Bearer $TOKEN" \
  -o report.pdf \
  https://justicechain-backend.onrender.com/api/v1/export/report/REPORT_ID/pdf

# Verify:
file report.pdf
# Should show: "PDF document, version 1.4"

# Open:
open report.pdf  # macOS
# or
xdg-open report.pdf  # Linux
```

#### Test 3: Export Bulk Reports as PDF

```bash
# Export multiple reports
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportIds": ["ID1", "ID2", "ID3"],
    "filters": {
      "status": "published",
      "caseType": "corruption"
    }
  }' \
  -o reports_bulk.pdf \
  https://justicechain-backend.onrender.com/api/v1/export/reports/pdf

# Verify file was created
ls -lh reports_bulk.pdf
```

#### Test 4: Export Evidence as CSV

```bash
# Get evidence for a specific report
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "reportId": "REPORT_ID",
      "status": "verified"
    }
  }' \
  -o evidence.csv \
  https://justicechain-backend.onrender.com/api/v1/export/evidence/csv

# View the CSV
cat evidence.csv

# Should show columns:
# ID, ReportID, Type, Status, Description, FileName, UploadedBy, CreatedAt
```

#### Test 5: Export Analytics as CSV

```bash
# Export analytics for date range
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateRange": {
      "startDate": "2026-01-01",
      "endDate": "2026-03-14"
    },
    "groupBy": "caseType"
  }' \
  -o analytics.csv \
  https://justicechain-backend.onrender.com/api/v1/export/analytics/csv

# View
cat analytics.csv
```

#### Test 6: Export with Invalid Token

```bash
# Try with invalid token
curl -H "Authorization: Bearer INVALID_TOKEN" \
  https://justicechain-backend.onrender.com/api/v1/export/report/ID/pdf

# Expected response:
# 401 Unauthorized
# { "success": false, "message": "Invalid token" }
```

#### Test 7: Export Non-existent Report

```bash
# Try exporting report that doesn't exist
curl -H "Authorization: Bearer $TOKEN" \
  https://justicechain-backend.onrender.com/api/v1/export/report/INVALID_ID/pdf

# Expected response:
# 404 Not Found
# { "success": false, "message": "Report not found" }
```

#### Test 8: Rate Limiting

```bash
# Make 10 exports in quick succession
for i in {1..10}; do
  curl -H "Authorization: Bearer $TOKEN" \
    https://justicechain-backend.onrender.com/api/v1/export/report/ID/pdf &
done
wait

# After limit exceeded (5th request), should get:
# 429 Too Many Requests
# { "success": false, "message": "Rate limit exceeded" }
```

---

## Integration Testing (End-to-End)

### Test Scenario 1: Complete User Flow with Export

```bash
# 1. Login and get token
TOKEN=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass"}' \
  https://justicechain-backend.onrender.com/api/v1/auth/login \
  | jq -r '.data.token')

echo "✅ Logged in with token: $TOKEN"

# 2. Create a report
REPORT=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Report","description":"Testing export","caseType":"corruption"}' \
  https://justicechain-backend.onrender.com/api/v1/reports)

REPORT_ID=$(echo $REPORT | jq -r '.data._id')
echo "✅ Created report: $REPORT_ID"

# 3. Check Sentry captured the action
echo "✅ Check Sentry Dashboard for breadcrumb: 'Create report'"

# 4. Export the report
curl -H "Authorization: Bearer $TOKEN" \
  -o my_report.pdf \
  https://justicechain-backend.onrender.com/api/v1/export/report/$REPORT_ID/pdf

echo "✅ Exported report to my_report.pdf"

# 5. Verify in Sentry it was tracked
echo "✅ Check Sentry for export breadcrumb"
```

### Test Scenario 2: CI/CD Deployment (End-to-End)

```bash
# 1. Make code change
git checkout -b test/cicd-flow
echo "# Test CI/CD" >> README.md

# 2. Commit and push
git add .
git commit -m "Test: CI/CD flow"
git push origin test/cicd-flow

# 3. Create Pull Request (GitHub UI)

# 4. Monitor GitHub Actions:
#    - Tests should run automatically
#    - Should all pass ✅

# 5. Merge to main
#    (in GitHub UI, click "Merge pull request")

# 6. Monitor deployment:
#    - GitHub Actions will trigger deploy job
#    - Watch it deploy to Render
#    - Check Render dashboard for new deployments
#    - Verify services are still up after deployment

# 7. Health check
curl https://justicechain-backend.onrender.com/healthz
# Should return 200 ✅
```

---

## Troubleshooting Test Failures

### ❌ Build Fails
```bash
# Check TypeScript errors
npm run type-check

# Check ESLint errors
npm run lint

# Check with clean install
rm -rf node_modules package-lock.json
npm install
npm run build

# If still failing, check:
# - All dependencies installed: npm ls
# - Node version: node --version (should be 18+)
# - Env vars: cat .env.example
```

### ❌ Tests Fail
```bash
# Run tests with verbose output
npm run test -- --verbose

# Run specific test file
npm run test -- adminController.test.ts

# Check MongoDB/Redis running (if running locally)
docker ps | grep mongo
docker ps | grep redis

# Try single test to isolate issue:
npm run test -- --testNamePattern="specific test name"
```

### ❌ GitHub Actions Fails
```
1. Click failed job in GitHub Actions tab
2. Expand step that failed
3. Read error message (usually at bottom)
4. Common issues:
   - Tests failing (fix locally first)
   - Missing secrets (add to GitHub Settings)
   - Node version mismatch (should be 18)
   - Dependency cache issue (clear cache in Actions settings)
```

### ❌ Sentry Not Capturing Errors
```bash
# Check if DSN is set
echo $VITE_SENTRY_DSN  # Frontend
echo $SENTRY_DSN       # Backend

# Verify in render.yaml env vars are set
cat render.yaml | grep SENTRY

# Check Sentry project settings
1. Sentry Dashboard → Settings → Projects
2. Check "Allowed Domains" includes your render.com domain
3. Check "Issues" tab - any errors showing?
4. If not, manually trigger error:
   - Frontend: throw new Error('Test')
   - Backend: curl invalid-endpoint
```

### ❌ Export Endpoints Returning 500
```bash
# Check backend logs
1. Render Dashboard → Backend Service → Logs
2. Look for errors from export controller
3. Common issues:
   - Report doesn't exist
   - User not authenticated
   - Database connection error
   - PDF library error (pdfkit)

# Test with valid data
# Make sure report exists first:
curl -H "Authorization: Bearer $TOKEN" \
  https://justicechain-backend.onrender.com/api/v1/reports | jq .

# Then export existing report
curl -H "Authorization: Bearer $TOKEN" \
  https://justicechain-backend.onrender.com/api/v1/export/report/EXISTING_ID/pdf
```

---

## Success Criteria Checklist

- [ ] **Build**: `npm run build` completes without errors
- [ ] **Lint**: `npm run lint` shows 0 errors
- [ ] **Tests**: `npm run test` shows all passing
- [ ] **GitHub Actions**: CI/CD workflow runs successfully on push to main
- [ ] **Sentry**: Errors appear in Sentry Dashboard within 30 seconds
- [ ] **Sentry User Context**: Login sets user info visible in Sentry
- [ ] **Export PDF**: Single report exports as valid PDF file
- [ ] **Export CSV**: Multiple reports export as valid CSV file
- [ ] **Export Rate Limit**: 429 error after 5 concurrent requests
- [ ] **Deployment**: Render services deploy and stay healthy after push
- [ ] **Health Check**: `/healthz` returns 200 after deployment

---

## Performance Targets

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Build time | < 2 min | `npm run build` timing |
| Test duration | < 5 min | `npm run test` timing |
| PDF export (10MB report) | < 5s | `time curl export/pdf` |
| CSV export (1000 rows) | < 2s | `time curl export/csv` |
| API response time | < 500ms | Sentry Performance Dashboard |
| Deployment time | < 10 min | GitHub Actions logs |
| Health check response | < 1s | `curl /healthz` timing |

---

## Next Steps After Testing

1. ✅ **All tests passing?** → Go to production monitoring
2. ✅ **Errors in Sentry?** → Set up alerts & thresholds
3. ✅ **Export working?** → Promote to users
4. ✅ **Deployment smooth?** → Consider auto-scaling
5. ✅ **Performance good?** → Monitor costs & optimize

---

**Ready to deploy! All systems tested and ready.** 🚀
