import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { adminMiddleware, moderatorMiddleware } from '../middleware/admin'
import {
  getAdminDashboardController,
  getReportsForModerationController,
  moderateReportController,
  getVerificationsForReviewController,
  reviewVerificationController,
  getEvidenceForReviewController,
  reviewEvidenceController,
  getUsersForManagementController,
  updateUserRoleController,
  getAuditLogsController,
} from '../controllers/adminController'

const router = Router()

/**
 * Admin Dashboard
 * GET /admin/dashboard - Get admin statistics and overview
 */
router.get('/dashboard', authMiddleware, adminMiddleware, (req, res) => {
  void getAdminDashboardController(req, res)
})

/**
 * Report Moderation
 * GET /admin/reports - Get reports for moderation
 * PATCH /admin/reports/:id - Approve/reject report
 */
router.get('/reports', authMiddleware, moderatorMiddleware, (req, res) => {
  void getReportsForModerationController(req, res)
})

router.patch('/reports/:id', authMiddleware, moderatorMiddleware, (req, res) => {
  void moderateReportController(req, res)
})

/**
 * Verification Review
 * GET /admin/verifications - Get verifications for review
 * PATCH /admin/verifications/:id - Review verification
 */
router.get('/verifications', authMiddleware, moderatorMiddleware, (req, res) => {
  void getVerificationsForReviewController(req, res)
})

router.patch('/verifications/:id', authMiddleware, moderatorMiddleware, (req, res) => {
  void reviewVerificationController(req, res)
})

/**
 * Evidence Review
 * GET /admin/evidence - Get evidence for review
 * PATCH /admin/evidence/:id - Review evidence
 */
router.get('/evidence', authMiddleware, moderatorMiddleware, (req, res) => {
  void getEvidenceForReviewController(req, res)
})

router.patch('/evidence/:id', authMiddleware, moderatorMiddleware, (req, res) => {
  void reviewEvidenceController(req, res)
})

/**
 * User Management (Admin only)
 * GET /admin/users - List all users
 * PATCH /admin/users/:id/role - Update user role
 */
router.get('/users', authMiddleware, adminMiddleware, (req, res) => {
  void getUsersForManagementController(req, res)
})

router.patch('/users/:id/role', authMiddleware, adminMiddleware, (req, res) => {
  void updateUserRoleController(req, res)
})

/**
 * Audit Logs (Admin only)
 * GET /admin/logs - Get audit logs
 */
router.get('/logs', authMiddleware, adminMiddleware, (req, res) => {
  void getAuditLogsController(req, res)
})

export default router
