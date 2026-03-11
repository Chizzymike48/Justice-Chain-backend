import { Parser } from 'json2csv'
import type { IReport, IEvidence, IVerification } from '../models'

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

  const data = reports.map((report) => ({
    id: String(report._id),
    title: report.title || '',
    type: (report as any).type || '',
    status: report.status || '',
    description: report.description || '',
    location: (report as any).location || '',
    reporterEmail: (report as any).reporterEmail || '',
    createdAt: report.createdAt ? new Date(report.createdAt).toISOString() : '',
    updatedAt: report.updatedAt ? new Date(report.updatedAt).toISOString() : '',
    evidenceCount: (report as any).evidenceCount || 0,
    verificationStatus: (report as any).verificationStatus || 'Pending',
  }))

  try {
    const parser = new Parser({ fields, delimiter })
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

  const data = evidence.map((ev) => ({
    id: String(ev._id),
    reportId: String((ev as any).reportId || ''),
    type: (ev as any).type || '',
    status: ev.status || '',
    description: (ev as any).description || '',
    fileName: (ev as any).fileName || '',
    fileSize: (ev as any).fileSize || 0,
    uploadedBy: String((ev as any).uploadedBy || ''),
    virusStatus: (ev as any).virusStatus || 'Not Scanned',
    createdAt: ev.createdAt ? new Date(ev.createdAt).toISOString() : '',
    updatedAt: ev.updatedAt ? new Date(ev.updatedAt).toISOString() : '',
  }))

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

  const data = verifications.map((verification) => ({
    id: String(verification._id),
    reportId: String((verification as any).reportId || ''),
    status: verification.status || '',
    verifiedBy: String((verification as any).verifiedBy || ''),
    verifierRole: (verification as any).verifierRole || '',
    notes: (verification as any).notes || '',
    evidence: (verification as any).evidence || '',
    riskLevel: (verification as any).riskLevel || 'Unknown',
    createdAt: verification.createdAt ? new Date(verification.createdAt).toISOString() : '',
    updatedAt: verification.updatedAt ? new Date(verification.updatedAt).toISOString() : '',
  }))

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
  options: CSVExportOptions = {}
): string {
  const { delimiter = ',' } = options

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
  const { delimiter = ',' } = options

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
