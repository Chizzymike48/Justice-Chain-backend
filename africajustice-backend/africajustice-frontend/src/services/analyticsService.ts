import api from './api'

export interface DistrictPerformanceRecord {
  district: string
  completionRate: number
  anomalyScore: number
}

export interface DashboardMetrics {
  openReports: number
  projectsTracked: number
  verifiedClaims: number
  avgConfidence: number
  alerts: string[]
}

export interface AiEvidenceResult {
  signal: string
  score: number
  interpretation: string
}

export const analyticsService = {
  getAnalytics: async (): Promise<{ districtPerformance: DistrictPerformanceRecord[] }> => {
    const response = await api.get<{ success: boolean; data: { districtPerformance: DistrictPerformanceRecord[] } }>(
      '/analytics',
    )
    return response.data.data
  },
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    const response = await api.get<{ success: boolean; data: DashboardMetrics }>('/analytics/dashboard')
    return response.data.data
  },
  getAiEvidence: async (): Promise<{ results: AiEvidenceResult[] }> => {
    const response = await api.get<{ success: boolean; data: { results: AiEvidenceResult[] } }>('/analytics/ai-evidence')
    return response.data.data
  },
}

export default analyticsService
