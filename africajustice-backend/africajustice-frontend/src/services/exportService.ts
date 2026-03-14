import api from './api'
import { captureException, trackApiCall } from '@/utils/sentry'

export interface ExportOptions {
  startDate?: Date
  endDate?: Date
  reportIds?: string[]
  filters?: Record<string, unknown>
}

interface ExportErrorLike {
  status?: number
  response?: {
    status?: number
  }
}

const getErrorStatus = (error: unknown): number => {
  if (typeof error === 'object' && error) {
    const typedError = error as ExportErrorLike
    if (typeof typedError.status === 'number') {
      return typedError.status
    }
    if (typeof typedError.response?.status === 'number') {
      return typedError.response.status
    }
  }
  return 500
}

/**
 * Export a single report as PDF
 */
export async function exportReportAsPDF(reportId: string): Promise<void> {
  const startTime = Date.now()
  try {
    const response = await api.get(`/export/report/${reportId}/pdf`, {
      responseType: 'blob',
    })

    const duration = Date.now() - startTime
    trackApiCall('GET', `/export/report/${reportId}/pdf`, 200, duration)

    // Create blob URL and trigger download
    const url = window.URL.createObjectURL(response.data as Blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `report-${reportId}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    const duration = Date.now() - startTime
    trackApiCall('GET', `/export/report/${reportId}/pdf`, getErrorStatus(error), duration)
    captureException(error as Error, { context: 'exportReportAsPDF', reportId })
    throw error
  }
}

/**
 * Export multiple reports as PDF
 */
export async function exportReportsAsPDF(options: ExportOptions): Promise<void> {
  const startTime = Date.now()
  try {
    const response = await api.post(`/export/reports/pdf`, {
      reportIds: options.reportIds || [],
      filters: options.filters || {},
    }, {
      responseType: 'blob',
    })

    const duration = Date.now() - startTime
    trackApiCall('POST', '/export/reports/pdf', 200, duration)

    const url = window.URL.createObjectURL(response.data as Blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `reports-${Date.now()}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    const duration = Date.now() - startTime
    trackApiCall('POST', '/export/reports/pdf', getErrorStatus(error), duration)
    captureException(error as Error, { context: 'exportReportsAsPDF' })
    throw error
  }
}

/**
 * Export reports as CSV
 */
export async function exportReportsAsCSV(options: ExportOptions): Promise<void> {
  const startTime = Date.now()
  try {
    const response = await api.post(`/export/reports/csv`, {
      reportIds: options.reportIds || [],
      filters: options.filters || {},
      startDate: options.startDate,
      endDate: options.endDate,
    }, {
      responseType: 'blob',
    })

    const duration = Date.now() - startTime
    trackApiCall('POST', '/export/reports/csv', 200, duration)

    const url = window.URL.createObjectURL(response.data as Blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `reports-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    const duration = Date.now() - startTime
    trackApiCall('POST', '/export/reports/csv', getErrorStatus(error), duration)
    captureException(error as Error, { context: 'exportReportsAsCSV' })
    throw error
  }
}

/**
 * Export evidence as CSV
 */
export async function exportEvidenceAsCSV(reportId?: string, options?: ExportOptions): Promise<void> {
  const startTime = Date.now()
  try {
    const response = await api.post(`/export/evidence/csv`, {
      reportId,
      startDate: options?.startDate,
      endDate: options?.endDate,
    }, {
      responseType: 'blob',
    })

    const duration = Date.now() - startTime
    trackApiCall('POST', '/export/evidence/csv', 200, duration)

    const url = window.URL.createObjectURL(response.data as Blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `evidence-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    const duration = Date.now() - startTime
    trackApiCall('POST', '/export/evidence/csv', getErrorStatus(error), duration)
    captureException(error as Error, { context: 'exportEvidenceAsCSV' })
    throw error
  }
}

/**
 * Export verifications as CSV
 */
export async function exportVerificationsAsCSV(
  reportId?: string,
  options?: ExportOptions
): Promise<void> {
  const startTime = Date.now()
  try {
    const response = await api.post(`/export/verifications/csv`, {
      reportId,
      startDate: options?.startDate,
      endDate: options?.endDate,
    }, {
      responseType: 'blob',
    })

    const duration = Date.now() - startTime
    trackApiCall('POST', '/export/verifications/csv', 200, duration)

    const url = window.URL.createObjectURL(response.data as Blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `verifications-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    const duration = Date.now() - startTime
    trackApiCall('POST', '/export/verifications/csv', getErrorStatus(error), duration)
    captureException(error as Error, { context: 'exportVerificationsAsCSV' })
    throw error
  }
}

/**
 * Export comprehensive data as CSV
 */
export async function exportComprehensiveDataAsCSV(options: ExportOptions): Promise<void> {
  const startTime = Date.now()
  try {
    const response = await api.post(`/export/comprehensive/csv`, {
      reportIds: options.reportIds || [],
      startDate: options.startDate,
      endDate: options.endDate,
    }, {
      responseType: 'blob',
    })

    const duration = Date.now() - startTime
    trackApiCall('POST', '/export/comprehensive/csv', 200, duration)

    const url = window.URL.createObjectURL(response.data as Blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `comprehensive-export-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    const duration = Date.now() - startTime
    trackApiCall('POST', '/export/comprehensive/csv', getErrorStatus(error), duration)
    captureException(error as Error, { context: 'exportComprehensiveDataAsCSV' })
    throw error
  }
}

/**
 * Export analytics as PDF
 */
export async function exportAnalyticsAsPDF(options?: ExportOptions): Promise<void> {
  const startTime = Date.now()
  try {
    const params = new URLSearchParams()
    if (options?.startDate) params.append('startDate', options.startDate.toISOString())
    if (options?.endDate) params.append('endDate', options.endDate.toISOString())

    const response = await api.get(`/export/analytics/pdf?${params.toString()}`, {
      responseType: 'blob',
    })

    const duration = Date.now() - startTime
    trackApiCall('GET', '/export/analytics/pdf', 200, duration)

    const url = window.URL.createObjectURL(response.data as Blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `analytics-${Date.now()}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    const duration = Date.now() - startTime
    trackApiCall('GET', '/export/analytics/pdf', getErrorStatus(error), duration)
    captureException(error as Error, { context: 'exportAnalyticsAsPDF' })
    throw error
  }
}

/**
 * Export analytics as CSV
 */
export async function exportAnalyticsAsCSV(options?: ExportOptions): Promise<void> {
  const startTime = Date.now()
  try {
    const params = new URLSearchParams()
    if (options?.startDate) params.append('startDate', options.startDate.toISOString())
    if (options?.endDate) params.append('endDate', options.endDate.toISOString())

    const response = await api.get(`/export/analytics/csv?${params.toString()}`, {
      responseType: 'blob',
    })

    const duration = Date.now() - startTime
    trackApiCall('GET', '/export/analytics/csv', 200, duration)

    const url = window.URL.createObjectURL(response.data as Blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `analytics-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    const duration = Date.now() - startTime
    trackApiCall('GET', '/export/analytics/csv', getErrorStatus(error), duration)
    captureException(error as Error, { context: 'exportAnalyticsAsCSV' })
    throw error
  }
}
