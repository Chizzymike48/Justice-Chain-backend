import { Router, Request, Response } from 'express'
import { AuthRequest, authMiddleware } from '../middleware/auth'
import {
  getDashboardMetricsController,
  getDistrictAnalyticsController,
  getReportAnalyticsController,
} from '../controllers/analyticsController'

const router = Router()
router.use(authMiddleware)

router.get('/dashboard', getDashboardMetricsController)

router.get('/district', getDistrictAnalyticsController)

router.get('/reports', getReportAnalyticsController)

// Stream-specific analytics endpoints
router.post(
  '/stream-events',
  async (req: AuthRequest, res: Response): Promise<unknown> => {
    try {
      const { events } = req.body as { events: any[] }

      if (!Array.isArray(events)) {
        return res.status(400).json({
          success: false,
          message: 'Events must be an array',
        })
      }

      // Process viewer join/leave/quality change events
      const processedEvents = events.map((event) => ({
        ...event,
        userId: req.user?.id,
        recordedAt: new Date(),
      }))

      console.log(`Received ${processedEvents.length} analytics events`)

      return res.json({
        success: true,
        message: 'Events recorded successfully',
        count: processedEvents.length,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to record events',
      })
    }
  },
)

// Get stream analytics summary
router.get(
  '/stream/:streamId',
  async (req: Request, res: Response): Promise<unknown> => {
    try {
      const analytics = {
        streamId: req.params.streamId,
        totalViewers: 0,
        peakViewers: 0,
        averageDuration: 0,
        totalWatchTime: 0,
        deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
        qualityBreakdown: { high: 0, medium: 0, low: 0 },
      }

      return res.json({
        success: true,
        data: analytics,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve stream analytics',
      })
    }
  },
)

// Get top streams
router.get(
  '/top-streams',
  async (req: Request, res: Response): Promise<unknown> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10
      const topStreams: any[] = []

      return res.json({
        success: true,
        data: topStreams,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve top streams',
      })
    }
  },
)

export default router
