import { useCallback, useEffect, useState } from 'react'
import reportService, { ReportRecord } from '../../services/reportService'

interface UseReportsResult {
  reports: ReportRecord[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const isReportRecord = (value: unknown): value is ReportRecord => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<ReportRecord>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.category === 'string' &&
    typeof candidate.description === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.status === 'string'
  )
}

export const useReports = (): UseReportsResult => {
  const [reports, setReports] = useState<ReportRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await reportService.getReports()
      const normalized = Array.isArray(response) ? response.filter(isReportRecord) : []
      setReports(normalized)
    } catch {
      setError('Failed to load reports.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { reports, isLoading, error, refresh }
}
