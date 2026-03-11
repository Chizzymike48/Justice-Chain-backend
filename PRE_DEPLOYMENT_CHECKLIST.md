# Pre-Deployment Checklist

## 🔧 System Setup

### 1. Dependencies & Packages
```bash
# ✅ Verify all dependencies installed
npm list
npm --prefix africajustice-backend list

# ✅ Install missing packages if needed
npm install
npm --prefix africajustice-backend install

# ✅ Check for security vulnerabilities
npm audit
npm --prefix africajustice-backend npm audit
```

### 2. Environment Configuration
```bash
# ✅ Create environment files
cp .env.example .env.local                               # Frontend config
cp africajustice-backend/.env.example africajustice-backend/.env.local  # Backend config
```

**Backend `.env.local` Required Variables:**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@host/database
JWT_SECRET=your-long-secure-jwt-secret-minimum-32-chars
REDIS_URL=redis://host:port
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
CORS_ORIGIN=https://yourdomain.com
SENTRY_DSN=https://key@org.ingest.sentry.io/project
RELEASE_VERSION=1.0.0
PORT=5000
```

**Frontend `.env.local` Required Variables:**
```env
VITE_API_URL=https://api.yourdomain.com
VITE_SOCKET_URL=https://yourdomain.com
VITE_SENTRY_DSN=https://key@org.ingest.sentry.io/project
VITE_RELEASE_VERSION=1.0.0
```

---

## 🗄️ Database & Infrastructure

### 3. Database Setup
```bash
# ✅ Verify MongoDB connection
npx mongoose-migration create-indexes  # If using migrations

# ✅ Test database connectivity
npm --prefix africajustice-backend run test:db

# ✅ Initialize database indexes
# (Usually automatic with Mongoose, but verify)
```

### 4. Redis Setup
```bash
# ✅ Verify Redis connection
npm --prefix africajustice-backend run test:redis

# ✅ Check Redis is accessible
redis-cli ping
```

### 5. AWS S3 Setup
```bash
# ✅ Create S3 bucket (or verify existing)
# ✅ Set bucket policies:
#   - Allow public read for evidence files
#   - Allow app IAM user full access
#   - Enable versioning
#   - Enable lifecycle policies
#   - Enable encryption

# ✅ Test S3 connection
npm --prefix africajustice-backend run test:s3
```

---

## 🧪 Testing & Code Quality

### 6. Run Full Test Suite
```bash
# ✅ Frontend tests
npm test -- --coverage --run

# ✅ Backend tests
npm --prefix africajustice-backend test -- --coverage --runInBand
```

### 7. Type Checking
```bash
# ✅ Frontend TypeScript check
npm run type-check

# ✅ Backend TypeScript check
npm --prefix africajustice-backend run type-check

# Both must return 0 errors
```

### 8. Linting
```bash
# ✅ Frontend lint
npm run lint

# ✅ Backend lint
npm --prefix africajustice-backend run lint
```

### 9. Build Verification
```bash
# ✅ Build frontend
npm run build
# Check dist/ folder is created

# ✅ Build backend
npm --prefix africajustice-backend run build
# Check africajustice-backend/dist/ folder is created
```

---

## 🔐 Security

### 10. Security Audit
```bash
# ✅ Run security checks
npm audit
npm --prefix africajustice-backend npm audit

# ✅ Check for hardcoded secrets
npm install -g git-secrets
git secrets --scan

# ✅ Verify no .env files committed
git status | grep -E "\.env"
```

### 11. Authentication & Secrets
```bash
# ✅ Verify JWT_SECRET is strong (64+ characters)
echo ${JWT_SECRET} | wc -c

# ✅ Verify all API keys are valid:
#   - AWS credentials (test S3 access)
#   - Sentry DSN (test event capture)
#   - JWT secret (test token generation)

# ✅ Configure GitHub secrets for CI/CD:
#   - DOCKER_USERNAME
#   - DOCKER_PASSWORD
#   - Codecov token (optional but recommended)
```

---

## 🚀 Build & Deployment

### 12. Docker Image Build
```bash
# ✅ Build backend Docker image (if using Docker)
docker build -t justicechain-backend:latest africajustice-backend/

# ✅ Verify image is created
docker images | grep justicechain

# ✅ Test running image locally
docker run -e NODE_ENV=test justicechain-backend:latest npm test
```

### 13. Git Configuration
```bash
# ✅ Verify git is clean
git status
# Should show "nothing to commit, working tree clean"

# ✅ Create main branch protection rules:
#   - Require pull request reviews
#   - Require status checks to pass
#   - Require branches to be up to date
#   - Include administrators

# ✅ Configure branch deploy rules
# Set main/develop as protected branches
```

### 14. CI/CD Verification
```bash
# ✅ Push to development branch and verify workflows run
git push origin develop

# ✅ Check GitHub Actions tab for:
#   - Lint checks passing
#   - Tests passing
#   - Build succeeding
#   - Coverage being reported

# ✅ Create PR and verify:
#   - All checks pass
#   - Coverage report appears
#   - Automated comments posted
```

---

## 📊 Monitoring & Logging

### 15. Sentry Configuration
```bash
# ✅ Visit https://sentry.io
# ✅ Create account (if not done)
# ✅ Create two projects:
#    - Frontend (JavaScript/React)
#    - Backend (Node.js)
# ✅ Get DSNs for both projects
# ✅ Add to .env files (SENTRY_DSN)
# ✅ Test error capture:
```

**Test Sentry Backend:**
```bash
# In backend code:
captureError(new Error('Test error'), {})
# Should appear in Sentry dashboard
```

**Test Sentry Frontend:**
```javascript
// In browser console:
Sentry.captureMessage('Test message from browser')
// Should appear in Sentry dashboard
```

### 16. Logging Setup
```bash
# ✅ Verify Winston/Morgan logging configured
# ✅ Set up log aggregation (if using)
#   - CloudWatch (AWS)
#   - LogRocket (Frontend)
#   - Datadog (Enterprise)

# ✅ Test logging output
npm --prefix africajustice-backend run dev
# Check logs appear in console
```

---

## 📱 API & Endpoints

### 17. Health Check Endpoints
```bash
# ✅ Test health endpoint
curl http://localhost:5000/healthz
# Should return: { "success": true, "status": "ok" }

# ✅ Test root endpoint
curl http://localhost:5000/
# Should show API version and endpoints
```

### 18. Sample API Requests
```bash
# ✅ Token generation
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'

# ✅ Authenticated request
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/v1/reports

# ✅ Export endpoint
curl http://localhost:5000/api/v1/export/analytics/csv \
  -H "Authorization: Bearer {token}"
```

### 19. Socket.io Connection
```bash
# ✅ Test WebSocket connection
npm --prefix africajustice-backend run dev

# In browser console:
const socket = io('http://localhost:5000', {
  auth: { token: 'your-jwt-token' }
})
socket.on('connect', () => console.log('Connected!'))
```

---

## 📦 Deployment Infrastructure

### 20. Hosting Setup (Choose One)

#### Option A: Heroku
```bash
# ✅ Create Heroku account
# ✅ Create two apps:
#   - justicechain-frontend
#   - justicechain-backend
# ✅ Configure environment variables in Heroku dashboard
# ✅ Enable GitHub integration for auto-deploy
# ✅ Set main branch as deploy source
```

#### Option B: AWS
```bash
# ✅ Create EC2 instance (Ubuntu 22.04)
# ✅ Create RDS MongoDB instance
# ✅ Create ElastiCache Redis instance
# ✅ Create S3 bucket (if not already done)
# ✅ Create IAM user for API access
# ✅ Set up security groups for inbound/outbound
```

#### Option C: Docker Compose
```bash
# ✅ Set up docker-compose.yml with:
#   - Backend service
#   - Frontend service
#   - MongoDB service
#   - Redis service
# ✅ Test locally: docker-compose up
# ✅ Push to registry
```

---

## 🔄 Pre-Flight Checks (Day Before)

### 21. Final Verification
```bash
# ✅ Pull latest code
git pull origin main/develop

# ✅ Install latest dependencies
npm install
npm --prefix africajustice-backend install

# ✅ Run full test suite
npm test && npm --prefix africajustice-backend test

# ✅ Build both applications
npm run build
npm --prefix africajustice-backend run build

# ✅ Check file sizes
du -sh dist/
du -sh africajustice-backend/dist/

# ✅ Verify all routes mapped
npm --prefix africajustice-backend run list:routes

# ✅ Verify all environment variables set
env | grep -E "MONGODB|JWT|SENTRY|AWS"
```

### 22. Documentation
```bash
# ✅ README has deployment instructions
# ✅ All environment variables documented
# ✅ Runbook created for common issues
# ✅ Emergency rollback procedure documented
```

### 23. Team Communication
```bash
# ✅ Notify team of deployment time
# ✅ Prepare post-deployment checklist
# ✅ Have team on standby for issues
# ✅ Plan for monitoring first 24 hours
```

---

## 🎯 Deployment Command Checklist

```bash
# ✅ Step 1: Verify dependencies
npm install && npm --prefix africajustice-backend install

# ✅ Step 2: Run tests
npm test -- --coverage --run
npm --prefix africajustice-backend test -- --coverage --runInBand

# ✅ Step 3: Type check
npm run type-check
npm --prefix africajustice-backend run type-check

# ✅ Step 4: Lint
npm run lint
npm --prefix africajustice-backend run lint

# ✅ Step 5: Build
npm run build
npm --prefix africajustice-backend run build

# ✅ Step 6: Verify builds exist
ls -la dist/
ls -la africajustice-backend/dist/

# ✅ Step 7: Run security audit
npm audit
npm --prefix africajustice-backend npm audit

# ✅ Step 8: Push to GitHub
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

---

## 📝 Post-Deployment Verification

### Within 5 minutes:
- [ ] Application is running
- [ ] Health check endpoint responds
- [ ] API endpoints accessible
- [ ] WebSocket connections working
- [ ] Sentry receiving events
- [ ] No critical errors in logs

### Within 1 hour:
- [ ] User can log in
- [ ] Can create report
- [ ] Can upload evidence
- [ ] Real-time features working
- [ ] Export functionality working
- [ ] Dashboard rendering correctly

### Within 24 hours:
- [ ] Monitor error rates (should be < 1%)
- [ ] Check performance metrics
- [ ] Verify all features working
- [ ] Check database connections
- [ ] Review Sentry errors
- [ ] Get user feedback

---

## 🆘 Rollback Plan

```bash
# If deployment fails:

# 1. Identify issue
# Check logs: tail -f /var/log/app.log
# Check Sentry dashboard

# 2. Rollback to previous version
git revert HEAD
git push origin main

# 3. Restart application
pkill node
npm start

# 4. Verify health
curl http://localhost:5000/healthz

# 5. Notify team
# Document what went wrong
# Plan fix before next deployment
```

---

## ✅ Quick Checklist (Print This)

```
PRE-DEPLOYMENT CHECKLIST
========================

SETUP
[ ] Dependencies installed
[ ] Environment variables configured
[ ] Database connected
[ ] Redis connected
[ ] AWS S3 accessible
[ ] Sentry accounts created

TESTING & BUILD
[ ] All tests passing
[ ] TypeScript 0 errors
[ ] Linting passes
[ ] Builds succeed
[ ] Security audit passes
[ ] Git is clean

SECURITY
[ ] No secrets in code
[ ] JWT_SECRET strong (64+ chars)
[ ] All API keys valid
[ ] CORS configured
[ ] Rate limiting enabled

MONITORING
[ ] Sentry configured
[ ] Logging setup complete
[ ] Error tracking working
[ ] Health checks pass

DEPLOYMENT
[ ] Main branch is deploy-ready
[ ] CI/CD workflows pass
[ ] Docker image builds
[ ] Infrastructure ready
[ ] Backup created
[ ] Team communicated

DEPLOYMENT DAY
[ ] Final tests pass
[ ] Build successful
[ ] Push to GitHub
[ ] Monitor for errors
[ ] Verify all features

READY FOR 🚀 DEPLOYMENT
```

---

## Critical Issues to Fix Before Deployment

**If any of these are NOT done, DO NOT DEPLOY:**

1. ❌ TypeScript errors exist → `npm run type-check` must return 0
2. ❌ Tests failing → `npm test` must pass
3. ❌ Linting errors → `npm run lint` must pass
4. ❌ Environment variables missing → All required vars must be set
5. ❌ Database not connected → Can't reach MongoDB
6. ❌ Sentry not configured → No error tracking
7. ❌ Build failing → `npm run build` must create dist/
8. ❌ Security vulnerabilities found → `npm audit` must pass
9. ❌ Incomplete routes → All endpoints must be mounted
10. ❌ Team not notified → Communication must happen

---

## Deployment Success Indicators

✅ All tests passing  
✅ TypeScript 0 errors  
✅ Lint passes  
✅ Builds successful  
✅ Security clean  
✅ Sentry working  
✅ Health check responsive  
✅ API endpoints accessible  
✅ WebSocket connected  
✅ No errors in logs  

**IF ALL ABOVE → SAFE TO DEPLOY** 🚀
