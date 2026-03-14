import { Request, Response } from 'express'
import { Verification } from '../models/Verification'
import { AuthRequest } from '../middleware/auth'

export const submitVerificationController = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { claim, source, confidence } = req.body as {
      claim?: string
      source?: string
      confidence?: number
    }

    if (!claim) {
      return res.status(400).json({
        success: false,
        message: 'claim is required.',
      })
    }

    // Validate confidence is between 0-100
    let validConfidence = confidence ?? 50
    if (validConfidence < 0 || validConfidence > 100) {
      validConfidence = Math.max(0, Math.min(100, validConfidence))
    }

    const verification = await Verification.create({
      claim,
      source: source || '',
      confidence: validConfidence,
      status: 'pending',
    })

    return res.status(201).json({
      success: true,
      data: verification.toJSON(),
    })
  } catch (error) {
    console.error('Submit verification error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to submit verification.',
    })
  }
}

export const getVerificationsController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const queryLimit = req.query.limit as string | undefined
    const querySkip = req.query.skip as string | undefined
    const { status } = req.query as {
      status?: string
    }

    const filters: { status?: string } = {}
    if (status) filters.status = status as 'pending' | 'reviewed'

    const parsedLimit = Math.max(1, queryLimit ? parseInt(queryLimit) : 20)
    const parsedSkip = Math.max(0, querySkip ? parseInt(querySkip) : 0)
    const total = await Verification.countDocuments(filters)
    const verifications = await Verification.find(filters)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip(parsedSkip)

    return res.json({
      success: true,
      data: verifications.map((v) => v.toJSON()),
      pagination: {
        total,
        limit: parsedLimit,
        skip: parsedSkip,
      },
    })
  } catch (error) {
    console.error('Get verifications error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve verifications.',
    })
  }
}

export const getVerificationByIdController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params
    const verification = await Verification.findById(id)

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found.',
      })
    }

    return res.json({
      success: true,
      data: verification.toJSON(),
    })
  } catch (error) {
    console.error('Get verification error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve verification.',
    })
  }
}

export const reviewVerificationController = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params
    const { status, confidence } = req.body as {
      status?: 'pending' | 'reviewed'
      confidence?: number
    }

    const updates: { status?: 'pending' | 'reviewed'; confidence?: number } = {}
    if (status) updates.status = status
    if (confidence !== undefined) {
      updates.confidence = Math.max(0, Math.min(100, confidence))
    }

    const verification = await Verification.findByIdAndUpdate(id, updates, { new: true })

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found.',
      })
    }

    return res.json({
      success: true,
      data: verification.toJSON(),
    })
  } catch (error) {
    console.error('Review verification error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to review verification.',
    })
  }
}
