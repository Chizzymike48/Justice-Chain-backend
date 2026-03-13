import { Request, Response, Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import type { AuthRequest } from '../types'
import { auditWriteAction } from '../middleware/audit'
import { validateRequest } from '../middleware/validation'
import { createLiveStreamValidator } from '../validators/livestreamValidators'
import { LiveStream } from '../models/LiveStream'
import livestreamService from '../services/livestreamService'
import recordingService from '../services/recordingService'

const router = Router()

// Get all livestreams
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { caseId } = _req.query as { caseId?: string }
    const streams = await LiveStream.find(caseId ? { caseId } : {}).sort({ createdAt: -1 })
    res.json({
      success: true,
      data: streams.map((stream) => ({
        ...stream.toJSON(),
        viewerCount: livestreamService.getViewerCount(stream.id),
      })),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve livestreams.',
    })
  }
})

// Get active livestreams
router.get('/active', async (_req: Request, res: Response) => {
  try {
    const streams = await LiveStream.find({ status: 'active' }).sort({ createdAt: -1 })
    res.json({
      success: true,
      data: streams.map((stream) => ({
        ...stream.toJSON(),
        viewerCount: livestreamService.getViewerCount(stream.id),
      })),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve active livestreams.',
    })
  }
})

// Create livestream (in-app streaming)
router.post(
  '/',
  authMiddleware,
  createLiveStreamValidator,
  validateRequest,
  auditWriteAction('livestream.create'),
  async (req: AuthRequest, res: Response): Promise<unknown> => {
    try {
      const { title, description, status, caseId, streamId } = req.body as {
        title?: string
        description?: string
        status?: string
        caseId?: string
        streamId?: string
      }

      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'title is required.',
        })
      }

      const newStreamId = streamId || `stream-${req.user?.id}-${Date.now()}`

      const stream = await LiveStream.create({
        title,
        description,
        caseId,
        userId: req.user?.id,
        status: status || 'active',
        streamId: newStreamId,
        // For in-app streams, we store the stream ID instead of external URLs
      })

      // Create session in livestream service
      livestreamService.createStreamSession(newStreamId, req.user?.id || '', title, caseId)

      return res.status(201).json({
        success: true,
        data: {
          ...stream.toJSON(),
          viewerCount: 0,
        },
      })
    } catch (error) {
      console.error('Failed to create livestream:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to create livestream.',
      })
    }
  },
)

// Get livestream by ID
router.get('/:id', async (req: Request, res: Response): Promise<unknown> => {
  try {
    const stream = await LiveStream.findById(req.params.id)
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found.',
      })
    }
    return res.json({
      success: true,
      data: {
        ...stream.toJSON(),
        viewerCount: livestreamService.getViewerCount(stream.id),
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve livestream.',
    })
  }
})

// Update livestream status
router.patch(
  '/:id',
  authMiddleware,
  auditWriteAction('livestream.update'),
  async (req: AuthRequest, res: Response): Promise<unknown> => {
    try {
      const { status } = req.body as { status?: string }
      const stream = await LiveStream.findById(req.params.id)

      if (!stream) {
        return res.status(404).json({
          success: false,
          message: 'Livestream not found.',
        })
      }

      // Verify user owns the stream
      if (stream.userId !== req.user?.id) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to update this stream.',
        })
      }

      if (status && (status === 'active' || status === 'stopped')) {
        stream.status = status
        await stream.save()

        // Update session status
        livestreamService.updateStreamStatus(stream.id, status as 'active' | 'stopped')

        // Create recording if stream is stopped
        if (status === 'stopped') {
          const session = livestreamService.getStreamSession(stream.id)
          if (session) {
            const duration = livestreamService.getStreamDuration(stream.id)
            try {
              await recordingService.createRecording({
                streamId: stream.id,
                title: stream.title,
                userId: stream.userId || '',
                duration,
                frameCount: session.totalFrames,
                recordingPath: session.recordingPath || '',
                thumbnailPath: session.thumbnailPath,
                caseId: stream.caseId,
                quality: session.quality,
                viewerCount: session.viewers.size,
                peakViewers: session.viewers.size,
                startedAt: session.startedAt,
                endedAt: new Date(),
              })
              console.log(`Recording created for stream: ${stream.id}`)
            } catch (recordingError) {
              console.error('Failed to create recording:', recordingError)
              // Don't fail the request if recording creation fails
            }
          }
        }
      }

      return res.json({
        success: true,
        data: {
          ...stream.toJSON(),
          viewerCount: livestreamService.getViewerCount(stream.id),
        },
      })
    } catch (error) {
      console.error('Failed to update livestream:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to update livestream.',
      })
    }
  },
)

export default router
