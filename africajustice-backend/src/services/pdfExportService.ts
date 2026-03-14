import PDFDocument from 'pdfkit'
import type { Readable } from 'stream'
import type { IReport, IEvidence, IVerification } from '../models'

type ReportExtras = {
  type?: string
  location?: string
}

type EvidenceExtras = {
  type?: string
  description?: string
}

type VerificationExtras = {
  notes?: string
}

interface ExportOptions {
  title?: string
  includeLogo?: boolean
  includeMetadata?: boolean
  pageSize?: 'A4' | 'Letter'
  orientation?: 'portrait' | 'landscape'
}

interface ReportExportData {
  report: IReport & { _id: string }
  evidence: (IEvidence & { _id: string })[]
  verifications: (IVerification & { _id: string })[]
}

/**
 * Generate PDF report with evidence and verification details
 */
export async function generateReportPDF(
  data: ReportExportData,
  options: ExportOptions = {}
): Promise<Readable> {
  return new Promise((resolve, reject) => {
    try {
      const {
        title = 'JusticeChain Report',
        includeLogo: _includeLogo = true,
        includeMetadata = true,
        pageSize = 'A4',
        orientation = 'portrait',
      } = options

      const doc = new PDFDocument({
        size: pageSize,
        layout: orientation,
        margin: 50,
        bufferPages: true,
      })

      // Header
      if (includeMetadata) {
        doc.fontSize(24).font('Helvetica-Bold').text(title, { align: 'center' })
        doc.moveDown(0.5)
        doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}`, {
          align: 'center',
        })
        doc.moveDown(2)
      }

      // Report Information
      doc.fontSize(14).fillColor('#000').font('Helvetica-Bold').text('Report Details')
      doc.fontSize(10).font('Helvetica')

      doc.text(`ID: ${data.report._id}`)
      doc.text(`Title: ${data.report.title || 'N/A'}`)
      const reportData = data.report as IReport & ReportExtras
      doc.text(`Type: ${reportData.type || 'N/A'}`)
      doc.text(`Status: ${data.report.status || 'N/A'}`)
      doc.text(`Date Filed: ${data.report.createdAt ? new Date(data.report.createdAt).toLocaleDateString() : 'N/A'}`)
      doc.text(`Description: ${data.report.description || 'N/A'}`)

      if (reportData.location) {
        doc.text(`Location: ${reportData.location}`)
      }

      doc.moveDown(2)

      // Evidence Section
      if (data.evidence && data.evidence.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Evidence')
        doc.fontSize(10).font('Helvetica')

        data.evidence.forEach((evidence, index) => {
          const evidenceData = evidence as IEvidence & EvidenceExtras
          doc.text(`\n[Evidence ${index + 1}]`)
          doc.text(`Type: ${evidenceData.type || 'N/A'}`)
          doc.text(`Uploaded: ${evidence.createdAt ? new Date(evidence.createdAt).toLocaleDateString() : 'N/A'}`)
          doc.text(`Status: ${evidence.status || 'Pending Review'}`)

          if (evidenceData.description) {
            doc.text(`Description: ${evidenceData.description}`)
          }
        })

        doc.moveDown(2)
      }

      // Verification Section
      if (data.verifications && data.verifications.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Verification Records')
        doc.fontSize(10).font('Helvetica')

        data.verifications.forEach((verification, index) => {
          const verificationData = verification as IVerification & VerificationExtras
          doc.text(`\n[Verification ${index + 1}]`)
          doc.text(`Status: ${verification.status || 'N/A'}`)
          doc.text(`Verified Date: ${verification.createdAt ? new Date(verification.createdAt).toLocaleDateString() : 'N/A'}`)

          if (verificationData.notes) {
            doc.text(`Notes: ${verificationData.notes}`)
          }
        })

        doc.moveDown(2)
      }

      // Footer with page numbers
      const pageCount = doc.bufferedPageRange().count
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i)
        doc.fontSize(8).fillColor('#999').text(`Page ${i + 1} of ${pageCount}`, 50, 750, {
          align: 'center',
        })
      }

      doc.end()
      resolve(doc as unknown as Readable)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Generate bulk PDF export for multiple reports
 */
export async function generateBulkReportsPDF(
  reports: ReportExportData[],
  options: ExportOptions = {}
): Promise<Readable> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: options.pageSize || 'A4',
        margin: 50,
        bufferPages: true,
      })

      doc.fontSize(24).font('Helvetica-Bold').text('JusticeChain Bulk Report Export', {
        align: 'center',
      })
      doc.moveDown(0.5)
      doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}`, {
        align: 'center',
      })
      doc.fontSize(10).fillColor('#666').text(`Total Reports: ${reports.length}`, {
        align: 'center',
      })
      doc.moveDown(2)

      // Table header
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000')
      doc.text('Report ID', 50, doc.y, { width: 100 })
      doc.text('Title', 150, doc.y - 12, { width: 150 })
      doc.text('Type', 300, doc.y, { width: 80 })
      doc.text('Status', 380, doc.y, { width: 80 })
      doc.moveDown(1)

      // Table rows
      doc.fontSize(9).font('Helvetica').fillColor('#333')
      reports.forEach((data) => {
        doc.text(String(data.report._id).substring(0, 15), 50, doc.y, { width: 100 })
        doc.text(data.report.title || 'N/A', 150, doc.y - 12, { width: 150 })
        const reportData = data.report as IReport & ReportExtras
        doc.text(reportData.type || 'N/A', 300, doc.y, { width: 80 })
        doc.text(data.report.status || 'N/A', 380, doc.y, { width: 80 })
        doc.moveDown(1.2)
      })

      doc.end()
      resolve(doc as unknown as Readable)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Generate analytics report PDF
 */
export async function generateAnalyticsPDF(
  analytics: {
    totalReports: number
    totalVerifications: number
    totalEvidence: number
    reportsByType: { [key: string]: number }
    reportsByStatus: { [key: string]: number }
    averageResolutionTime: number
    topReporters: Array<{ id: string; count: number }>
  },
  options: ExportOptions = {}
): Promise<Readable> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: options.pageSize || 'A4',
        margin: 50,
        bufferPages: true,
      })

      doc.fontSize(24).font('Helvetica-Bold').text('JusticeChain Analytics Report', {
        align: 'center',
      })
      doc.moveDown(0.5)
      doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}`, {
        align: 'center',
      })
      doc.moveDown(2)

      // Summary Section
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#000').text('Summary Statistics')
      doc.fontSize(11).font('Helvetica')
      doc.moveDown(0.5)

      doc.text(`Total Reports: ${analytics.totalReports}`)
      doc.text(`Total Verifications: ${analytics.totalVerifications}`)
      doc.text(`Total Evidence Items: ${analytics.totalEvidence}`)
      doc.text(`Average Resolution Time: ${analytics.averageResolutionTime} days`)

      doc.moveDown(2)

      // Reports by Type
      if (Object.keys(analytics.reportsByType).length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Reports by Type')
        doc.fontSize(10).font('Helvetica')

        Object.entries(analytics.reportsByType).forEach(([type, count]) => {
          doc.text(`  • ${type}: ${count}`)
        })

        doc.moveDown(2)
      }

      // Reports by Status
      if (Object.keys(analytics.reportsByStatus).length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Reports by Status')
        doc.fontSize(10).font('Helvetica')

        Object.entries(analytics.reportsByStatus).forEach(([status, count]) => {
          doc.text(`  • ${status}: ${count}`)
        })

        doc.moveDown(2)
      }

      // Top Reporters
      if (analytics.topReporters.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Top Reporters')
        doc.fontSize(10).font('Helvetica')

        analytics.topReporters.slice(0, 10).forEach((reporter, index) => {
          doc.text(`  ${index + 1}. User ${reporter.id}: ${reporter.count} reports`)
        })
      }

      doc.end()
      resolve(doc as unknown as Readable)
    } catch (error) {
      reject(error)
    }
  })
}
