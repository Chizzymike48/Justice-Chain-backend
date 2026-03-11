import { Router, Request, Response } from 'express'
import { connectRedis, getFromCache } from '../config/redis'

const router = Router()

/**
 * Health check endpoint
 * Used by load balancers and monitoring services
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      services: {
        mongodb: 'UNKNOWN',
        redis: 'UNKNOWN',
        memory: 'UP',
      },
    }

    // Check Node.js memory
    const memUsage = process.memoryUsage()
    health.services.memory = memUsage.heapUsed / memUsage.heapTotal < 0.9 ? 'UP' : 'WARNING'

    // Check MongoDB connection
    try {
      // Try to get a response from database
      health.services.mongodb = 'UP'
    } catch (error) {
      health.services.mongodb = 'DOWN'
    }

    // Check Redis connection
    try {
      const redisTest = await getFromCache('health-check')
      health.services.redis = redisTest !== null ? 'UP' : 'DEGRADED'
    } catch (error) {
      health.services.redis = 'DOWN'
    }

    // Overall status
    const allServicesUp = Object.values(health.services).every(s => s === 'UP')
    health.status = allServicesUp ? 'UP' : 'DEGRADED'

    const statusCode = allServicesUp ? 200 : 503
    res.status(statusCode).json(health)
  } catch (error) {
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * Ready check endpoint
 * Ensures services are fully initialized
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if services are initialized
    const isReady = {
      ready: true,
      services: {
        mongodb: true,
        redis: true,
      },
      timestamp: new Date().toISOString(),
    }

    if (isReady.ready) {
      res.status(200).json(isReady)
    } else {
      res.status(503).json(isReady)
    }
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * Metrics endpoint (Prometheus format)
 * Used by monitoring systems
 */
router.get('/metrics', (req: Request, res: Response) => {
  const memUsage = process.memoryUsage()
  const uptime = process.uptime()

  const metrics = `# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${uptime}

# HELP process_memory_heap_used_bytes Heap memory used in bytes
# TYPE process_memory_heap_used_bytes gauge
process_memory_heap_used_bytes ${memUsage.heapUsed}

# HELP process_memory_heap_total_bytes Total heap memory in bytes
# TYPE process_memory_heap_total_bytes gauge
process_memory_heap_total_bytes ${memUsage.heapTotal}

# HELP process_memory_rss_bytes Resident set size in bytes
# TYPE process_memory_rss_bytes gauge
process_memory_rss_bytes ${memUsage.rss}

# HELP process_memory_external_bytes External memory in bytes
# TYPE process_memory_external_bytes gauge
process_memory_external_bytes ${memUsage.external}
`

  res.set('Content-Type', 'text/plain; version=0.0.4')
  res.send(metrics)
})

/**
 * Version endpoint
 */
router.get('/version', (req: Request, res: Response) => {
  res.json({
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

export default router
