import { Request, Response } from 'express'
import { Report } from '../models/Report'
import { AuthRequest } from '../middleware/auth'

export const createReportController = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { title, category, description, office, amount, source } = req.body as {
      title?: string
      category?: string
      description?: string
      office?: string
      amount?: number
      source?: string
    }

    // Validate required fields
    if (!title || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'title, category, and description are required.',
      })
    }

    // Create report
    const report = await Report.create({
      title,
      category,
      description,
      office,
      amount,
      source,
      userId: req.user?.id,
      status: 'pending',
    })

    return res.status(201).json({
      success: true,
      data: report.toJSON(),
    })
  } catch (error) {
    console.error('Create report error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to create report.',
    })
  }
}

export const getReportsController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const queryLimit = req.query.limit as string | undefined
    const querySkip = req.query.skip as string | undefined
    const { category, status } = req.query as {
      category?: string
      status?: string
    }

    const filters: { category?: string; status?: string } = {}
    if (category) filters.category = category
    if (status) filters.status = status

    const parsedLimit = Math.max(1, queryLimit ? parseInt(queryLimit) : 20)
    const parsedSkip = Math.max(0, querySkip ? parseInt(querySkip) : 0)
    const total = await Report.countDocuments(filters)
    const reports = await Report.find(filters)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip(parsedSkip)

    return res.json({
      success: true,
      data: reports.map((r) => r.toJSON()),
      pagination: {
        total,
        limit: parsedLimit,
        skip: parsedSkip,
      },
    })
  } catch (error) {
    console.error('Get reports error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reports.',
    })
  }
}

export const getReportByIdController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params
    const report = await Report.findById(id)

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.',
      })
    }

    return res.json({
      success: true,
      data: report.toJSON(),
    })
  } catch (error) {
    console.error('Get report error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve report.',
    })
  }
}

export const updateReportStatusController = async (
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

    const report = await Report.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    )

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.',
      })
    }

    return res.json({
      success: true,
      data: report.toJSON(),
    })
  } catch (error) {
    console.error('Update report error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update report.',
    })
  }
}
