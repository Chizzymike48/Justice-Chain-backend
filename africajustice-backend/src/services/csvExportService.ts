import { Parser } from 'json2csv'
import type { IReport, IEvidence, IVerification } from '../models'

type ReportExtras = {
  type?: string
  location?: string
  reporterEmail?: string
  evidenceCount?: number
  verificationStatus?: string
}

type EvidenceExtras = {
  reportId?: string
  type?: string
  description?: string
  fileName?: string
  fileSize?: number
  uploadedBy?: string
  virusStatus?: string
}

type VerificationExtras = {
  reportId?: string
  verifiedBy?: string
  verifierRole?: string
  notes?: string
  evidence?: string
  riskLevel?: string
}

interface CSVExportOptions {
  delimiter?: ','  | ';' | '\t'
  includeHeaders?: boolean
  quote?: string
}

/**
 * Convert reports to CSV format
 */
export function generateReportsCSV(
  reports: (IReport & { _id: string })[],
  options: CSVExportOptions = {}
): string {
  const { delimiter = ',', includeHeaders = true } = options

  const fields = [
    'id',
    'title',
    'type',
    'status',
    'description',
    'location',
    'reporterEmail',
    'createdAt',
    'updatedAt',
    'evidenceCount',
    'verificationStatus',
  ]

  const data = reports.map((report) => {
    const reportData = report as IReport & ReportExtras
    return {
      id: String(report._id),
      title: report.title || '',
      type: reportData.type || '',
      status: report.status || '',
      description: report.description || '',
      location: reportData.location || '',
      reporterEmail: reportData.reporterEmail || '',
      createdAt: report.createdAt ? new Date(report.createdAt).toISOString() : '',
      updatedAt: report.updatedAt ? new Date(report.updatedAt).toISOString() : '',
      evidenceCount: reportData.evidenceCount || 0,
      verificationStatus: reportData.verificationStatus || 'Pending',
    }
  })

  try {
    const parser = new Parser({ fields, delimiter, header: includeHeaders })
    return parser.parse(data)
  } catch (error) {
    console.error('Error generating CSV:', error)
    throw new Error('Failed to generate CSV')
  }
}

/**
 * Convert evidence to CSV format
 */
export function generateEvidenceCSV(
  evidence: (IEvidence & { _id: string })[],
  options: CSVExportOptions = {}
): string {
  const { delimiter = ',' } = options

  const fields = [
    'id',
    'reportId',
    'type',
    'status',
    'description',
    'fileName',
    'fileSize',
    'uploadedBy',
    'virusStatus',
    'createdAt',
    'updatedAt',
  ]

  const data = evidence.map((ev) => {
    const evidenceData = ev as IEvidence & EvidenceExtras
    return {
      id: String(ev._id),
      reportId: String(evidenceData.reportId || ''),
      type: evidenceData.type || '',
      status: ev.status || '',
      description: evidenceData.description || '',
      fileName: evidenceData.fileName || '',
      fileSize: evidenceData.fileSize || 0,
      uploadedBy: String(evidenceData.uploadedBy || ''),
      virusStatus: evidenceData.virusStatus || 'Not Scanned',
      createdAt: ev.createdAt ? new Date(ev.createdAt).toISOString() : '',
      updatedAt: ev.updatedAt ? new Date(ev.updatedAt).toISOString() : '',
    }
  })

  try {
    const parser = new Parser({ fields, delimiter })
    return parser.parse(data)
  } catch (error) {
    console.error('Error generating evidence CSV:', error)
    throw new Error('Failed to generate CSV')
  }
}

/**
 * Convert verifications to CSV format
 */
export function generateVerificationsCSV(
  verifications: (IVerification & { _id: string })[],
  options: CSVExportOptions = {}
): string {
  const { delimiter = ',' } = options

  const fields = [
    'id',
    'reportId',
    'status',
    'verifiedBy',
    'verifierRole',
    'notes',
    'evidence',
    'riskLevel',
    'createdAt',
    'updatedAt',
  ]

  const data = verifications.map((verification) => {
    const verificationData = verification as IVerification & VerificationExtras
    return {
      id: String(verification._id),
      reportId: String(verificationData.reportId || ''),
      status: verification.status || '',
      verifiedBy: String(verificationData.verifiedBy || ''),
      verifierRole: verificationData.verifierRole || '',
      notes: verificationData.notes || '',
      evidence: verificationData.evidence || '',
      riskLevel: verificationData.riskLevel || 'Unknown',
      createdAt: verification.createdAt ? new Date(verification.createdAt).toISOString() : '',
      updatedAt: verification.updatedAt ? new Date(verification.updatedAt).toISOString() : '',
    }
  })

  try {
    const parser = new Parser({ fields, delimiter })
    return parser.parse(data)
  } catch (error) {
    console.error('Error generating verifications CSV:', error)
    throw new Error('Failed to generate CSV')
  }
}

/**
 * Generate analytics CSV export
 */
export function generateAnalyticsCSV(
  analytics: {
    totalReports: number
    reportsByType: { [key: string]: number }
    reportsByStatus: { [key: string]: number }
    reportsByOfficer: { [key: string]: number }
    verificationMetrics: {
      total: number
      approved: number
      rejected: number
      pending: number
    }
    timeSeriesData: Array<{
      date: string
      reportsCreated: number
      reportsResolved: number
      verificationsDone: number
    }>
  },
  _options: CSVExportOptions = {}
): string {
  try {
    // Summary section
    let csv = 'SUMMARY\n'
    csv += `Total Reports,${analytics.totalReports}\n`
    csv += `Total Verifications,${analytics.verificationMetrics.total}\n`
    csv += `Approved,${analytics.verificationMetrics.approved}\n`
    csv += `Rejected,${analytics.verificationMetrics.rejected}\n`
    csv += `Pending,${analytics.verificationMetrics.pending}\n\n`

    // Reports by type
    csv += 'REPORTS BY TYPE\n'
    csv += 'Type,Count\n'
    Object.entries(analytics.reportsByType).forEach(([type, count]) => {
      csv += `${type},${count}\n`
    })
    csv += '\n'

    // Reports by status
    csv += 'REPORTS BY STATUS\n'
    csv += 'Status,Count\n'
    Object.entries(analytics.reportsByStatus).forEach(([status, count]) => {
      csv += `${status},${count}\n`
    })
    csv += '\n'

    // Time series data
    if (analytics.timeSeriesData.length > 0) {
      csv += 'TIME SERIES DATA\n'
      csv += 'Date,Reports Created,Reports Resolved,Verifications Done\n'
      analytics.timeSeriesData.forEach((data) => {
        csv += `${data.date},${data.reportsCreated},${data.reportsResolved},${data.verificationsDone}\n`
      })
    }

    return csv
  } catch (error) {
    console.error('Error generating analytics CSV:', error)
    throw new Error('Failed to generate analytics CSV')
  }
}

/**
 * Generate comprehensive export with multiple data types
 */
export function generateComprehensiveCSV(
  data: {
    reports: (IReport & { _id: string })[]
    evidence: (IEvidence & { _id: string })[]
    verifications: (IVerification & { _id: string })[]
  },
  options: CSVExportOptions = {}
): string {
  try {
    let csv = ''

    // Reports section
    csv += 'REPORTS\n'
    csv += generateReportsCSV(data.reports, options)
    csv += '\n\n'

    // Evidence section
    csv += 'EVIDENCE\n'
    csv += generateEvidenceCSV(data.evidence, options)
    csv += '\n\n'

    // Verifications section
    csv += 'VERIFICATIONS\n'
    csv += generateVerificationsCSV(data.verifications, options)

    return csv
  } catch (error) {
    console.error('Error generating comprehensive CSV:', error)
    throw new Error('Failed to generate comprehensive CSV')
  }
}
