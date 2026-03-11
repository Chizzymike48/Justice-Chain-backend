import 'dotenv/config'
import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import validateEnv from './config/validateEnv'
import connectDB from './config/database'
import { connectRedis } from './config/redis'
import { initializeSentry, setupSentryMiddleware, setupSentryErrorHandler } from './config/sentry'
import errorHandler from './middleware/errorHandler'
import { generalLimiter } from './middleware/rateLimit'
import { setupSwagger } from './config/swagger'
import authRoutes from './routes/auth.routes'
import reportRoutes from './routes/reports.routes'
import verifyRoutes from './routes/verify.routes'
import officialsRoutes from './routes/officials.routes'
import projectsRoutes from './routes/projects.routes'
import evidenceRoutes from './routes/evidence.routes'
import livestreamRoutes from './routes/livestream.routes'
import recordingsRoutes from './routes/recordings.routes'
import petitionsRoutes from './routes/petitions.routes'
import pollsRoutes from './routes/polls.routes'
import analyticsRoutes from './routes/analytics.routes'
import aiRoutes from './routes/ai.routes'
import adminRoutes from './routes/admin.routes'
import exportRoutes from './routes/export.routes'
import chatRoutes from './routes/chat.routes'

const app: Express = express()
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000']

if (process.env.NODE_ENV !== 'test') {
  validateEnv()
  connectDB().catch(() =>
    console.warn('MongoDB connection failed, continuing without database')
  )
  // Add timeout to Redis connection
  Promise.race([
    connectRedis(),
    new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 5000)
    ),
  ]).catch(() =>
    console.warn('Redis connection failed, continuing without cache')
  )
  initializeSentry()
}

// Sentry request handler (should be first)
setupSentryMiddleware(app)

app.use(helmet())
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())
app.use(compression())

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Setup Swagger API documentation
setupSwagger(app)

app.use('/api/', generalLimiter)

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/reports', reportRoutes)
app.use('/api/v1/verify', verifyRoutes)
app.use('/api/v1/officials', officialsRoutes)
app.use('/api/v1/projects', projectsRoutes)
app.use('/api/v1/evidence', evidenceRoutes)
app.use('/api/v1/livestream', livestreamRoutes)
app.use('/api/v1/recordings', recordingsRoutes)
app.use('/api/v1/petitions', petitionsRoutes)
app.use('/api/v1/polls', pollsRoutes)
app.use('/api/v1/analytics', analyticsRoutes)
app.use('/api/v1/ai', aiRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/export', exportRoutes)
app.use('/api/v1/chat', chatRoutes)

app.get('/healthz', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'AfricaJustice API v1.0',
    endpoints: {
      auth: '/api/v1/auth',
      reports: '/api/v1/reports',
      verify: '/api/v1/verify',
      officials: '/api/v1/officials',
      projects: '/api/v1/projects',
      evidence: '/api/v1/evidence',
      livestream: '/api/v1/livestream',
      petitions: '/api/v1/petitions',
      polls: '/api/v1/polls',
      analytics: '/api/v1/analytics',
      ai: '/api/v1/ai',
      admin: '/api/v1/admin',
    },
  })
})

app.use(errorHandler)

// Sentry error handler (should be before 404 handler)
setupSentryErrorHandler(app)

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  })
})

export default app
