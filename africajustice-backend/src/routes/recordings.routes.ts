import { Request, Response, Router } from 'express'
import { AuthRequest, authMiddleware } from '../middleware/auth'
import recordingService from '../services/recordingService'
import { StreamRecording } from '../models/StreamRecording'

const router = Router()

// Get recording by stream ID
router.get(
  '/:streamId',
  async (req: Request, res: Response): Promise<unknown> => {
    try {
      const recording = await recordingService.getRecording(req.params.streamId)
      if (!recording) {
        return res.status(404).json({
          success: false,
          message: 'Recording not found',
        })
      }

      return res.json({
        success: true,
        data: recording,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve recording',
      })
    }
  },
)

// Get user's recordings
router.get(
  '/user',
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<unknown> => {
    try {
      const limit = parseInt(req.query.limit as string) || 20
      const skip = parseInt(req.query.skip as string) || 0

      const recordings = await recordingService.getRecordingsByUser(
        req.user?.id || '',
        limit,
        skip,
      )

      return res.json({
        success: true,
        data: recordings,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve recordings',
      })
    }
  },
)

// Get recordings for a case
router.get(
  '/case/:caseId',
  async (req: Request, res: Response): Promise<unknown> => {
    try {
      const recordings = await recordingService.getRecordingsByCase(req.params.caseId)

      return res.json({
        success: true,
        data: recordings,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve case recordings',
      })
    }
  },
)

// Get stream analytics
router.get(
  '/analytics/:streamId',
  async (req: Request, res: Response): Promise<unknown> => {
    try {
      const analytics = await recordingService.getAnalytics(req.params.streamId)

      if (!analytics) {
        return res.status(404).json({
          success: false,
          message: 'Analytics not found',
        })
      }

      return res.json({
        success: true,
        data: analytics,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve analytics',
      })
    }
  },
)

// Record viewer events
router.post(
  '/events',
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<unknown> => {
    try {
      const { events } = req.body as { events: any[] }

      if (!Array.isArray(events)) {
        return res.status(400).json({
          success: false,
          message: 'Events must be an array',
        })
      }

      // Process and save events in batch
      // In production, save to analytics database
      console.log(`Recorded ${events.length} analytics events`)

      return res.json({
        success: true,
        message: `${events.length} events recorded`,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to record events',
      })
    }
  },
)

export default router
