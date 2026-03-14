import { Request, Response } from 'express'
import { Official } from '../models/Official'
import { AuthRequest } from '../middleware/auth'

export const createOfficialController = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { name, position, agency, district, trustScore } = req.body as {
      name?: string
      position?: string
      agency?: string
      district?: string
      trustScore?: number
    }

    if (!name || !position || !agency) {
      return res.status(400).json({
        success: false,
        message: 'name, position, and agency are required.',
      })
    }

    const official = await Official.create({
      name,
      position,
      agency,
      district: district || '',
      trustScore: trustScore ?? 50,
    })

    return res.status(201).json({
      success: true,
      data: official.toJSON(),
    })
  } catch (error) {
    console.error('Create official error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to create official.',
    })
  }
}

export const getOfficialsController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const queryLimit = req.query.limit as string | undefined
    const querySkip = req.query.skip as string | undefined
    const { q, agency } = req.query as {
      q?: string
      agency?: string
    }

    const filters: { $or?: Array<{ [key: string]: { $regex: string; $options: string } }>; agency?: string } = {}

    if (q) {
      filters.$or = [
        { name: { $regex: q, $options: 'i' } },
        { position: { $regex: q, $options: 'i' } },
        { district: { $regex: q, $options: 'i' } },
      ]
    }

    if (agency) {
      filters.agency = agency
    }

    const parsedLimit = Math.max(1, queryLimit ? parseInt(queryLimit) : 20)
    const parsedSkip = Math.max(0, querySkip ? parseInt(querySkip) : 0)
    const total = await Official.countDocuments(filters)
    const officials = await Official.find(filters)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip(parsedSkip)

    return res.json({
      success: true,
      data: officials.map((o) => o.toJSON()),
      pagination: {
        total,
        limit: parsedLimit,
        skip: parsedSkip,
      },
    })
  } catch (error) {
    console.error('Get officials error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve officials.',
    })
  }
}

export const getOfficialByIdController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params
    const official = await Official.findById(id)

    if (!official) {
      return res.status(404).json({
        success: false,
        message: 'Official not found.',
      })
    }

    return res.json({
      success: true,
      data: official.toJSON(),
    })
  } catch (error) {
    console.error('Get official error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve official.',
    })
  }
}

export const updateOfficialTrustScoreController = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params
    const { trustScore } = req.body as { trustScore?: number }

    if (trustScore === undefined) {
      return res.status(400).json({
        success: false,
        message: 'trustScore is required.',
      })
    }

    const official = await Official.findByIdAndUpdate(
      id,
      { trustScore: Math.max(0, Math.min(100, trustScore)) },
      { new: true },
    )

    if (!official) {
      return res.status(404).json({
        success: false,
        message: 'Official not found.',
      })
    }

    return res.json({
      success: true,
      data: official.toJSON(),
    })
  } catch (error) {
    console.error('Update official error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update official.',
    })
  }
}
