# 🚀 JusticeChain Render Deployment Guide

**Status**: ✅ All code changes complete. Ready for manual Render dashboard configuration.

---

## What I've Done For You ✅

### 1. **Updated render.yaml**
- ✅ Added **Frontend Static Site Service**
  - Build: `npm ci --include=dev && npm run build`
  - Output: `./dist/` (Vite optimized)
  - Auto CORS via: `VITE_API_URL=https://justicechain-backend.onrender.com/api/v1`

- ✅ Configured **Backend Service** with all required env vars
  - Persisted disk: `/data/` (recordings/thumbnails)
  - Memory: 1GB
  - Health check: `/healthz` endpoint exists

### 2. **Verified CORS Setup**
- ✅ Backend CORS configured in `app.ts` (line 48-51)
- ✅ Accepts `CORS_ORIGIN` env var with comma-separated origins
- ✅ Fallbacks to localhost for development

### 3. **Confirmed API Integration**
- ✅ Frontend uses `VITE_API_URL` for all API calls
- ✅ Socket.io intelligently resolves origin from env var
- ✅ Health endpoint: `GET /healthz` (returns 200 + uptime)
- ✅ Root endpoint: `GET /` (lists all API endpoints)

---

## Now You Need To: Manual Render Dashboard Steps

### Step 1: Fix MongoDB (Critical)
Your current cluster has DNS issues. Choose ONE:

**Option A: New Free Cluster (Recommended)**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create new **M0 cluster** (Shared, free)
3. Region: `us-east-1` (or your preference)
4. Click "Create Deployment"
5. Add IP whitelist: `0.0.0.0/0` (allow all)
6. Create user: `justicechain_user` / generate strong password
7. Copy connection string: `mongodb+srv://...`
8. Update env var below

**Option B: Fix Existing Cluster**
- Verify cluster DNS and networking settings
- Ensure authentication user exists
- Test locally: `mongo "mongodb+srv://user:pass@cluster.mongodb.net/test"`

---

### Step 2: Create Render Account & Link GitHub (if not done)
1. Go to [render.com](https://render.com)
2. Sign up or log in
3. Link your GitHub, GitLab, or Bitbucket account
4. Create **new service** from this repository

---

### Step 3: Deploy Backend Service
1. **New Web Service** → Select your repo
   - Root directory: `africajustice-backend`
   - Build command: `npm ci --include=dev && npm run build`
   - Start command: `npm start`
   - Instance type: **Free** (or paid for production)

2. **Set Environment Variables** (click "Add Environment Variables"):

```
NODE_ENV=production
NPM_CONFIG_PRODUCTION=false
PORT=5000
RECORDINGS_DIR=/data/recordings
THUMBNAILS_DIR=/data/thumbnails

# CRITICAL: Update with your actual values
JWT_SECRET=<GENERATE-NEW-STRONG-SECRET-MIN-32-CHARS>
MONGODB_URI=<YOUR-NEW-MONGODB-CONNECTION-STRING>
REDIS_URL=<YOUR-UPSTASH-REDIS-OR-LOCAL>
CORS_ORIGIN=https://justicechain-frontend.onrender.com

# AWS S3 (if using file uploads)
AWS_S3_BUCKET=justicechain
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=<YOUR-KEY>
AWS_SECRET_ACCESS_KEY=<YOUR-SECRET>

# Optional: Sentry, OpenAI, SendGrid
SENTRY_DSN=<optional-if-you-have>
OPENAI_API_KEY=<optional>
SENDGRID_API_KEY=<optional>
STREAM_API_KEY=<optional>

# For production, update API_URL
API_URL=https://justicechain-backend.onrender.com/api/v1
```

3. **Add Persistent Disk** (for recordings/thumbnails):
   - Name: `justicechain_data`
   - Size: `10 GB`
   - Mount path: `/data`

4. Click **Create Web Service**
5. Wait for deployment to complete (~2-5 minutes)
6. Note the backend URL: `https://justicechain-backend.onrender.com`

---

### Step 4: Verify Backend Health
Once backend is deployed:

```bash
# Health check
curl https://justicechain-backend.onrender.com/healthz

# Should return:
# {
#   "success": true,
#   "status": "ok",
#   "uptime": 123.45,
#   "timestamp": "2026-03-14T..."
# }

# API root
curl https://justicechain-backend.onrender.com/

# Should list all endpoints
```

---

### Step 5: Deploy Frontend Service
1. **New Static Site** → Select your repo
   - Root directory: `africajustice-frontend`
   - Build command: `npm ci --include=dev && npm run build`
   - Publish directory: `dist`

2. **Set Environment Variables**:

```
VITE_API_URL=https://justicechain-backend.onrender.com/api/v1
```

3. Click **Create Static Site**
4. Wait for deployment (~1-2 minutes)
5. Note the frontend URL: `https://justicechain-frontend.onrender.com`

---

### Step 6: Update Backend CORS
Go back to backend service → **Environment** → Edit `CORS_ORIGIN`:

```
CORS_ORIGIN=https://justicechain-frontend.onrender.com
```

**Save & redeploy backend** (should auto-trigger)

---

### Step 7: Test Full Integration

**Test 1: Direct Backend Access**
```bash
curl https://justicechain-backend.onrender.com/healthz
# ✅ Should return 200
```

**Test 2: Frontend Loads**
- Open `https://justicechain-frontend.onrender.com` in browser
- Check browser console for errors
- Should see app loading

**Test 3: Frontend → Backend API Call**
- Login page should load
- Try login (will work even without MongoDB if auth is stateless)
- Check Network tab in DevTools:
  - `POST /api/v1/auth/login` should hit backend
  - Should return 200 (success) or 401 (invalid credentials)

**Test 4: WebSocket Connection**
- Log in successfully
- Open DevTools → Network → WS
- Should see Socket.io connection to backend
- Join a moderation stream/chat
- Should send/receive messages in real-time

---

## Environment Variables: Complete Reference

### Backend Required
| Variable | Example | Notes |
|----------|---------|-------|
| `JWT_SECRET` | (32+ chars) | Generate: `openssl rand -hex 32` |
| `NODE_ENV` | `production` | Set by Render |
| `PORT` | `5000` | Auto set by Render |
| `CORS_ORIGIN` | `https://...onrender.com` | Frontend URL |

### Backend Database (Choose One)
| Variable | Example | Notes |
|----------|---------|-------|
| `MONGODB_URI` | `mongodb+srv://...` | New cluster recommended |
| `REDIS_URL` | `rediss://...` | Optional, use Upstash |

### Backend Services (Optional but Recommended)
| Variable | Service | Notes |
|----------|---------|-------|
| `AWS_*` | S3 file uploads | Need AWS account, bucket |
| `SENTRY_DSN` | Error tracking | Get from sentry.io |
| `OPENAI_API_KEY` | AI features | Get from openai.com |
| `SENDGRID_API_KEY` | Email | Get from sendgrid.com |

### Frontend Required
| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://justicechain-backend.onrender.com/api/v1` |

---

## Common Issues & Fixes

### 🔴 "CORS error in browser console"
**Solution:**
1. Verify frontend URL in `CORS_ORIGIN` backend env var
2. Ensure frontend and backend are deployed
3. Redeploy backend after CORS change

### 🔴 "Backend taking too long to start"
**Cause:** MongoDB connection timeout
**Solution:**
1. Check `MONGODB_URI` is correct
2. Verify MongoDB cluster is running
3. Check IP whitelist: should include `0.0.0.0/0`
4. Backend gracefully handles missing DB (just logs warning)

### 🔴 "Build fails: 'npm: command not found'"
**Solution:**
1. Ensure Node.js 18+ is set in Render dashboard
2. Check `buildCommand` in render.yaml is correct
3. Render uses Node 18 by default

### 🔴 "Static site won't load after deploy"
**Cause:** Usually VITE_API_URL not set or wrong
**Solution:**
1. Clear browser cache (Ctrl+Shift+Del)
2. Check DevTools Console for API URL
3. Verify `VITE_API_URL` env var is set to backend
4. Redeploy frontend

---

## Deployment Checklist

- [ ] MongoDB cluster created and tested
- [ ] Backend environment variables filled in Render
- [ ] Backend deployed successfully (check `/healthz`)
- [ ] Frontend environment variables filled in Render
- [ ] Frontend deployed successfully
- [ ] CORS_ORIGIN updated to frontend URL
- [ ] Backend redeployed
- [ ] Test login flow works
- [ ] WebSocket connections working (chat/livestream)
- [ ] Error tracking working (if Sentry configured)

---

## After Deployment: Managing Your Services

### View Logs
1. Dashboard → Service → **Logs**
2. Real-time streaming, searchable

### Update Environment Variables
1. Dashboard → Service → **Environment**
2. Edit and save
3. Service auto-redeploys

### Rollback
1. Dashboard → Service → **Timeline**
2. Click previous deployment
3. Click **Rollback**

### Custom Domain
1. Dashboard → Service → **Settings**
2. Add custom domain (requires DNS CNAME setup)

---

## NEXT: Database, Monitoring, Performance

Once deployed, consider:
1. **MongoDB**: Scale to paid tier for production
2. **Redis**: Use Upstash for caching (free tier available)
3. **Sentry**: Enable error tracking & performance monitoring
4. **AWS S3**: Add production AWS account for file uploads
5. **Email**: SendGrid for transactional emails

---

**Need help? Check:**
- [Render Docs](https://render.com/docs)
- [render.yaml Reference](https://render.com/docs/infrastructure-as-code)
- [MongoDB Atlas Troubleshooting](https://docs.mongodb.com/manual/administration/troubleshooting/)
