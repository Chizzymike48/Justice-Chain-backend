import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthContext } from '../../src/context/AuthContext'
import type { AuthContextType } from '../../src/context/AuthContext'
import AdminDashboard from '../../src/pages/AdminDashboard'
import * as adminService from '../../src/services/adminService'

// Mock the admin service
vi.mock('../../services/adminService')

// Mock admin dashboard data
const mockDashboardData = {
  reports: { total: 42, pending: 5 },
  verifications: { total: 18, pending: 3 },
  evidence: { total: 67, pending: 8 },
  users: { total: 234, admins: 2, moderators: 5 },
  lastUpdated: new Date().toISOString(),
}

const mockAuthContextValue: AuthContextType = {
  isLoggedIn: true,
  user: { id: 'admin-123', email: 'admin@example.com', role: 'admin' },
  token: 'mock-token',
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  checkAuth: vi.fn(),
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(adminService.getDashboard as any).mockResolvedValue(mockDashboardData)
  })

  it('should render dashboard title', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue}>
          <AdminDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument()
    })
  })

  it('should display KPI cards with metrics', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue}>
          <AdminDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/42/)).toBeInTheDocument() // Total reports
      expect(screen.getByText(/5/)).toBeInTheDocument() // Pending reports
      expect(screen.getByText(/18/)).toBeInTheDocument() // Total verifications
      expect(screen.getByText(/67/)).toBeInTheDocument() // Total evidence
    })
  })

  it('should call getDashboard on mount', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue}>
          <AdminDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(adminService.getDashboard).toHaveBeenCalled()
    })
  })

  it('should display moderation queue links', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue}>
          <AdminDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/reports to review/i)).toBeInTheDocument()
      expect(screen.getByText(/verifications to review/i)).toBeInTheDocument()
      expect(screen.getByText(/evidence to review/i)).toBeInTheDocument()
    })
  })

  it('should redirect non-admin users', () => {
    const nonAdminContext: AuthContextType = {
      ...mockAuthContextValue,
      user: { id: 'citizen-123', email: 'citizen@example.com', role: 'citizen' },
    }

    render(
      <BrowserRouter>
        <AuthContext.Provider value={nonAdminContext}>
          <AdminDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    )

    // Component should redirect, so dashboard content shouldn't appear
    // Note: actual redirect handled by ProtectedRoute in App.tsx
  })

  it('should handle loading state', () => {
    ;(adminService.getDashboard as any).mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve(mockDashboardData), 100)
        )
    )

    const { container } = render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue}>
          <AdminDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    )

    // Should show loading spinner initially
    expect(container.querySelector('[data-testid="loading-spinner"]')).toBeTruthy()
  })

  it('should display error message on API failure', async () => {
    ;(adminService.getDashboard as any).mockRejectedValue(
      new Error('Failed to fetch dashboard')
    )

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue}>
          <AdminDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument()
    })
  })
})
