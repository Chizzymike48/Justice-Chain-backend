import { Response } from 'express'
import { Poll } from '../models/Poll'
import { AuthRequest } from '../middleware/auth'

export const createPollController = async (req: AuthRequest, res: Response) => {
  try {
    const { question, options } = req.body as {
      question?: string
      options?: string[]
    }

    if (!question || !options || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'question and at least two options are required.',
      })
    }

    const poll = await Poll.create({
      question,
      options: options.map((label) => ({
        label,
        votes: 0,
      })),
      status: 'open',
    })

    return res.status(201).json({
      success: true,
      data: poll.toJSON(),
    })
  } catch (error) {
    console.error('Create poll error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to create poll.',
    })
  }
}

export const getPollsController = async (req: any, res: Response) => {
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
    const total = await Poll.countDocuments(filters)
    const polls = await Poll.find(filters)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip(parsedSkip)

    return res.json({
      success: true,
      data: polls.map((p) => p.toJSON()),
      pagination: {
        total,
        limit: parsedLimit,
        skip: parsedSkip,
      },
    })
  } catch (error) {
    console.error('Get polls error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve polls.',
    })
  }
}

export const getPollByIdController = async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const poll = await Poll.findById(id)

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found.',
      })
    }

    return res.json({
      success: true,
      data: poll.toJSON(),
    })
  } catch (error) {
    console.error('Get poll error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve poll.',
    })
  }
}

export const votePollController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { optionIndex } = req.body as { optionIndex?: number }

    if (optionIndex === undefined || optionIndex < 0) {
      return res.status(400).json({
        success: false,
        message: 'optionIndex is required and must be non-negative.',
      })
    }

    const poll = await Poll.findById(id)
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found.',
      })
    }

    if (!poll.options[optionIndex]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid poll option.',
      })
    }

    poll.options[optionIndex].votes += 1
    await poll.save()

    return res.json({
      success: true,
      data: poll.toJSON(),
    })
  } catch (error) {
    console.error('Vote poll error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to vote on poll.',
    })
  }
}

export const updatePollStatusController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body as { status?: string }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'status is required.',
      })
    }

    const poll = await Poll.findByIdAndUpdate(id, { status }, { new: true })

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found.',
      })
    }

    return res.json({
      success: true,
      data: poll.toJSON(),
    })
  } catch (error) {
    console.error('Update poll error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update poll.',
    })
  }
}
