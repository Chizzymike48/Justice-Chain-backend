# 📊 JusticeChain Production Monitoring & Alerting Guide

**Document Version:** 1.0  
**Last Updated:** March 8, 2026  
**Target Audience:** DevOps, SRE, Engineering Leads

---

## 🎯 Monitoring Strategy Overview

This guide covers monitoring, alerting, and observability for the JusticeChain production environment. The monitoring stack uses:
- **Metrics:** Prometheus-format endpoint at `/metrics`
- **Errors:** Sentry for error tracking and aggregation
- **Logs:** Structured logs to console and third-party services
- **Health:** Dedicated health check endpoints
- **Performance:** Response time tracking and database metrics

---

## 📊 Key Metrics to Monitor

### Application Health

#### 1. **API Response Times**
```
Metric: http_request_duration_seconds (histogram)
Targets:
  - Median (p50): <100ms
  - P95: <300ms
  - P99: <500ms
Alert Threshold:
  - Warning: p95 > 300ms for 5 min
  - Critical: p95 > 500ms for 5 min
Recovery Action:
  - Check database slow queries
  - Check Redis connection pool
  - Monitor CPU/memory usage
```

#### 2. **Error Rate**
```
Metric: http_requests_total{status="5xx"} / http_requests_total
Target: <0.1% (1 error per 1000 requests)
Alert Threshold:
  - Warning: >0.5% for 5 min
  - Critical: >1% for 5 min
Recovery Action:
  - Check error logs in Sentry
  - Review recent deployments
  - Check external service dependencies
```

#### 3. **Throughput**
```
Metric: http_requests_total
Target: Baseline established during load testing
Alert Threshold:
  - Warning: 50% drop from baseline for 10 min
  - Critical: 75% drop from baseline for 5 min
Recovery Action:
  - Check database connectivity
  - Review rate limiter configuration
  - Check application logs for errors
```

### Database Metrics

#### 4. **Database Query Performance**
```
Metric: mongodb_query_duration_seconds (histogram)
Targets:
  - Median: <50ms
  - P95: <150ms
Alert Threshold:
  - Warning: p95 > 150ms for 10 min
  - Critical: p95 > 300ms for 5 min
Recovery Action:
  - Analyze slow query logs
  - Check query execution plans
  - Verify indexes exist
  - Consider query optimization
```

#### 5. **Database Connection Pool**
```
Metric: mongodb_connection_pool_utilization
Target: 40-60% utilization
Alert Threshold:
  - Warning: >70% for 10 min
  - Critical: >85% for 5 min
Recovery Action:
  - Increase connection pool size
  - Implement connection pooling
  - Check for connection leaks
  - Review application code for unclosed connections
```

#### 6. **Database Disk Usage**
```
Metric: mongodb_disk_bytes
Target: Growing <15% per 30 days
Alert Threshold:
  - Warning: >85% capacity for 24 hrs
  - Critical: >95% capacity
Recovery Action:
  - Archive old records
  - Increase storage capacity
  - Review data retention policy
```

### Cache Metrics

#### 7. **Redis Cache Hit Rate**
```
Metric: redis_cache_hits / (redis_cache_hits + redis_cache_misses)
Target: >60% for analytics endpoints
Alert Threshold:
  - Warning: <50% for 30 min (indicates cache thrashing)
  - Critical: <30% (cache not functioning)
Recovery Action:
  - Increase cache TTL values
  - Review cache eviction policy
  - Check Redis connection state
  - Verify cache keys being set correctly
```

#### 8. **Redis Memory Usage**
```
Metric: redis_memory_bytes
Target: <500MB
Alert Threshold:
  - Warning: >400MB for 10 min
  - Critical: >450MB for 5 min
Recovery Action:
  - Reduce cache TTL values
  - Implement cache eviction
  - Check for memory leaks
  - Review Redis MEMORY STATS output
```

### System Resources

#### 9. **CPU Usage**
```
Metric: process_cpu_seconds_total
Target: <50% average
Alert Threshold:
  - Warning: >60% for 10 min
  - Critical: >80% for 5 min
Recovery Action:
  - Profile CPU usage (detect loops)
  - Increase instance size
  - Implement caching for expensive operations
  - Consider horizontal scaling
```

#### 10. **Memory Usage**
```
Metric: process_resident_memory_bytes
Target: <500MB per instance
Alert Threshold:
  - Warning: >400MB for 10 min
  - Critical: >450MB for 5 min
Recovery Action:
  - Check for memory leaks
  - Review large data structures
  - Implement streaming for large exports
  - Increase instance memory
```

#### 11. **Node Process Restart Count**
```
Metric: process_restart_count
Target: 0 restarts per day
Alert Threshold:
  - Warning: 1+ restart per day
  - Critical: 3+ restarts per hour
Recovery Action:
  - Check crash logs
  - Verify memory/CPU limits
  - Review error logs
  - Implement graceful shutdown
```

### Business Metrics

#### 12. **Report Submission Rate**
```
Metric: reports_submitted_total
Target: Establish baseline during private beta
Alert Threshold:
  - Warning: 50% drop from 24-hour average for 2 hrs
  - Info: Alert on unusual spikes
Recovery Action:
  - Check database connectivity
  - Review UI error logs
  - Check rate limiter settings
```

#### 13. **Authentication Failures**
```
Metric: auth_failures_total
Target: <5% of login attempts
Alert Threshold:
  - Warning: >10% failed logins for 10 min
  - Critical: >25% failed logins for 5 min
Recovery Action:
  - Check authentication service
  - Review JWT configuration
  - Check database authentication
  - Monitor for brute force attacks
```

#### 14. **Email Delivery Rate**
```
Metric: email_sent_total / email_failed_total
Target: >95% successful delivery
Alert Threshold:
  - Warning: <90% for 30 min
  - Critical: <75% for 10 min
Recovery Action:
  - Check SendGrid API status
  - Verify API credentials
  - Check email service logs
  - Review bounce/complaint rates
```

---

## 🚨 Alert Rules

### Critical Alerts (Immediate Notification)

```yaml
# Rule 1: API Down
name: APIDown
condition: health_status == "DOWN"
duration: 1m
action: Pages on-call engineer, Slack #alerts

# Rule 2: High Error Rate
name: HighErrorRate
condition: error_rate > 0.01 (>1%)
duration: 5m
action: Pages on-call engineer, Slack #alerts

# Rule 3: Database Connection Exhausted
name: DBConnectionPoolExhausted
condition: db_connection_utilization > 0.85
duration: 5m
action: Pages DBA, Slack #database-alerts

# Rule 4: Out of Memory
name: LowMemory
condition: memory_available < 100MB
duration: 5m
action: Pages on-call engineer, Slack #alerts

# Rule 5: Disk Full
name: DiskFull
condition: disk_usage > 0.95
duration: 15m
action: Pages on-call engineer, Slack #alerts
```

### Warning Alerts (Escalation Check)

```yaml
# Rule 6: Slow API Response
name: SlowAPIResponse
condition: p95_response_time > 0.3s
duration: 5m
action: Slack #monitoring

# Rule 7: High Memory Usage
name: HighMemory
condition: memory_usage > 400MB
duration: 10m
action: Slack #monitoring

# Rule 8: Cache Ineffective
name: CacheIneffective
condition: cache_hit_rate < 0.5
duration: 30m
action: Slack #monitoring

# Rule 9: High Database Query Time
name: SlowQueries
condition: p95_query_time > 0.15s
duration: 10m
action: Slack #database-alerts

# Rule 10: Low Auth Success Rate
name: LowAuthSuccess
condition: auth_success_rate < 0.9
duration: 10m
action: Slack #monitoring
```

### Informational Alerts (For Trending)

```yaml
# Rule 11: Unusual Traffic Pattern
name: TrafficAnomaly
condition: request_rate > baseline * 1.5
duration: 30m
action: Slack #analytics (digest)

# Rule 12: Frequent Errors from Single Source
name: ErrorSpike
condition: error_count > 10 AND requests_count > 1000
duration: 10m
action: Slack #analytics (digest)

# Rule 13: Database Replication Lag
name: ReplicationLag
condition: replica_lag > 2s
duration: 5m
action: Slack #database-alerts
```

---

## 📈 Sentry Configuration

### Error Categorization

Sentry automatically categorizes and groups errors:

```
1. Authentication Errors (403/401)
   - JWT validation failures
   - Token expiration
   - Missing credentials
   
2. Database Errors (5xx)
   - Connection failures
   - Query timeouts
   - Constraint violations
   
3. Validation Errors (400)
   - Input validation failures
   - Schema violations
   - Type mismatches
   
4. Rate Limit Errors (429)
   - API rate limits exceeded
   - Per-user limits exceeded
   
5. External Service Errors (5xx)
   - S3 failures
   - SendGrid failures
   - Third-party API errors
   
6. Unexpected Errors (5xx)
   - Unhandled exceptions
   - Promise rejections
   - Stack trace available
```

### Sentry Alerts

```yaml
Alert Conditions:
1. Error rate > 5% of requests
   - Notification: Immediate to on-call
   
2. New error pattern detected
   - Notification: Daily digest in Slack
   
3. Same error occurs 100+ times per hour
   - Notification: Slack #alerts
   
4. Database connection errors spike
   - Notification: Page SRE
   
5. Authentication failures spike
   - Notification: Slack #security
```

### Sentry Integration

```typescript
// Backend errors automatically captured
import * as Sentry from "@sentry/node";

// Critical errors sent immediately
Sentry.captureException(error, {
  level: "fatal",
  tags: {
    component: "export",
    userId: req.user?.id,
  },
});

// Performance monitoring
const transaction = Sentry.startTransaction({
  op: "database.query",
  name: "fetchReports",
});
```

---

## 🔍 Health Check Endpoints

### `/health` - Application Health
```json
{
  "status": "UP",
  "uptime": 86400,
  "timestamp": "2026-03-08T14:30:00Z",
  "services": {
    "database": "UP",
    "cache": "UP",
    "email": "UP",
    "storage": "UP"
  },
  "metrics": {
    "uptime_percent": 99.95,
    "errors_last_hour": 12,
    "avg_response_time_ms": 87
  }
}
```

### `/ready` - Readiness Probe
```json
{
  "ready": true,
  "database": {
    "connected": true,
    "latency_ms": 5
  },
  "cache": {
    "connected": true,
    "latency_ms": 2
  }
}
```

### `/metrics` - Prometheus Metrics
```
# HELP http_request_duration_seconds HTTP request latency
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1",method="GET",path="/reports"} 450
http_request_duration_seconds_bucket{le="0.5",method="GET",path="/reports"} 510
http_request_duration_seconds_bucket{le="+Inf",method="GET",path="/reports"} 520

# HELP process_resident_memory_bytes Resident memory
# TYPE process_resident_memory_bytes gauge
process_resident_memory_bytes 324589568

# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 45230
http_requests_total{method="GET",status="404"} 145
http_requests_total{method="GET",status="500"} 23
```

---

## 📋 Dashboard Templates

### Production Overview Dashboard
```
Layout:
Top Row:
  - API Status (UP/DOWN)
  - Error Rate (%)
  - P95 Response Time (ms)
  - Throughput (req/s)

Second Row:
  - Database Connections (utilization %)
  - Cache Hit Rate (%)
  - Memory Usage (MB)
  - CPU Usage (%)

Third Row:
  - Recent Errors (table)
  - Slow Queries (table)
  - Top Endpoints by Traffic (chart)
  - Error Rate by Endpoint (chart)

Fourth Row:
  - Reports Submitted (line chart)
  - Auth Success Rate (gauge)
  - Email Delivery Rate (gauge)
  - Export Operations (counter)
```

### Database Dashboard
```
Layout:
  - Query Latency (p50/p95/p99)
  - Slow Query Log (table)
  - Connection Pool Status
  - Disk Usage Over Time
  - Replication Lag
  - Index Usage Statistics
  - Collection Growth Rate
```

### Performance Dashboard
```
Layout:
  - Request Duration Distribution
  - Memory Usage Over Time
  - Cache Hit Ratio Trend
  - CPU Usage Distribution
  - Garbage Collection Pauses
  - Event Loop Lag
```

---

## 🔧 Maintenance & Optimization

### Weekly Tasks
- [ ] Review error logs and identify patterns
- [ ] Check slow query logs and optimize queries
- [ ] Verify backups completed successfully
- [ ] Review resource utilization trends
- [ ] Update alert thresholds based on baseline

### Monthly Tasks
- [ ] Full load testing (simulate 1000 concurrent users)
- [ ] Database statistics update
- [ ] Index fragmentation analysis and rebuild
- [ ] Cache performance analysis
- [ ] Cost optimization review

### Quarterly Tasks
- [ ] Full disaster recovery drill
- [ ] Security audit of logs and metrics
- [ ] Architecture review for optimization opportunities
- [ ] Database schema optimization
- [ ] Sentry settings review

---

## 🚨 Incident Response

### Detection to Resolution Timeline

| Phase | Time | Action |
|-------|------|--------|
| Detection | T+0 | Alert triggered, on-call engineer paged |
| Triage | T+5 | Severity assessed, team assembled |
| Investigation | T+15 | Root cause identified, temporary mitigation applied |
| Resolution | T+60 | Permanent fix deployed and verified |
| Post-Mortem | T+24hr | RCA conducted, preventive measures implemented |

### Common Issues & Remediation

#### Issue: API Response Time Degradation
```
Detection: P95 response time > 300ms for 5 min

Investigation Checklist:
1. Check database query times
2. Check Redis connection pool
3. Review active connections
4. Check CPU/memory usage
5. Review recent deployments
6. Check external API calls

Solutions (in order):
1. Optimize slow queries (add indexes)
2. Increase Redis connection pool
3. Implement request caching
4. Scale horizontally (add instances)
5. Rollback recent deployment
```

#### Issue: High Error Rate
```
Detection: Error rate > 1% for 5 min

Investigation:
1. Check Sentry error grouping
2. Identify error type (auth/db/validation/external)
3. Check affected endpoints
4. Review recent code changes
5. Check external service status

Solutions:
1. If database: check connectivity
2. If external service: implement circuit breaker
3. If validation: check input filtering
4. If auth: check JWT configuration
5. Rollback if from recent deployment
```

#### Issue: Database Connection Exhaustion
```
Detection: Connection pool utilization > 85%

Investigation:
1. Check active connections: db.currentOp()
2. Review long-running queries
3. Look for unclosed connections
4. Check connection timeout settings

Solutions (in order):
1. Increase pool size by 20%
2. Reduce connection timeout
3. Kill long-running queries selectively
4. Review code for connection leaks
5. Scale database vertically/horizontally
```

#### Issue: Memory Leak
```
Detection: Memory usage constantly increasing over time

Investigation:
1. Collect heap dump: node --inspect
2. Analyze with Chrome DevTools
3. Check for circular references
4. Review event listeners
5. Check for unbounded arrays/objects

Solutions:
1. Fix memory leak in code
2. Implement periodic restart (short-term)
3. Increase memory limit (temporary)
4. Implement garbage collection tuning
```

---

## 📞 On-Call Procedures

### Escalation Path
```
1. Automated Alert (Slack/Email)
   ↓
2. On-Call Engineer (Paged if critical)
   ↓
3. Engineering Lead (If not resolved in 15 min)
   ↓
4. CTO (If not resolved in 30 min)
   ↓
5. Incident Commander (Full incident response)
```

### On-Call Checklist
- [ ] Read alert notification carefully
- [ ] Check status page: /health endpoint
- [ ] Check error logs: Sentry dashboard
- [ ] Check metrics: Prometheus/Dashboard
- [ ] Identify affected systems
- [ ] Apply immediate mitigation if available
- [ ] Page escalation if uncertain
- [ ] Document findings
- [ ] Conduct post-mortem

---

## 🎯 Performance Targets & SLAs

### Service Level Agreement (SLA)
```
Availability: 99.5% (43 minutes downtime per month)
Response Time (p95): <300ms
Error Rate: <0.1%
Uptime Target: 30 days without unplanned restart
```

### Performance Targets
```
API Response Time:
  - Median: <100ms
  - P95: <300ms
  - P99: <500ms

Database Query Time:
  - Median: <50ms
  - P95: <150ms
  - P99: <300ms

Cache Hit Rate: >60%
Error Rate: <0.1%
Throughput: >1000 req/s
```

---

**Document Ownership:** DevOps Team  
**Last Reviewed:** March 8, 2026  
**Next Review:** June 8, 2026
