import { Request, Response } from 'express'
import { Petition } from '../models/Petition'
import { AuthRequest } from '../middleware/auth'

export const createPetitionController = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { title, description } = req.body as {
      title?: string
      description?: string
    }

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'title and description are required.',
      })
    }

    const petition = await Petition.create({
      title,
      description,
      createdBy: req.user?.id || '',
      supporters: 1,
      status: 'open',
    })

    return res.status(201).json({
      success: true,
      data: petition.toJSON(),
    })
  } catch (error) {
    console.error('Create petition error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to create petition.',
    })
  }
}

export const getPetitionsController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const queryLimit = req.query.limit as string | undefined
    const querySkip = req.query.skip as string | undefined
    const { status } = req.query as {
      status?: string
    }

    const filters: { status?: string } = {}
    if (status) filters.status = status

    const parsedLimit = Math.max(1, queryLimit ? parseInt(queryLimit) : 20)
    const parsedSkip = Math.max(0, querySkip ? parseInt(querySkip) : 0)
    const total = await Petition.countDocuments(filters)
    const petitions = await Petition.find(filters)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip(parsedSkip)

    return res.json({
      success: true,
      data: petitions.map((p) => p.toJSON()),
      pagination: {
        total,
        limit: parsedLimit,
        skip: parsedSkip,
      },
    })
  } catch (error) {
    console.error('Get petitions error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve petitions.',
    })
  }
}

export const getPetitionByIdController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params
    const petition = await Petition.findById(id)

    if (!petition) {
      return res.status(404).json({
        success: false,
        message: 'Petition not found.',
      })
    }

    return res.json({
      success: true,
      data: petition.toJSON(),
    })
  } catch (error) {
    console.error('Get petition error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve petition.',
    })
  }
}

export const signPetitionController = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params

    const petition = await Petition.findByIdAndUpdate(
      id,
      { $inc: { supporters: 1 } },
      { new: true },
    )

    if (!petition) {
      return res.status(404).json({
        success: false,
        message: 'Petition not found.',
      })
    }

    return res.json({
      success: true,
      data: petition.toJSON(),
    })
  } catch (error) {
    console.error('Sign petition error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to sign petition.',
    })
  }
}

export const updatePetitionStatusController = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params
    const { status } = req.body as { status?: string }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'status is required.',
      })
    }

    const petition = await Petition.findByIdAndUpdate(id, { status }, { new: true })

    if (!petition) {
      return res.status(404).json({
        success: false,
        message: 'Petition not found.',
      })
    }

    return res.json({
      success: true,
      data: petition.toJSON(),
    })
  } catch (error) {
    console.error('Update petition error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update petition.',
    })
  }
}
