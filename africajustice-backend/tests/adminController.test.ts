import { Response } from 'express'
import type { AuthRequest } from '../src/middleware/auth'
import * as adminController from '../src/controllers/adminController'
import { Report } from '../src/models/Report'
import { Verification } from '../src/models/Verification'
import { Evidence } from '../src/models/Evidence'
import { User } from '../src/models/User'

// Mock models
jest.mock('../src/models/Report')
jest.mock('../src/models/Verification')
jest.mock('../src/models/Evidence')
jest.mock('../src/models/User')

describe('Admin Controller', () => {
  let req: Partial<AuthRequest>
  let res: Partial<Response>

  beforeEach(() => {
    jest.clearAllMocks()
    req = {
      query: {},
      body: {},
      params: {},
      user: { id: 'admin-123', email: 'admin@example.com', role: 'admin' } as any,
    }
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    }
  })

  describe('getAdminDashboardController', () => {
    it('should return dashboard statistics', async () => {
      const mockStats = {
        reports: { total: 10, pending: 3 },
        verifications: { total: 5, pending: 2 },
        evidence: { total: 20, pending: 5 },
        users: { total: 100, admins: 2, moderators: 5 },
      }

      ;(Report.countDocuments as jest.Mock).mockResolvedValue(10)
      ;(Report.countDocuments as jest.Mock)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(3)
      ;(Verification.countDocuments as jest.Mock)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2)
      ;(Evidence.countDocuments as jest.Mock).mockResolvedValueOnce(20)
      ;(Evidence.countDocuments as jest.Mock).mockResolvedValueOnce(5)
      ;(User.countDocuments as jest.Mock).mockResolvedValueOnce(100)
      ;(User.countDocuments as jest.Mock).mockResolvedValueOnce(2)
      ;(User.countDocuments as jest.Mock).mockResolvedValueOnce(5)

      await adminController.getAdminDashboardController(
        req as AuthRequest,
        res as Response
      )

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            reports: expect.any(Object),
            verifications: expect.any(Object),
            evidence: expect.any(Object),
            users: expect.any(Object),
          }),
        })
      )
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('Database connection failed')
      ;(Report.countDocuments as jest.Mock).mockRejectedValue(error)

      await adminController.getAdminDashboardController(
        req as AuthRequest,
        res as Response
      )

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      )
    })
  })

  describe('getReportsForModerationController', () => {
    it('should return pending reports with pagination', async () => {
      const mockReports = [
        {
          _id: 'report-1',
          title: 'Test Report',
          status: 'pending',
        },
      ]

      req.query = { page: '1', limit: '20' }
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockReports),
      }
      ;(Report.find as jest.Mock).mockReturnValue(mockQuery)
      ;(Report.countDocuments as jest.Mock).mockResolvedValue(1)

      await adminController.getReportsForModerationController(
        req as AuthRequest,
        res as Response
      )

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      )
    })

    it('should filter by status', async () => {
      req.query = { page: '1', limit: '20', status: 'pending' }

      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      }
      ;(Report.find as jest.Mock).mockReturnValue(mockQuery)
      ;(Report.countDocuments as jest.Mock).mockResolvedValue(0)

      await adminController.getReportsForModerationController(
        req as AuthRequest,
        res as Response
      )

      expect(Report.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      )
    })
  })

  describe('moderateReportController', () => {
    it('should approve a report', async () => {
      const mockReport = {
        _id: 'report-123',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      }

      req.params = { id: 'report-123' }
      req.body = {
        action: 'approve',
        reason: 'Report is credible',
      }

      ;(Report.findById as jest.Mock).mockResolvedValue(mockReport)

      await adminController.moderateReportController(
        req as AuthRequest,
        res as Response
      )

      expect(mockReport.save).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      )
    })

    it('should reject a report with reason', async () => {
      const mockReport = {
        _id: 'report-123',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      }

      req.params = { id: 'report-123' }
      req.body = {
        action: 'reject',
        reason: 'Insufficient evidence',
      }

      ;(Report.findById as jest.Mock).mockResolvedValue(mockReport)

      await adminController.moderateReportController(
        req as AuthRequest,
        res as Response
      )

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      )
    })

    it('should return 404 if report not found', async () => {
      req.params = { id: 'nonexistent' }
      req.body = { action: 'approve' }

      ;(Report.findById as jest.Mock).mockResolvedValue(null)

      await adminController.moderateReportController(
        req as AuthRequest,
        res as Response
      )

      expect(res.status).toHaveBeenCalledWith(404)
    })
  })

  describe('updateUserRoleController', () => {
    it('should update user role', async () => {
      const mockUser = {
        _id: 'user-123',
        email: 'user@example.com',
        role: 'citizen',
        save: jest.fn().mockResolvedValue(true),
      }

      req.params = { id: 'user-123' }
      req.body = { role: 'moderator' }
      req.user = { id: 'admin-456', email: 'admin@example.com', role: 'admin' } as any

      ;(User.findById as jest.Mock).mockResolvedValue(mockUser)

      await adminController.updateUserRoleController(
        req as AuthRequest,
        res as Response
      )

      expect(mockUser.role).toBe('moderator')
      expect(mockUser.save).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      )
    })

    it('should prevent self-demotion', async () => {
      req.params = { id: 'admin-123' }
      req.body = { role: 'citizen' }
      req.user = { id: 'admin-123', email: 'admin@example.com', role: 'admin' } as any

      ;(User.findById as jest.Mock).mockResolvedValue({
        _id: 'admin-123',
        role: 'admin',
      })

      await adminController.updateUserRoleController(
        req as AuthRequest,
        res as Response
      )

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/[Cc]annot|cannot/),
        })
      )
    })
  })

  describe('reviewVerificationController', () => {
    it('should verify a verification claim', async () => {
      const mockVerification = {
        _id: 'verification-123',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      }

      req.params = { id: 'verification-123' }
      req.body = {
        action: 'verify',
        confidence: 85,
        notes: 'Source is reliable',
      }

      ;(Verification.findById as jest.Mock).mockResolvedValue(
        mockVerification
      )

      await adminController.reviewVerificationController(
        req as AuthRequest,
        res as Response
      )

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      )
    })
  })

  describe('reviewEvidenceController', () => {
    it('should approve evidence', async () => {
      const mockEvidence = {
        _id: 'evidence-123',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      }

      req.params = { id: 'evidence-123' }
      req.body = {
        action: 'approve',
        reason: 'Document is authentic',
      }

      ;(Evidence.findById as jest.Mock).mockResolvedValue(mockEvidence)

      await adminController.reviewEvidenceController(
        req as AuthRequest,
        res as Response
      )

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      )
    })

    it('should reject evidence with reason', async () => {
      const mockEvidence = {
        _id: 'evidence-123',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      }

      req.params = { id: 'evidence-123' }
      req.body = {
        action: 'reject',
        reason: 'Unrelated to case',
      }

      ;(Evidence.findById as jest.Mock).mockResolvedValue(mockEvidence)

      await adminController.reviewEvidenceController(
        req as AuthRequest,
        res as Response
      )

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      )
    })
  })
})
