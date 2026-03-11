import api from './api'

export interface AdminDashboard {
  reports: { total: number; pending: number }
  verifications: { total: number; pending: number }
  evidence: { total: number }
  users: { total: number; admins: number; moderators: number }
  lastUpdated: string
}

export interface ReportForModeration {
  id: string
  title: string
  description: string
  status: string
  category: string
  office: string
  amount: number
  createdAt: string
}

export interface VerificationForReview {
  id: string
  claim: string
  source: string
  status: string
  confidence: number
  createdAt: string
}

export interface EvidenceForReview {
  id: string
  filename: string
  mimeType: string
  url: string
  size: number
  status: string
  createdAt: string
}

export interface UserRecord {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

export interface Pagination {
  page?: number
  limit?: number
  pages?: number
  total?: number
  [key: string]: unknown
}

const adminService = {
  /**
   * Get admin dashboard statistics
   */
  getDashboard: async (): Promise<AdminDashboard> => {
    const response = await api.get('/admin/dashboard')
    return response.data.data
  },

  /**
   * Get reports for moderation
   */
  getReportsForModeration: async (
    page = 1,
    limit = 20,
    status = 'pending'
  ): Promise<{ data: ReportForModeration[]; pagination: Pagination }> => {
    const response = await api.get('/admin/reports', {
      params: { page, limit, status },
    })
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    }
  },

  /**
   * Approve or reject a report
   */
  moderateReport: async (id: string, action: 'approve' | 'reject', reason?: string): Promise<unknown> => {
    const response = await api.patch(`/admin/reports/${id}`, {
      action,
      reason,
    })
    return response.data.data
  },

  /**
   * Get verifications for review
   */
  getVerificationsForReview: async (
    page = 1,
    limit = 20,
    status = 'pending'
  ): Promise<{ data: VerificationForReview[]; pagination: Pagination }> => {
    const response = await api.get('/admin/verifications', {
      params: { page, limit, status },
    })
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    }
  },

  /**
   * Review verification (verify or dispute)
   */
  reviewVerification: async (
    id: string,
    action: 'verify' | 'dispute',
    confidence?: number,
    notes?: string
  ): Promise<unknown> => {
    const response = await api.patch(`/admin/verifications/${id}`, {
      action,
      confidence,
      notes,
    })
    return response.data.data
  },

  /**
   * Get evidence for review
   */
  getEvidenceForReview: async (
    page = 1,
    limit = 20,
    status = 'pending'
  ): Promise<{ data: EvidenceForReview[]; pagination: Pagination }> => {
    const response = await api.get('/admin/evidence', {
      params: { page, limit, status },
    })
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    }
  },

  /**
   * Review evidence (approve or reject)
   */
  reviewEvidence: async (id: string, action: 'approve' | 'reject', reason?: string): Promise<unknown> => {
    const response = await api.patch(`/admin/evidence/${id}`, {
      action,
      reason,
    })
    return response.data.data
  },

  /**
   * Get users for management
   */
  getUsers: async (page = 1, limit = 20, role?: string): Promise<{ data: UserRecord[]; pagination: Pagination }> => {
    const response = await api.get('/admin/users', {
      params: { page, limit, ...(role && { role }) },
    })
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    }
  },

  /**
   * Update user role
   */
  updateUserRole: async (id: string, role: 'citizen' | 'moderator' | 'admin'): Promise<unknown> => {
    const response = await api.patch(`/admin/users/${id}/role`, { role })
    return response.data.data
  },

  /**
   * Get audit logs
   */
  getAuditLogs: async (
    page = 1,
    limit = 50,
    action?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ data: Record<string, unknown>[]; pagination: Pagination }> => {
    const response = await api.get('/admin/logs', {
      params: { page, limit, ...(action && { action }), ...(startDate && { startDate }), ...(endDate && { endDate }) },
    })
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    }
  },
}

export default adminService
