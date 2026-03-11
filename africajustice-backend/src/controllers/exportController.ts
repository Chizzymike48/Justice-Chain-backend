import { Response } from 'express'
import type { IAuthRequest } from '../types'
import { Report, Evidence, Verification } from '../models'
import { generateReportPDF, generateBulkReportsPDF, generateAnalyticsPDF } from '../services/pdfExportService'
import {
  generateReportsCSV,
  generateEvidenceCSV,
  generateVerificationsCSV,
  generateAnalyticsCSV,
  generateComprehensiveCSV,
} from '../services/csvExportService'
import { captureError, addBreadcrumb } from '../config/sentry'

/**
 * Export single report as PDF
 * GET /api/v1/export/report/:reportId/pdf
 */
export async function exportReportAsPDF(req: IAuthRequest, res: Response): Promise<void> {
  try {
    const { reportId } = req.params

    addBreadcrumb('Export report as PDF', 'export', 'info', { reportId })

    // Fetch report and related data
    const report = await Report.findById(reportId)
    if (!report) {
      addBreadcrumb('Report not found', 'export', 'warning', { reportId })
      res.status(404).json({ success: false, message: 'Report not found' })
      return
    }

    // Fetch associated evidence and verifications
    const [evidence, verifications] = await Promise.all([
      Evidence.find({ reportId }),
      Verification.find({ reportId }),
    ])

    // Generate PDF
    const pdfStream = await generateReportPDF({
      report: report as any,
      evidence: evidence as any,
      verifications: verifications as any,
    })

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.pdf"`)

    addBreadcrumb('PDF generated successfully', 'export', 'info')
    pdfStream.pipe(res)
  } catch (error) {
    addBreadcrumb('Error exporting PDF', 'export', 'error')
    captureError(error as Error, { context: 'exportReportAsPDF' })
    res.status(500).json({ success: false, message: 'Failed to export report' })
  }
}

/**
 * Export reports as PDF (bulk)
 * POST /api/v1/export/reports/pdf
 */
export async function exportReportsAsPDF(req: IAuthRequest, res: Response): Promise<void> {
  try {
    const { reportIds: requestReportIds = [], filters = {} } = req.body

    addBreadcrumb('Bulk export reports as PDF', 'export', 'info', { count: requestReportIds.length })

    let query: any = {}
    if (requestReportIds.length > 0) {
      query._id = { $in: requestReportIds }
    } else if (Object.keys(filters).length > 0) {
      query = filters
    }

    // Fetch reports with pagination limit (max 100)
    const limit = Math.min(100, 100)
    const reports = await Report.find(query).limit(limit)

    if (reports.length === 0) {
      res.status(404).json({ success: false, message: 'No reports found' })
      return
    }

    // Fetch associated data in bulk (avoid N+1 queries)
    const reportIdList = reports.map(r => r._id || r.id)
    const [allEvidence] = await Promise.all([
      Evidence.find({ caseId: { $in: reportIdList } })
    ])

    // Group evidence by reportId
    const evidenceMap = new Map<string, any[]>()
    
    allEvidence.forEach(e => {
      const key = String(e.caseId)
      if (!evidenceMap.has(key)) evidenceMap.set(key, [])
      evidenceMap.get(key)!.push(e)
    })

    // Build reports with mapped data
    const reportsWithData = reports.map(report => ({
      report: report as any,
      evidence: evidenceMap.get(String(report._id || report.id)) || []
    }))

    // Generate PDF
    const pdfStream = await generateBulkReportsPDF(
      reportsWithData.map((d: any) => d.report)
    )

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="reports-bulk-${Date.now()}.pdf"`)

    addBreadcrumb('Bulk PDF generated', 'export', 'info', { reportCount: reports.length })
    pdfStream.pipe(res)
  } catch (error) {
    addBreadcrumb('Error exporting bulk PDF', 'export', 'error')
    captureError(error as Error, { context: 'exportReportsAsPDF' })
    res.status(500).json({ success: false, message: 'Failed to export reports' })
  }
}

/**
 * Export reports as CSV
 * POST /api/v1/export/reports/csv
 */
export async function exportReportsAsCSV(req: IAuthRequest, res: Response): Promise<void> {
  try {
    const { reportIds = [], filters = {}, startDate, endDate } = req.body

    addBreadcrumb('Export reports as CSV', 'export', 'info')

    let query: any = {}
    if (reportIds.length > 0) {
      query._id = { $in: reportIds }
    } else if (Object.keys(filters).length > 0) {
      query = filters
    }

    // Add date range if provided
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const reports = await Report.find(query).limit(500) // Reduced from 10000 for memory safety

    if (reports.length === 0) {
      res.status(404).json({ success: false, message: 'No reports found' })
      return
    }

    const csv = generateReportsCSV(reports as any)

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="reports-${Date.now()}.csv"`)

    addBreadcrumb('CSV generated', 'export', 'info', { reportCount: reports.length })
    res.send(csv)
  } catch (error) {
    addBreadcrumb('Error exporting CSV', 'export', 'error')
    captureError(error as Error, { context: 'exportReportsAsCSV' })
    res.status(500).json({ success: false, message: 'Failed to export reports' })
  }
}

/**
 * Export evidence as CSV
 * POST /api/v1/export/evidence/csv
 */
export async function exportEvidenceAsCSV(req: IAuthRequest, res: Response): Promise<void> {
  try {
    const { reportId, startDate, endDate } = req.body

    addBreadcrumb('Export evidence as CSV', 'export', 'info')

    const query: any = {}
    if (reportId) {
      query.reportId = reportId
    }

    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const evidence = await Evidence.find(query).limit(500) // Reduced from 5000 for memory safety

    if (evidence.length === 0) {
      res.status(404).json({ success: false, message: 'No evidence found' })
      return
    }

    const csv = generateEvidenceCSV(evidence as any)

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="evidence-${Date.now()}.csv"`)

    addBreadcrumb('Evidence CSV generated', 'export', 'info', { count: evidence.length })
    res.send(csv)
  } catch (error) {
    addBreadcrumb('Error exporting evidence', 'export', 'error')
    captureError(error as Error, { context: 'exportEvidenceAsCSV' })
    res.status(500).json({ success: false, message: 'Failed to export evidence' })
  }
}

/**
 * Export verifications as CSV
 * POST /api/v1/export/verifications/csv
 */
export async function exportVerificationsAsCSV(req: IAuthRequest, res: Response): Promise<void> {
  try {
    const { reportId, startDate, endDate } = req.body

    addBreadcrumb('Export verifications as CSV', 'export', 'info')

    const query: any = {}
    if (reportId) {
      query.reportId = reportId
    }

    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const verifications = await Verification.find(query).limit(500) // Reduced from 5000 for memory safety

    if (verifications.length === 0) {
      res.status(404).json({ success: false, message: 'No verifications found' })
      return
    }

    const csv = generateVerificationsCSV(verifications as any)

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="verifications-${Date.now()}.csv"`)

    addBreadcrumb('Verifications CSV generated', 'export', 'info', { count: verifications.length })
    res.send(csv)
  } catch (error) {
    addBreadcrumb('Error exporting verifications', 'export', 'error')
    captureError(error as Error, { context: 'exportVerificationsAsCSV' })
    res.status(500).json({ success: false, message: 'Failed to export verifications' })
  }
}

/**
 * Export comprehensive data as CSV
 * POST /api/v1/export/comprehensive/csv
 */
export async function exportComprehensiveCSV(req: IAuthRequest, res: Response): Promise<void> {
  try {
    const { reportIds = [], startDate, endDate } = req.body

    addBreadcrumb('Export comprehensive data', 'export', 'info')

    const reportQuery: any = {}
    if (reportIds.length > 0) {
      reportQuery._id = { $in: reportIds }
    }

    if (startDate || endDate) {
      reportQuery.createdAt = {}
      if (startDate) reportQuery.createdAt.$gte = new Date(startDate)
      if (endDate) reportQuery.createdAt.$lte = new Date(endDate)
    }

    // Fetch all data with reduced limits for memory safety
    const [reports, evidence, verifications] = await Promise.all([
      Report.find(reportQuery).limit(500),
      Evidence.find(reportIds.length > 0 ? { reportId: { $in: reportIds } } : {}).limit(500),
      Verification.find(reportIds.length > 0 ? { reportId: { $in: reportIds } } : {}).limit(500),
    ])

    const csv = generateComprehensiveCSV({
      reports: reports as any,
      evidence: evidence as any,
      verifications: verifications as any,
    })

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="comprehensive-${Date.now()}.csv"`)

    addBreadcrumb('Comprehensive export generated', 'export', 'info', {
      reports: reports.length,
      evidence: evidence.length,
      verifications: verifications.length,
    })
    res.send(csv)
  } catch (error) {
    addBreadcrumb('Error exporting comprehensive data', 'export', 'error')
    captureError(error as Error, { context: 'exportComprehensiveCSV' })
    res.status(500).json({ success: false, message: 'Failed to export data' })
  }
}

/**
 * Export analytics as PDF
 * GET /api/v1/export/analytics/pdf
 */
export async function exportAnalyticsAsPDF(req: IAuthRequest, res: Response): Promise<void> {
  try {
    const { startDate, endDate } = req.query

    addBreadcrumb('Export analytics as PDF', 'export', 'info')

    const dateQuery: any = {}
    if (startDate || endDate) {
      dateQuery.createdAt = {}
      if (startDate) dateQuery.createdAt.$gte = new Date(String(startDate))
      if (endDate) dateQuery.createdAt.$lte = new Date(String(endDate))
    }

    // Gather analytics data
    const reports = await Report.find(dateQuery)
    const verifications = await Verification.find(dateQuery)

    // Calculate metrics
    const reportsByType: { [key: string]: number } = {}
    const reportsByStatus: { [key: string]: number } = {}

    reports.forEach((report: any) => {
      reportsByType[report.type || 'Unknown'] = (reportsByType[report.type || 'Unknown'] || 0) + 1
      reportsByStatus[report.status || 'Unknown'] =
        (reportsByStatus[report.status || 'Unknown'] || 0) + 1
    })

    // Generate PDF
    const pdfStream = await generateAnalyticsPDF({
      totalReports: reports.length,
      totalVerifications: verifications.length,
      totalEvidence: 0,
      reportsByType,
      reportsByStatus,
      averageResolutionTime: 0,
      topReporters: [],
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${Date.now()}.pdf"`)

    addBreadcrumb('Analytics PDF generated', 'export', 'info')
    pdfStream.pipe(res)
  } catch (error) {
    addBreadcrumb('Error exporting analytics', 'export', 'error')
    captureError(error as Error, { context: 'exportAnalyticsAsPDF' })
    res.status(500).json({ success: false, message: 'Failed to export analytics' })
  }
}

/**
 * Export analytics as CSV
 * GET /api/v1/export/analytics/csv
 */
export async function exportAnalyticsAsCSV(req: IAuthRequest, res: Response): Promise<void> {
  try {
    const { startDate, endDate } = req.query

    addBreadcrumb('Export analytics as CSV', 'export', 'info')

    const dateQuery: any = {}
    if (startDate || endDate) {
      dateQuery.createdAt = {}
      if (startDate) dateQuery.createdAt.$gte = new Date(String(startDate))
      if (endDate) dateQuery.createdAt.$lte = new Date(String(endDate))
    }

    const reports = await Report.find(dateQuery)
    const verifications = await Verification.find(dateQuery)

    // Build analytics data
    const reportsByType: { [key: string]: number } = {}
    const reportsByStatus: { [key: string]: number } = {}
    const reportsByOfficer: { [key: string]: number } = {}

    reports.forEach((report: any) => {
      reportsByType[report.type || 'Unknown'] = (reportsByType[report.type || 'Unknown'] || 0) + 1
      reportsByStatus[report.status || 'Unknown'] =
        (reportsByStatus[report.status || 'Unknown'] || 0) + 1
    })

    const csv = generateAnalyticsCSV({
      totalReports: reports.length,
      reportsByType,
      reportsByStatus,
      reportsByOfficer,
      verificationMetrics: {
        total: verifications.length,
        approved: verifications.filter((v: any) => v.status === 'approved').length,
        rejected: verifications.filter((v: any) => v.status === 'rejected').length,
        pending: verifications.filter((v: any) => v.status === 'pending').length,
      },
      timeSeriesData: [],
    })

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${Date.now()}.csv"`)

    addBreadcrumb('Analytics CSV generated', 'export', 'info')
    res.send(csv)
  } catch (error) {
    addBreadcrumb('Error exporting analytics CSV', 'export', 'error')
    captureError(error as Error, { context: 'exportAnalyticsAsCSV' })
    res.status(500).json({ success: false, message: 'Failed to export analytics' })
  }
}
