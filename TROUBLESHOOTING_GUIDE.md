# 🔧 JusticeChain Production Troubleshooting Guide

**Version:** 1.0  
**Last Updated:** March 8, 2026  
**Audience:** DevOps, SRE, Engineering Team

---

## 🚀 Quick Start - Diagnosis

### Step 1: Check Overall Health
```bash
# Check API health
curl https://your-domain/health

# Expected response (UP):
{
  "status": "UP",
  "services": {
    "database": "UP",
    "cache": "UP",
    "email": "UP",
    "storage": "UP"
  }
}

# Check readiness
curl https://your-domain/ready

# Check if metrics endpoint is available
curl https://your-domain/metrics | head -20
```

### Step 2: Review Logs
```bash
# Railway: View logs in Railway dashboard
# Or via CLI:
railway logs -f

# Docker: If running locally
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
docker-compose logs -f redis

# Check Sentry for errors
# Dashboard: https://sentry.io → JusticeChain project
```

### Step 3: Access Production Database (Carefully!)
```bash
# MongoDB Atlas (production)
mongo "mongodb+srv://user:pass@cluster.mongodb.net/justice-db"

# Check basic stats
db.stats()

# See connection count
db.serverStatus().connections

# Check replica set status (if applicable)
rs.status()
```

---

## 🆘 Common Issues & Solutions

### ❌ Issue 1: API Returning 500 Errors

**Symptoms:**
- /health endpoint shows status "DOWN"
- High error rate in Sentry
- Recent error pattern detected
- Error messages appear in logs

**Diagnosis:**
```bash
# 1. Check application logs for error messages
railway logs -f backend | grep error

# 2. Check Sentry dashboard for specific error
# https://sentry.io → Issues

# 3. Check if recent deployment caused issue
railway deployment list

# 4. Check database connectivity
curl https://your-domain/health | jq '.services.database'

# 5. Check if rate limiter is triggered
# Look for 429 status codes in logs
```

**Solutions (in order of likelihood):**

**A) Database Connection Issue**
```bash
# 1. Verify database credentials in Railway/environment
# 2. Check if database is accessible
mongo "mongodb+srv://..."  # Try connecting

# 3. Check connection pool settings
# In config/database.ts:
// setMaxConnecting(10)
// setMaxPoolSize(20)

# 4. If connection pool exhausted:
#    - Increase pool size in env: MONGODB_POOL_SIZE=30
#    - Restart backend: railway restart

# 5. If that doesn't work, restart MongoDB
# or contact MongoDB Atlas support
```

**B) Recent Deployment Issue**
```bash
# 1. Identify when errors started
# Check timestamp in Sentry

# 2. Determine which deployment caused it
railway deployment history

# 3. Rollback to previous working version
railway rollback <deployment_id>

# 4. Investigate issue in development
# before re-deploying fix
```

**C) Out of Memory**
```bash
# 1. Check current memory usage
# In Railway dashboard or:
docker stats

# 2. If exceeding limits:
railway open  # Open Railway dashboard
# Increase plan/memory allocation

# 3. Identify memory leak
# - Check error logs for patterns
# - Review recent code changes
# - Look for unclosed connections

# 4. Temporary fix (only as last resort)
# Restart backend to clear memory:
railway restart backend
```

**D) Rate Limiter Triggered**
```bash
# 1. Check if legitimate traffic spike
# Look at metrics: /metrics endpoint

# 2. If spike is expected (launch day):
# Temporarily adjust rate limits in:
# src/middleware/rateLimits.ts
# EXPORT_LIMITER: 5 -> 20 requests

# 3. Redeploy with updated limits
git add .
git commit -m "Increase rate limits for launch"
git push  # Triggers GitHub Actions -> Railway deployment

# 4. Re-assess limits after 24 hours
```

---

### ❌ Issue 2: High Database Query Times

**Symptoms:**
- API response time above 300ms
- /metrics shows high query duration
- Sentry shows database timeouts
- Dashboard feels slow

**Diagnosis:**
```bash
# 1. Connect to MongoDB
mongo "mongodb+srv://..."

# 2. List slow queries (>100ms)
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(10)

# 3. Check specific collection
db.reports.aggregate([
  { $group: { _id: null, count: { $sum: 1 } } }
])

# 4. Verify indexes exist
db.reports.getIndexes()

# 5. Check query execution plan
db.reports.find({ status: "pending" }).explain("executionStats")
```

**Solutions:**

**A) Missing Index**
```bash
# 1. Identify missing indexes from explain output
# Look for "executionStages.stage": "COLLSCAN"

# 2. Create index
db.reports.createIndex({ status: 1, createdAt: -1 })

# 3. Verify query now uses index
db.reports.find({ status: "pending" }).explain("executionStats")
# Should show "executionStages.stage": "IXSCAN"

# 4. Restart backend to reconnect and cache metadata
# (indexes take effect immediately, but connection caches may need refresh)
railway restart backend
```

**B) Inefficient Query Pattern**
```bash
# 1. Check exportController.ts for N+1 queries
# Should use $in operator instead of individual queries

# 2. If still using Promise.all() on individual queries:
# Replace with batch query:

// Bad (N+1):
const reports = await Promise.all(ids.map(id => Report.findById(id)));

// Good (batch):
const reports = await Report.find({ _id: { $in: ids } });

# 3. Redeploy:
git add .
git commit -m "Fix N+1 query pattern in export controller"
git push

# 4. Verify with metrics (should see drop in query time)
```

**C) Large Result Set**
```bash
# 1. If query returns 100K+ documents, reduce result
# Use pagination (already implemented):

// In controller:
const limit = Math.min(req.query.limit || 20, 500); // Max 500
const skip = (req.query.page - 1) * limit;
const results = await Report.find(query)
  .limit(limit)
  .skip(skip)
  .lean();

# 2. Or use aggregation pipeline with $limit:
db.reports.aggregate([
  { $match: { status: "pending" } },
  { $limit: 500 },
  { $project: { _id: 1, title: 1, status: 1 } }
])

# 3. Test with client SDK
# Verify pagination is actually being used
```

**D) Insufficient Server Resources**
```bash
# 1. Check database server resources
# In MongoDB Atlas dashboard:
#  - CPU usage
#  - Memory usage
#  - Network I/O

# 2. If consistently >80% utilization:
# Increase database tier

# 3. Or optimize queries further (above steps)

# 4. Consider caching for read-heavy workloads
# Already implemented via Redis
```

---

### ❌ Issue 3: High Memory Usage / Memory Leak

**Symptoms:**
- Memory continuously increasing
- Backend eventually crashes or restarts
- OOM errors in logs
- Low available system memory

**Diagnosis:**
```bash
# 1. Check current memory
railway open  # Check Railway dashboard

# 2. Monitor memory over time
# Look for steady increase or sudden spike

# 3. Generate heap dump
docker exec <backend_container_id> node --inspect

# 4. Use Chrome DevTools for heap analysis
# DevTools -> Sources -> Detached DOM nodes

# 5. Check for common leaks in code:
grep -r "on(" .  # Event listeners without off()
grep -r "setInterval" .  # Intervals not cleared
grep -r "cache\[" .  # Unbounded cache objects
```

**Solutions:**

**A) Fix Event Listener Leak**
```typescript
// Bad:
socket.on('connect', () => { ... });

// Good (cleanup on disconnect):
const handlers = {
  connect: () => { ... },
  disconnect: () => { ... }
};

socket.on('connect', handlers.connect);
socket.on('disconnect', handlers.disconnect);

// Or use once() for cleanup:
socket.once('connect', handlers.connect);

// 2. Redeploy and monitor memory
```

**B) Fix Interval/Timeout Leak**
```typescript
// Bad:
const intervalIds = [];
function scheduleCheck() {
  const id = setInterval(() => { ... }, 5000);
  intervalIds.push(id);  // Never cleared!
}

// Good:
class Service {
  private intervalId: NodeJS.Timeout | null = null;
  
  start() {
    if (!this.intervalId) {
      this.intervalId = setInterval(() => { ... }, 5000);
    }
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  // Call stop() on app shutdown
}
```

**C) Fix Unbounded Cache**
```typescript
// Bad:
const cache = {};
function cache_set(key, value) {
  cache[key] = value;  // Grows forever!
}

// Good (already implemented in cacheService.ts):
import redis from 'redis';
const client = redis.createClient();
// Redis handles eviction automatically

// If using in-memory cache:
const cache = new Map();
const MAX_CACHE_SIZE = 1000;

function cache_set(key, value) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, value);
}
```

**D) Temporary Fix (Last Resort)**
```bash
# 1. Increase memory allocation in Railway
railway open  # Edit plan/resources

# 2. Restart backend to clear memory
railway restart backend

# 3. Implement periodic restart (temporary only!)
# Schedule restart during low-traffic period
# via cron or Railway scheduled tasks

# 4. Investigate and fix memory leak properly
# Don't rely on restarts long-term
```

---

### ❌ Issue 4: Cache Not Working / Low Hit Rate

**Symptoms:**
- Dashboard queries very slow
- Redis connection shows RED in health check
- Cache hit rate <30%
- Same queries hit database repeatedly

**Diagnosis:**
```bash
# 1. Check Redis connectivity
curl https://your-domain/health | jq '.services.cache'

# 2. Connect to Redis
redis-cli -h your-redis-url ping
# Expected: PONG

# 3. Check cache statistics
redis-cli --stat

# 4. List cache keys
redis-cli keys "*"

# 5. Check cache hit ratio
redis-cli INFO stats | grep hits
redis-cli INFO stats | grep misses

# 6. Review cacheService.ts configuration
# Check TTL values match usage patterns
```

**Solutions:**

**A) Redis Connection Issue**
```bash
# 1. Verify Redis URL/credentials
echo $REDIS_URL  # Check environment variable

# 2. Test connection
redis-cli -u $REDIS_URL ping

# 3. If connection fails:
# - Check Redis service is running
# - Check credentials are valid
# - Check IP whitelist (if on Atlas/cloud)
# - Restart Redis: docker restart redis

# 4. If still failing, restart backend connection:
railway restart backend
```

**B) Cache TTL Too Short**
```typescript
// In cacheService.ts:
const CACHE_TTL = {
  analytics: 5 * 60,      // 5 minutes
  dashboard: 2 * 60,      // 2 minutes
  reports: 3 * 60,        // 3 minutes
  adminQueue: 60,         // 1 minute
};

// Too short TTL causes cache to expire quickly
// Increase based on data freshness requirement:

// If analytics change every 15 min, set to 10 min:
analytics: 10 * 60,

// If dashboard needs real-time (< 1 min), keep at 2 min:
dashboard: 2 * 60,
```

**C) Cache Not Being Set**
```bash
# 1. Check if cacheService.setCached() is being called
grep -r "setCached" src/

# 2. Verify caching logic in analyticsController.ts
# Should use getOrCompute() pattern

# 3. Test cache set_manually:
redis-cli SET "test-key" "test-value" EX 300
redis-cli GET "test-key"  # Should return value

# 4. If manual set works, issue is in application code
# Check cacheService.ts for errors
```

**D) Insufficient Cache Size**
```bash
# 1. Check Redis memory usage
redis-cli INFO memory | grep used_memory_human

# 2. If near limit, increase Redis plan
railway open

# 3. Or implement more aggressive eviction:
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# 4. Monitor improvement in cache hit rate
```

---

### ❌ Issue 5: Email Not Sending

**Symptoms:**
- Email notifications missing
- Sentry shows "SendGrid API Error"
- Users not receiving verification emails
- No errors in application logs

**Diagnosis:**
```bash
# 1. Check health endpoint
curl https://your-domain/health | jq '.services.email'

# 2. Check SendGrid API key in environment
echo $SENDGRID_API_KEY  # Should not be empty

# 3. Check Sentry for email errors
# https://sentry.io → JusticeChain → Issues

# 4. Review email service logs
railway logs -f backend | grep -i email

# 5. Test SendGrid API directly
curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header "Authorization: Bearer $SENDGRID_API_KEY" \
  --header 'Content-Type: application/json' \
  --data '{"personalizations":[{"to":[{"email":"test@example.com"}]}],"from":{"email":"noreply@africajustice.com"},"subject":"Test","content":[{"type":"text/plain","value":"Test email"}]}'
```

**Solutions:**

**A) Missing SendGrid API Key**
```bash
# 1. Verify API key exists
echo $SENDGRID_API_KEY

# 2. If empty or wrong:
# - Go to Railway dashboard
# - Set environment variable: SENDGRID_API_KEY
# - Get key from SendGrid dashboard:
#   https://app.sendgrid.com/ → Settings → API Keys

# 3. Restart backend with new variable
railway restart backend

# 4. Test email sending again
```

**B) Email Service Disabled Gracefully**
```typescript
// In emailService.ts, if no API key:
if (!process.env.SENDGRID_API_KEY) {
  console.log("[Email Service] Using console logger (no SendGrid API key)");
  // Falls back to console.log
}

// Solution: Set SENDGRID_API_KEY in production
# Not needed in development, but required for production
```

**C) Invalid Email Address**
```bash
# 1. Check email validation in sanitization.ts
# sanitizeEmail() checks format

# 2. If receiving error "Invalid To Address":
# Verify email in database is valid
mongo "mongodb+srv://..."
db.reports.findOne({ user_email: /invalid/ })

# 3. Fix invalid emails in database
# Or add validation before sending
```

**D) Rate Limited by SendGrid**
```bash
# 1. Check SendGrid sending limit (free: 100 emails/day)
# https://sendgrid.com/pricing

# 2. If hitting limit:
# - Upgrade SendGrid plan
# - Implement email queue/batching
# - Rate limit email sends in application

# 3. Or temporarily disable certain notifications:
# Update emailService.ts to skip optional emails
```

**E) From Address Not Verified**
```bash
# 1. Check SendGrid single sender verification
# https://app.sendgrid.com/ → Sender authentication

# 2. Verify your "from" address
# In emailService.ts: from: 'noreply@africajustice.com'

# 3. Add to verified senders in SendGrid
# Or use SendGrid sandbox mode for testing

# 4. Restart backend
railway restart backend
```

---

### ❌ Issue 6: Database Backup Failed

**Symptoms:**
- Scheduled backup not completing
- Alert: "Backup failed"
- Database restore fails when needed
- Storage space accumulating

**Diagnosis:**
```bash
# 1. Check MongoDB Atlas backup status
# Go to Atlas Console → Backups tab

# 2. Check backup retention policy
# Default: last 35 days

# 3. Check backup storage used
# Usually 20-30% of database size

# 4. List available restore points
mongo "mongodb+srv://..." 
db.getMongo().getDBNames()
```

**Solutions:**

**A) Backup Not Completing**
```bash
# 1. Check if database is too large
# Backup size should be < storage limit

# 2. If database >100GB:
# - Implement data archival strategy
# - Backup to external storage (S3)
# - Consider sharding

# 3. Increase backup window
# By default runs at quiet times
# Can be manually triggered

# 4. Check network health
# MongoDB Atlas may need to transfer large data
```

**B) Restore Point Not Available**
```bash
# 1. Check backup retention
# Free tier: 7 days
# Paid tier: up to 35 days

# 2. If older than retention period:
# - Increase retention setting
# - Or use incremental backups to S3

# 3. Export to S3 for long-term storage
mongoexport --uri="$MONGODB_URL" \
  --collection=reports --out=reports_backup.json

aws s3 cp reports_backup.json s3://your-bucket/
```

**C) Storage Space Issue**
```bash
# 1. Check MongoDB usage
mongo "mongodb+srv://..."
db.stats()  # Check dataSize

# 2. If >90% of quota:
# - Increase cluster tier
# - Delete old data
# - Archive to external storage

# 3. Configure auto-archival
# Move reports older than 1 year to S3
```

---

### ❌ Issue 7: API Rate Limit Issues

**Symptoms:**
- Getting 429 (Too Many Requests) errors
- Legitimate traffic being blocked
- Export operations failing intermittently
- Users complaining about "service unavailable"

**Diagnosis:**
```bash
# 1. Check rate limiter status
# Look for 429 errors in logs
railway logs -f backend | grep 429

# 2. Identify which endpoint is rate limited
# Check src/middleware/rateLimits.ts configurations

# 3. Check traffic spike
# Compare current traffic to baseline
curl https://your-domain/metrics | grep http_requests_total

# 4. Determine if legitimate or attack
# Check IP addresses in logs
# Legitimate: expect legitimate users
# Attack: expect many different IPs with malicious requests
```

**Solutions:**

**A) Temporary Spike in Legitimate Traffic**
```bash
# 1. Increase rate limit temporarily
# In src/middleware/rateLimits.ts:

// Before:
const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5  // 5 requests per window
});

// After (launch day):
const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20  // Increased for launch
});

# 2. Deploy change
git add src/middleware/rateLimits.ts
git commit -m "Increase rate limits for launch day"
git push  # Auto-deploys via GitHub Actions

# 3. Monitor new rate
# Re-assess after 24 hours and reduce if needed

# 4. Implement dynamic rate limiting long-term
# Based on time of day, traffic patterns
```

**B) DDoS Attack**
```bash
# 1. Identify attack pattern
# Look for:
# - Same IP making thousands of requests
# - Distributed from many IPs
# - Requests to random/non-existent endpoints

# 2. Implement IP-based blocking
# In nginx config or Railway firewall

# 3. Or use Railway's DDoS protection
# Enable in Railway dashboard

# 4. Block malicious IPs at Railway level
# Or implement in Express middleware:

const blockListIps = ['1.2.3.4', '5.6.7.8'];
app.use((req, res, next) => {
  if (blockListIps.includes(req.ip)) {
    return res.status(403).send('Forbidden');
  }
  next();
});

# 5. Escalate to Railway support if severe
```

**C) Per-User Rate Limit Too Strict**
```bash
# 1. Check if user ID is correct
# Rate limiter uses: req.user?.id

# 2. If user ID not set, falls back to IP
# Multiple users behind same proxy (corporate) would share limit

# 3. Implement user-specific limits
// In exportLimiter:
keyGenerator: (req) => {
  return req.user?.id || req.ip;  // Prefer user ID
}

# 4. Or implement tiered rate limits
// Free users: 5 req/15min
// Paid users: 50 req/15min
```

---

### ❌ Issue 8: Database Connection Pool Exhausted

**Symptoms:**
- "MongoServerSelectionError: connection timeout"
- Database queries hanging
- Pending operations in database
- New requests fail immediately

**Diagnosis:**
```bash
# 1. Check database connection count
mongo "mongodb+srv://..."
db.serverStatus().connections
# Output: { "current": 45, "available": 5, "totalCreated": 50 }

# 2. If current is at max, connections are exhausted

# 3. Check long-running operations
db.currentOp()
# Will show operations holding connections

# 4. Check connection timeout settings
# In config/database.ts
// Mongoose creates connection pool of size: maxPoolSize
```

**Solutions:**

**A) Increase Connection Pool Size**
```typescript
// In config/database.ts:
// Before:
// mongoose.connect(uri, {
//   maxPoolSize: 10,
// });

// After:
mongoose.connect(uri, {
  maxPoolSize: 20,  // Increased from 10
  minPoolSize: 5,   // Keep minimum connections ready
  maxIdleTimeMS: 45000,  // Close idle connections
});

// Deploy:
# git add src/config/database.ts
# git commit -m "Increase connection pool to 20"
# git push  # Auto-deploys

# Verify via health check:
# curl https://your-domain/health
```

**B) Kill Long-Running Queries**
```bash
# 1. Identify long-running operations
db.currentOp()

# 2. Find operations running > 60 seconds
db.currentOp({
  "secs_running": { $gte: 60 }
})

# 3. Kill specific operation (carefully!)
db.killOp(12345)  # Replace 12345 with operation ID

# 4. Or kill all long-running operations
db.currentOp().inprog.forEach(op => {
  if (op.secs_running > 60) {
    db.killOp(op.opid);
  }
});

# 5. Investigate why operation was slow
# Usually indicates inefficient query
```

**C) Add Connection Pool Monitoring**
```typescript
// In analytics or health endpoint:
const poolStats = db.getMongo().getPool();
// Returns: { currentSize, available, ... }

// Add to /metrics endpoint:
// db_connection_pool_size: 20
// db_connections_active: 18
// db_connections_available: 2
```

---

### ❌ Issue 9: Frontend Build Failing or Not Deploying

**Symptoms:**
- Frontend not updating after deployment
- Old version still showing
- Build errors in GitHub Actions
- User sees outdated content/features

**Diagnosis:**
```bash
# 1. Check frontend version
# In browser: DevTools → Console
console.log(version)  // Or check page source

# 2. Check deployment logs
railway logs -f frontend

# 3. Check if latest Docker image exists
docker ps | grep frontend

# 4. Check GitHub Actions build log
# GitHub → Actions → Latest workflow run

# 5. Check if nginx is serving old cache
curl -I https://your-domain/index.html | grep -i cache
```

**Solutions:**

**A) Build Error in GitHub Actions**
```bash
# 1. Check GitHub Actions log
# GitHub → Actions → CI/CD workflow

# 2. Common errors:
# - npm ERR! 404: Package not found
#   Solution: Check package.json, run npm install locally
# - Module not found: 'component'
#   Solution: Check import paths, run npm audit fix
# - TypeScript compilation error
#   Solution: Fix type errors, run npm run type-check locally

# 3. Fix locally and test:
npm install
npm run lint
npm run type-check
npm run build
npm run test

# 4. Push fix:
git add .
git commit -m "Fix build error"
git push
```

**B) Latest Build Not Deployed**
```bash
# 1. Check Railway deploy logs
railway logs -f  # Shows deployment status

# 2. If deployment didn't start:
# - Check if GitHub Actions workflow ran
# - GitHub → Actions → see if CI/CD triggered

# 3. If workflow didn't run:
# - Check if webhooks configured
# - Or manually trigger Railway redeploy:
railway redeploy <deployment_id>

# 4. Or redeploy from Railway CLI:
railway service select frontend
railway up
```

**C) Stale Cache Being Served**
```bash
# 1. Clear browser cache
# DevTools → Network → Disable cache
# Reload page

# 2. Clear CDN/Railway cache (if enabled)
# Usually automatic but can manually clear:
railway open  # Go to dashboard
# Clear cache option may be available

# 3. Check nginx cache headers
# In Dockerfile.frontend:
# add_header Cache-Control "public, max-age=3600"
# Change max-age to 0 for development:
add_header Cache-Control "no-store, must-revalidate"

# 4. Clear browser cache directly:
# Ctrl+Shift+Delete → Clear all
```

---

### ❌ Issue 10: Authentication/JWT Not Working

**Symptoms:**
- Getting "Unauthorized" (401) on API calls
- JWT token validation failing
- Users logged out unexpectedly
- CORS errors with auth headers

**Diagnosis:**
```bash
# 1. Check JWT_SECRET is set
echo $JWT_SECRET

# 2. Check token format in browser
# DevTools → Application → Cookies
# Look for 'authToken' or 'jwt'

# 3. Decode token (jwt.io)
# Copy token from cookie/localStorage
# Paste at https://jwt.io/

# 4. Check token expiration
# jwt.io shows "exp" timestamp
# Compare to current time

# 5. Check authorization header
# DevTools → Network → XHR requests
# Should have: Authorization: Bearer <token>
```

**Solutions:**

**A) JWT_SECRET Missing**
```bash
# 1. Set JWT_SECRET in environment
# Railway dashboard → Variables
# Add: JWT_SECRET = <strong random string, 32+ chars>

# 2. Restart backend
railway restart backend

# 3. Test authentication
# Login again to get new token
```

**B) Token Expired**
```bash
# 1. Check token expiration time
# At jwt.io, look for "exp" field
# Compare to current Unix timestamp

# 2. In authMiddleware.ts, check expiration
// Decoded token should have: exp (expiration timestamp)

# 3. Token expiration is typically 7 days
# User needs to log in again after expiration

# 4. To extend expiration:
# In auth controller:
const token = jwt.sign(user, secret, { expiresIn: '14d' });
// Changed from '7d' to '14d'
```

**C) CORS Blocking Auth Headers**
```bash
# 1. Check frontend CORS configuration
# In api/client setup:
const api = axios.create({
  baseURL: 'https://your-backend.com',
  withCredentials: true,  // Include credentials
});

# 2. Check backend CORS headers
# In app.ts:
app.use(cors({
  origin: 'https://your-frontend.com',
  credentials: true,
}));

# 3. Check browser console for CORS errors
# DevTools → Console tab
# Error: "Access to XMLHttpRequest has been blocked by CORS policy"

# 4. Verify origin matches exactly (case-sensitive)
```

**D) Token Invalid/Malformed**
```bash
# 1. Check token format
# Should be: Bearer <token>
# Not: Token <token> or JWT <token>

# 2. Test token manually:
curl -H "Authorization: Bearer <token>" https://your-domain/api/reports

# 3. If still failing, check backend:
// In auth.ts middleware:
const token = parts[1];  // parts[0] = "Bearer"
const decoded = jwt.verify(token, SECRET);
// This throws if token is invalid

# 4. Generate fresh token:
# Logout and login again
```

---

## 📊 Reference: Useful Commands

### Railway Commands
```bash
railway login          # Authenticate with Railway
railway open          # Open Railway dashboard
railway link          # Link current repo to Railway project
railway logs -f       # Stream logs from production
railway logs -f backend    # Stream only backend logs
railway exec <cmd>    # Execute command in production
railway redeploy <id> # Redeploy specific deployment
railway restart backend    # Restart backend service
railway env list      # List environment variables
railway env set FOO=bar   # Set environment variable
railway deployment list   # Show recent deployments
railway status        # Show deployment status
```

### MongoDB Commands
```bash
# Connect
mongo "mongodb+srv://user:pass@cluster.mongodb.net/db"

# Database operations
show dbs              # List databases
use justice-db        # Switch to database
db.stats()            # Database statistics
db.dropDatabase()     # Delete database (dangerous!)

# Collection operations
show collections      # List collections
db.reports.stats()    # Collection statistics
db.reports.count()    # Document count
db.reports.estimated_document_count()  # Fast count

# Query operations
db.reports.find()     # Find all documents
db.reports.find({ status: "pending" })  # Find with filter
db.reports.findOne()  # Find first document
db.reports.find().limit(10)   # Limit results
db.reports.find().sort({ createdAt: -1 })  # Sort descending

# Index operations
db.reports.getIndexes()     # List all indexes
db.reports.createIndex({ status: 1 })  # Create index
db.reports.dropIndex("status_1")  # Delete index

# Performance operations
db.setProfilingLevel(1, { slowms: 100 })  # Profile slow queries
db.system.profile.find().limit(5).sort({ ts: -1 })  # View slow queries
db.currentOp()        # Show current operations
db.killOp(12345)      # Kill operation
```

### Redis Commands
```bash
redis-cli PING        # Test connection
redis-cli INFO        # Server information
redis-cli MEMORY STATS    # Memory statistics
redis-cli KEYS "*"    # List all keys
redis-cli GET key     # Get value
redis-cli SET key value EX 3600  # Set with expiration
redis-cli DEL key     # Delete key
redis-cli FLUSHALL    # Clear all data (dangerous!)
redis-cli --scan      # Scan all keys (large databases)
redis-cli --stat      # Real-time statistics
```

### Docker Commands
```bash
docker-compose up     # Start services (foreground)
docker-compose up -d  # Start services (background)
docker-compose down   # Stop and remove services
docker-compose logs -f backend    # Stream backend logs
docker-compose exec backend sh    # Shell into backend
docker-compose ps     # Show running services
docker images         # List images
docker ps             # List running containers
docker logs <id>      # Container logs
docker restart <id>   # Restart container
docker rm <id>        # Remove container
```

### API Testing
```bash
# Test health endpoint
curl https://your-domain/health

# Test with authentication
curl -H "Authorization: Bearer <token>" https://your-domain/api/reports

# Test POST request
curl -X POST https://your-domain/api/reports \
  -H "Content-Type: application/json" \
  -d '{"title":"Report"}'

# Get response headers
curl -I https://your-domain/health

# Save response to file
curl https://your-domain/api/reports > response.json
```

---

## 🔍 Debugging Best Practices

### 1. Always Check Health First
```bash
curl https://your-domain/health
# Tells you which services are UP/DOWN/DEGRADED
```

### 2. Review Recent Changes
```bash
# What deployed recently?
railway deployment list

# What code changed?
git log --oneline -5

# Any errors after deployment?
railway logs -f | grep error
```

### 3. Check External Dependencies
```bash
# Database reachable?
mongo "mongodb+srv://..."
ping

# Redis reachable?
redis-cli ping

# Email service working?
curl https://api.sendgrid.com/

# S3 accessible?
aws s3 ls
```

### 4. Isolate the Problem
```bash
# Is it frontend?
# Check browser DevTools → Network/Console

# Is it backend?
# Check railway logs -f

# Is it database?
# Try connecting directly

# Is it cache?
# Try redis-cli

# Is it external service?
# Check service status page
```

### 5. Look at Latest Errors
```bash
# Sentry: https://sentry.io → Issues
# Shows error grouping and frequency

# Logs: railway logs -f
# See real-time events

# Metrics: https://your-domain/metrics
# Prometheus format showing all metrics
```

---

**Document Maintained By:** DevOps Team  
**Last Updated:** March 8, 2026  
**Next Review:** June 8, 2026  
**Contact:** devops@africajustice.com

