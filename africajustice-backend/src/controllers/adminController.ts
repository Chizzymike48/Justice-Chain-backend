import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { Report } from '../models/Report'
import { Verification } from '../models/Verification'
import { Evidence } from '../models/Evidence'
import { User } from '../models/User'
import { initializeSocketEvents } from '../socket/socketEvents'

/**
 * Get admin dashboard statistics
 */
export const getAdminDashboardController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reports = await Report.countDocuments()
    const pendingReports = await Report.countDocuments({ status: 'pending' })
    const verifications = await Verification.countDocuments()
    const pendingVerifications = await Verification.countDocuments({ status: 'pending' })
    const evidence = await Evidence.countDocuments()
    const users = await User.countDocuments()
    const admins = await User.countDocuments({ role: 'admin' })
    const moderators = await User.countDocuments({ role: 'moderator' })

    res.status(200).json({
      success: true,
      data: {
        reports: { total: reports, pending: pendingReports },
        verifications: { total: verifications, pending: pendingVerifications },
        evidence: { total: evidence },
        users: { total: users, admins, moderators },
        lastUpdated: new Date(),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard data.',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Get all reports for moderation
 */
export const getReportsForModerationController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', status = 'pending' } = req.query as { page?: string; limit?: string; status?: string }

    const pageNum = page ? parseInt(page, 10) : 1
    const limitNum = limit ? parseInt(limit, 10) : 20
    const skip = (pageNum - 1) * limitNum

    const query: Record<string, unknown> = status ? { status } : {}
    const reports = await Report.find(query).skip(skip).limit(limitNum).sort({ createdAt: -1 })
    const total = await Report.countDocuments(query)

    res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports for moderation.',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Approve or reject a report
 */
export const moderateReportController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { action, reason } = req.body as { action?: string; reason?: string }

    if (!action || !['approve', 'reject'].includes(action)) {
      res.status(400).json({
        success: false,
        message: 'Valid action (approve/reject) is required.',
      })
      return
    }

    const report = await Report.findById(id)
    if (!report) {
      res.status(404).json({
        success: false,
        message: 'Report not found.',
      })
      return
    }

    const newStatus = action === 'approve' ? 'investigating' : 'rejected'
    report.status = newStatus
    report.moderationReason = reason || ''
    report.moderatedBy = req.user?.id
    report.moderatedAt = new Date()

    await report.save()

    // Emit real-time event to all moderators
    try {
      const socketEvents = initializeSocketEvents()
      const moderatorName = req.user?.email || req.user?.id || 'Unknown'
      socketEvents.emitReportModerated({
        reportId: report._id.toString(),
        title: report.title,
        action: action as 'approve' | 'reject',
        moderatedBy: moderatorName,
        moderatedAt: report.moderatedAt?.toISOString() || new Date().toISOString(),
        reason: reason || undefined,
      })
      // Also emit dashboard update
      socketEvents.emitQueueRefresh('reports')
    } catch (socketError) {
      console.warn('Failed to emit socket event:', socketError)
    }

    res.status(200).json({
      success: true,
      message: `Report ${action}d successfully.`,
      data: report,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to moderate report.',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Get all verifications for review
 */
export const getVerificationsForReviewController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', status = 'pending' } = req.query as { page?: string; limit?: string; status?: string }

    const pageNum = page ? parseInt(page, 10) : 1
    const limitNum = limit ? parseInt(limit, 10) : 20
    const skip = (pageNum - 1) * limitNum

    const query: Record<string, unknown> = status ? { status } : {}
    const verifications = await Verification.find(query).skip(skip).limit(limitNum).sort({ createdAt: -1 })
    const total = await Verification.countDocuments(query)

    res.status(200).json({
      success: true,
      data: verifications,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verifications for review.',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Review and approve/dispute a verification
 */
export const reviewVerificationController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { action, confidence, notes } = req.body as { action?: string; confidence?: number; notes?: string }

    if (!action || !['verify', 'dispute'].includes(action)) {
      res.status(400).json({
        success: false,
        message: 'Valid action (verify/dispute) is required.',
      })
      return
    }

    const verification = await Verification.findById(id)
    if (!verification) {
      res.status(404).json({
        success: false,
        message: 'Verification not found.',
      })
      return
    }

    verification.status = action === 'verify' ? 'reviewed' : 'pending'
    verification.confidence = confidence || 0
    verification.reviewNotes = notes || ''
    verification.reviewedBy = req.user?.id
    verification.reviewedAt = new Date()

    await verification.save()

    // Emit real-time event to all moderators
    try {
      const socketEvents = initializeSocketEvents()
      const reviewerName = req.user?.email || req.user?.id || 'Unknown'
      socketEvents.emitVerificationReviewed({
        verificationId: verification._id.toString(),
        claim: verification.claim,
        action: action as 'verify' | 'dispute',
        confidence: confidence || 0,
        reviewedBy: reviewerName,
        reviewedAt: (verification.reviewedAt || new Date()).toISOString(),
      })
      // Also emit queue refresh
      socketEvents.emitQueueRefresh('verifications')
    } catch (socketError) {
      console.warn('Failed to emit socket event:', socketError)
    }

    res.status(200).json({
      success: true,
      message: `Verification ${action}d successfully.`,
      data: verification,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to review verification.',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Get all evidence for review
 */
export const getEvidenceForReviewController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', status = 'pending' } = req.query as { page?: string; limit?: string; status?: string }

    const pageNum = page ? parseInt(page, 10) : 1
    const limitNum = limit ? parseInt(limit, 10) : 20
    const skip = (pageNum - 1) * limitNum

    const query: Record<string, unknown> = status ? { status } : {}
    const evidence = await Evidence.find(query).skip(skip).limit(limitNum).sort({ createdAt: -1 })
    const total = await Evidence.countDocuments(query)

    res.status(200).json({
      success: true,
      data: evidence,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evidence for review.',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Approve or reject evidence
 */
export const reviewEvidenceController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { action, reason } = req.body as { action?: string; reason?: string }

    if (!action || !['approve', 'reject'].includes(action)) {
      res.status(400).json({
        success: false,
        message: 'Valid action (approve/reject) is required.',
      })
      return
    }

    const evidence = await Evidence.findById(id)
    if (!evidence) {
      res.status(404).json({
        success: false,
        message: 'Evidence not found.',
      })
      return
    }

    evidence.status = action === 'approve' ? 'approved' : 'rejected'
    evidence.reviewReason = reason || ''
    evidence.reviewedBy = req.user?.id
    evidence.reviewedAt = new Date()

    await evidence.save()

    // Emit real-time event to all moderators
    try {
      const socketEvents = initializeSocketEvents()
      const reviewerName = req.user?.email || req.user?.id || 'Unknown'
      socketEvents.emitEvidenceReviewed({
        evidenceId: evidence._id.toString(),
        filename: evidence.fileName,
        action: action as 'approve' | 'reject',
        reviewedBy: reviewerName,
        reviewedAt: (evidence.reviewedAt || new Date()).toISOString(),
        reason: reason || undefined,
      })
      // Also emit queue refresh
      socketEvents.emitQueueRefresh('evidence')
    } catch (socketError) {
      console.warn('Failed to emit socket event:', socketError)
    }

    res.status(200).json({
      success: true,
      message: `Evidence ${action}d successfully.`,
      data: evidence,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to review evidence.',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Get all users for management
 */
export const getUsersForManagementController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', role } = req.query as { page?: string; limit?: string; role?: string }

    const pageNum = page ? parseInt(page, 10) : 1
    const limitNum = limit ? parseInt(limit, 10) : 20
    const skip = (pageNum - 1) * limitNum

    const query: Record<string, unknown> = role ? { role } : {}
    const users = await User.find(query).skip(skip).limit(limitNum).sort({ createdAt: -1 })
    const total = await User.countDocuments(query)

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users.',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Update user role
 */
export const updateUserRoleController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { role } = req.body as { role?: string }

    if (!role || !['citizen', 'moderator', 'admin'].includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Valid role (citizen/moderator/admin) is required.',
      })
      return
    }

    // Prevent self-demotion
    if (id === req.user?.id && role !== 'admin') {
      res.status(400).json({
        success: false,
        message: 'Cannot change your own admin role.',
      })
      return
    }

    const user = await User.findById(id)
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.',
      })
      return
    }

    const oldRole = user.role
    user.role = role
    await user.save()

    // Emit real-time event
    try {
      const socketEvents = initializeSocketEvents()
      const changerName = req.user?.id ? req.user.email || 'Admin' : 'Unknown'
      socketEvents.emitUserRoleChanged(id, {
        userId: id,
        oldRole,
        newRole: role,
        changedBy: changerName,
      })
    } catch (socketError) {
      console.warn('Failed to emit socket event:', socketError)
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      data: user,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user role.',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Get audit logs
 */
export const getAuditLogsController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '50', action, startDate, endDate } = req.query as {
      page?: string
      limit?: string
      action?: string
      startDate?: string
      endDate?: string
    }

    const pageNum = page ? parseInt(page, 10) : 1
    const limitNum = limit ? parseInt(limit, 10) : 50
    const _skip = (pageNum - 1) * limitNum

    const query: Record<string, unknown> = {}
    if (action) query.action = action
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) (query.createdAt as Record<string, unknown>).$gte = new Date(startDate)
      if (endDate) (query.createdAt as Record<string, unknown>).$lte = new Date(endDate)
    }

    // For now, return a placeholder - audit logging would require an AuditLog model
    res.status(200).json({
      success: true,
      data: [],
      pagination: {
        total: 0,
        page: pageNum,
        limit: limitNum,
        pages: 0,
      },
      message: 'Audit system to be implemented with dedicated AuditLog model.',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs.',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
