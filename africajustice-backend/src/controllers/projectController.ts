import { Response } from 'express'
import { Project } from '../models/Project'
import { AuthRequest } from '../middleware/auth'

export const createProjectController = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, budget, agency, location, status } = req.body as {
      title?: string
      description?: string
      budget?: number
      agency?: string
      location?: string
      status?: string
    }

    if (!title || !description || budget === undefined || !agency) {
      return res.status(400).json({
        success: false,
        message: 'title, description, budget, and agency are required.',
      })
    }

    const project = await Project.create({
      title,
      description,
      budget,
      agency,
      location: location || '',
      status: status || 'on_track',
      progress: 0,
    })

    return res.status(201).json({
      success: true,
      data: project.toJSON(),
    })
  } catch (error) {
    console.error('Create project error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to create project.',
    })
  }
}

export const getProjectsController = async (req: any, res: Response) => {
  try {
    const queryLimit = req.query.limit as string | undefined
    const querySkip = req.query.skip as string | undefined
    const { status, agency, location } = req.query as {
      status?: string
      agency?: string
      location?: string
    }

    const filters: { status?: string; agency?: string; location?: string } = {}
    if (status) filters.status = status
    if (agency) filters.agency = agency
    if (location) filters.location = location

    const parsedLimit = Math.max(1, queryLimit ? parseInt(queryLimit) : 20)
    const parsedSkip = Math.max(0, querySkip ? parseInt(querySkip) : 0)
    const total = await Project.countDocuments(filters)
    const projects = await Project.find(filters)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip(parsedSkip)

    return res.json({
      success: true,
      data: projects.map((p) => p.toJSON()),
      pagination: {
        total,
        limit: parsedLimit,
        skip: parsedSkip,
      },
    })
  } catch (error) {
    console.error('Get projects error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve projects.',
    })
  }
}

export const getProjectByIdController = async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const project = await Project.findById(id)

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      })
    }

    return res.json({
      success: true,
      data: project.toJSON(),
    })
  } catch (error) {
    console.error('Get project error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve project.',
    })
  }
}

export const updateProjectStatusController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status, progress } = req.body as {
      status?: string
      progress?: number
    }

    const updates: { status?: string; progress?: number } = {}
    if (status) updates.status = status
    if (progress !== undefined) {
      updates.progress = Math.max(0, Math.min(100, progress))
    }

    const project = await Project.findByIdAndUpdate(id, updates, { new: true })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      })
    }

    return res.json({
      success: true,
      data: project.toJSON(),
    })
  } catch (error) {
    console.error('Update project error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update project.',
    })
  }
}
