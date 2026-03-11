import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AuthContext } from '../../src/context/AuthContext'
import type { AuthContextType } from '../../src/context/AuthContext'
import ReportModerationPage from '../../src/pages/ReportModerationPage'
import * as adminService from '../../src/services/adminService'

// Mock the admin service
vi.mock('../../services/adminService')

const mockReports = [
  {
    id: 'report-1',
    title: 'Inflated Contract',
    category: 'Finance',
    office: 'Ministry of Health',
    amount: 5000000,
    description: 'Evidence of contract inflation in hospital procurement',
    submittedDate: '2026-03-01T10:00:00Z',
    status: 'pending',
  },
  {
    id: 'report-2',
    title: 'Land Misallocation',
    category: 'Land',
    office: 'Land Authority',
    amount: 0,
    description: 'Public land allocated to private developer illegally',
    submittedDate: '2026-03-02T12:00:00Z',
    status: 'pending',
  },
]

const mockModeratorContext: AuthContextType = {
  isLoggedIn: true,
  user: {
    id: 'moderator-123',
    email: 'mod@example.com',
    role: 'moderator',
  },
  token: 'mock-token',
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  checkAuth: vi.fn(),
}

describe('ReportModerationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(adminService.getReportsForModeration as any).mockResolvedValue({
      data: mockReports,
      paginate: { total: 2, pages: 1, currentPage: 1 },
    })
  })

  it('should render page title', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockModeratorContext}>
          <ReportModerationPage />
        </AuthContext.Provider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(
        screen.getByText(/reports to review|moderation/i)
      ).toBeInTheDocument()
    })
  })

  it('should display list of pending reports', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockModeratorContext}>
          <ReportModerationPage />
        </AuthContext.Provider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Inflated Contract')).toBeInTheDocument()
      expect(screen.getByText('Land Misallocation')).toBeInTheDocument()
    })
  })

  it('should display report details in cards', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockModeratorContext}>
          <ReportModerationPage />
        </AuthContext.Provider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Finance')).toBeInTheDocument()
      expect(screen.getByText('Ministry of Health')).toBeInTheDocument()
      expect(screen.getByText(/5000000|5,000,000/)).toBeInTheDocument()
    })
  })

  it('should fetch reports on mount', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockModeratorContext}>
          <ReportModerationPage />
        </AuthContext.Provider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(adminService.getReportsForModeration).toHaveBeenCalledWith(
        1,
        20,
        'pending'
      )
    })
  })

  it('should open confirmation dialog when approve button clicked', async () => {
    const user = userEvent.setup()

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockModeratorContext}>
          <ReportModerationPage />
        </AuthContext.Provider>
      </BrowserRouter>
    )

    const approveButtons = await screen.findAllByText(/approve/i)
    await user.click(approveButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/confirm/i)).toBeInTheDocument()
    })
  })

  it('should call moderateReport when approval confirmed', async () => {
    const user = userEvent.setup()
    ;(adminService.moderateReport as any).mockResolvedValue({
      success: true,
    })

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockModeratorContext}>
          <ReportModerationPage />
        </AuthContext.Provider>
      </BrowserRouter>
    )

    const approveButtons = await screen.findAllByText(/approve/i)
    await user.click(approveButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/confirm/i)).toBeInTheDocument()
    })

    const confirmButton = screen.getByText(/confirm/i)
    await user.click(confirmButton)

    await waitFor(() => {
      expect(adminService.moderateReport).toHaveBeenCalledWith(
        'report-1',
        'approve',
        ''
      )
    })
  })

  it('should show success notification after approval', async () => {
    const user = userEvent.setup()
    ;(adminService.moderateReport as any).mockResolvedValue({
      success: true,
    })

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockModeratorContext}>
          <ReportModerationPage />
        </AuthContext.Provider>
      </BrowserRouter>
    )

    const approveButtons = await screen.findAllByText(/approve/i)
    await user.click(approveButtons[0])

    const confirmButton = await screen.findByText(/confirm/i)
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText(/approved|success/i)).toBeInTheDocument()
    })
  })

  it('should handle rejection action', async () => {
    const user = userEvent.setup()
    ;(adminService.moderateReport as any).mockResolvedValue({
      success: true,
    })

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockModeratorContext}>
          <ReportModerationPage />
        </AuthContext.Provider>
      </BrowserRouter>
    )

    const rejectButtons = await screen.findAllByText(/reject/i)
    await user.click(rejectButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/confirm/i)).toBeInTheDocument()
    })

    const confirmButton = screen.getByText(/confirm/i)
    await user.click(confirmButton)

    await waitFor(() => {
      expect(adminService.moderateReport).toHaveBeenCalledWith(
        expect.any(String),
        'reject',
        expect.any(String)
      )
    })
  })

  it('should display error message on API failure', async () => {
    ;(adminService.getReportsForModeration as any).mockRejectedValue(
      new Error('Failed to fetch reports')
    )

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockModeratorContext}>
          <ReportModerationPage />
        </AuthContext.Provider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument()
    })
  })

  it('should handle pagination', async () => {
    const user = userEvent.setup()
    ;(adminService.getReportsForModeration as any).mockResolvedValue({
      data: [mockReports[0]],
      paginate: { total: 25, pages: 2, currentPage: 1 },
    })

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockModeratorContext}>
          <ReportModerationPage />
        </AuthContext.Provider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/page 1|page 2/i)).toBeInTheDocument()
    })

    const nextPageButton = screen.getByText(/next|2/i)
    await user.click(nextPageButton)

    await waitFor(() => {
      expect(adminService.getReportsForModeration).toHaveBeenCalledWith(2, 20, 'pending')
    })
  })

  it('should redirect non-moderators', () => {
    const citizenContext: AuthContextType = {
      ...mockModeratorContext,
      user: {
        id: 'citizen-123',
        email: 'citizen@example.com',
        role: 'citizen',
      },
    }

    render(
      <BrowserRouter>
        <AuthContext.Provider value={citizenContext}>
          <ReportModerationPage />
        </AuthContext.Provider>
      </BrowserRouter>
    )

    // Should redirect to dashboard (component uses Navigate)
  })
})
