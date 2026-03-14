import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { exportLimiter } from '../middleware/rateLimitse'
import {
  exportReportAsPDF,
  exportReportsAsPDF,
  exportReportsAsCSV,
  exportEvidenceAsCSV,
  exportVerificationsAsCSV,
  exportComprehensiveCSV,
  exportAnalyticsAsPDF,
  exportAnalyticsAsCSV,
} from '../controllers/exportController'

const router = Router()

// All export endpoints require authentication
router.use(authenticate)

// Apply export rate limiting to all export endpoints
router.use(exportLimiter)

/**
 * PDF Exports
 */

// Export single report as PDF
// GET /api/v1/export/report/:reportId/pdf
router.get('/report/:reportId/pdf', exportReportAsPDF)

// Export multiple reports as PDF
// POST /api/v1/export/reports/pdf
// Body: { reportIds?: string[], filters?: object }
router.post('/reports/pdf', exportReportsAsPDF)

// Export analytics as PDF
// GET /api/v1/export/analytics/pdf?startDate=...&endDate=...
router.get('/analytics/pdf', exportAnalyticsAsPDF)

/**
 * CSV Exports
 */

// Export reports as CSV
// POST /api/v1/export/reports/csv
// Body: { reportIds?: string[], filters?: object, startDate?: date, endDate?: date }
router.post('/reports/csv', exportReportsAsCSV)

// Export evidence as CSV
// POST /api/v1/export/evidence/csv
// Body: { reportId?: string, startDate?: date, endDate?: date }
router.post('/evidence/csv', exportEvidenceAsCSV)

// Export verifications as CSV
// POST /api/v1/export/verifications/csv
// Body: { reportId?: string, startDate?: date, endDate?: date }
router.post('/verifications/csv', exportVerificationsAsCSV)

// Export comprehensive data as CSV (all types)
// POST /api/v1/export/comprehensive/csv
// Body: { reportIds?: string[], startDate?: date, endDate?: date }
router.post('/comprehensive/csv', exportComprehensiveCSV)

// Export analytics as CSV
// GET /api/v1/export/analytics/csv?startDate=...&endDate=...
router.get('/analytics/csv', exportAnalyticsAsCSV)

export default router
