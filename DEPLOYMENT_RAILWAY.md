# Deployment Configuration for Railway

## Quick Start Deployment to Railway

### 1. Prerequisites
- Railway account (railway.app)
- GitHub repository (public or private)
- Docker installed locally (for testing)

### 2. Environment Setup

Create a new `.env.production` file in root with variables from `.env.production.example`

**Critical variables:**
```bash
JWT_SECRET=<generate-random-32-char-string>
SENDGRID_API_KEY=<your-sendgrid-key>
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
SENTRY_DSN=<your-sentry-dsn>
```

### 3. Railway Deployment Steps

#### Option A: Using Railway Dashboard (Recommended for Beginners)

1. Go to railway.app and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `JusticeChain` repository
4. Railway will auto-detect and ask for configuration
5. Confirm Node.js detection
6. Add environment variables from `.env.production`
7. Click "Deploy"

#### Option B: Using Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to existing project or create new
railway link

# Add services:
# - MongoDB (or use MongoDB Atlas)
# - Redis
# - PostgreSQL (optional, if using PostgreSQL)

# Set environment variables
railway variables

# Deploy
railway up
```

#### Option C: Using Docker + Railway

```bash
# Build Docker images locally (test)
docker-compose build

# Run locally to test
docker-compose up

# Push to Railway (they'll handle Docker deployment)
railway up
```

### 4. Database Setup

#### MongoDB Atlas (Cloud)
1. Go to mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string: `mongodb+srv://...`
4. Add connection string as `MONGODB_URI` in Railway

#### Redis Cloud (Cloud)
1. Go to redis.com
2. Create free database
3. Get connection details
4. Add to Railway variables

### 5. Verify Deployment

Once deployed:

```bash
# Check health endpoint
curl https://your-app.railway.app/health

# Check version
curl https://your-app.railway.app/version

# Check API docs
# Visit: https://your-app.railway.app/api-docs
```

### 6. Frontend Deployment

Deploy React frontend separately to Vercel/Netlify:

```bash
# Vercel (automatic)
cd africajustice-frontend
vercel --prod

# Netlify (drag & drop or CLI)
npm run build
# Deploy dist/ folder to Netlify
```

### 7. Domain Setup

1. Get custom domain or use provided Railway domain
2. Update `FRONTEND_URL` and `CORS_ORIGIN` variables
3. Add SSL certificate (done automatically by Railway)

### 8. Monitoring & Logs

In Railway Dashboard:
- View real-time logs
- Monitor CPU/Memory usage
- Check deployment history
- Configure auto-deploy on GitHub push

### 9. Scaling (Production)

```bash
# View current plan
railway run info

# Upgrade plan to Production tier
# (supports better performance, more connections, etc.)
```

### 10. Troubleshooting

**Application crashes:**
1. Check logs in Railway dashboard
2. Verify all environment variables set
3. Check MongoDB connection
4. Check Redis connection

**Deployment fails:**
1. Ensure Node.js 18+
2. Check package.json scripts
3. Verify docker-compose.yml syntax
4. Check GitHub repo is public

**Database connection fails:**
1. Verify MongoDB URI format
2. Add IP whitelist to MongoDB Atlas (if required)
3. Check Redis password in env vars

### 11. Cost Estimation

- Railway free tier: $5/month credit
- Additional usage: ~$0.07-0.15 per hour per service
- MongoDB Atlas: Often free tier available
- Redis Cloud: Free tier or ~$5/month
- **Total estimate:** $0-20/month for low traffic

### 12. Post-Deployment

- [ ] Monitor error rates (Sentry)
- [ ] Check real-time performance
- [ ] Test API endpoints
- [ ] Test file uploads to S3
- [ ] Test email sending
- [ ] Monitor database performance
- [ ] Set up automated backups
- [ ] Configure alerting

### 13. Continuous Deployment

Railway automatically deploys when:
- You push to main branch
- GitHub Actions workflow completes
- Docker image is built

To disable auto-deploy:
1. Go to Railway Project Settings
2. Disable "Auto-deploy from GitHub"

### 14. Rollback

If deployment has issues:
```bash
# View deployment history
railway deployments

# Rollback to previous version
railway rollback <deployment-id>
```

### 15. Database Backups

MongoDB Atlas automatic backups:
- Free tier: 7-day retention
- Use export/import for manual backups

Redis backups:
- Set up persistent backups in Redis settings
- Or use redis dump.rdb

---

## Alternative Hosting Options

If Railway doesn't work for you:

### Render.com
```bash
# Connect GitHub repo
# Select "Web Service"
# Railway auto-deploys on GitHub push
```

### Fly.io
```bash
# Install Fly CLI
brew install flyctl

# Login
fly auth login

# Deploy
fly launch
fly deploy
```

### DigitalOcean
```bash
# Create App Platform project
# Connect GitHub
# Use docker-compose for multi-container setup
```

---

## Performance Optimization

Once deployed:

1. **Enable caching** (Redis)
   - Already configured in services

2. **Set up CDN** (optional)
   - Cloudflare for frontend
   - Railway provides edge deployment

3. **Monitor performance**
   - Use Sentry for error tracking
   - Use Railway metrics dashboard

4. **Database optimization**
   - Indexes already created
   - Connection pooling enabled

5. **Rate limiting**
   - Already configured
   - Adjust based on usage patterns

---

Need help? Check Railway docs: docs.railway.app
