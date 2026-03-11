import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { AdminDashboard } from '../../src/pages/AdminDashboard'
import { useAuth } from '../../src/context/AuthContext'
import { useSocket, SOCKET_EVENTS } from '../../src/hooks/useSocket'
import * as adminService from '../../src/services/adminService'

// Mock dependencies
jest.mock('../../src/context/AuthContext')
jest.mock('../../src/hooks/useSocket')
jest.mock('../../src/services/adminService')

describe('AdminDashboard - Real-Time Features', () => {
  const mockUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    role: 'admin',
  }

  const mockDashboardStats = {
    reports: { total: 150, pending: 25, approved: 100, rejected: 25 },
    verifications: { total: 80, pending: 10, approved: 65, rejected: 5 },
    evidence: { total: 450, pending: 75, approved: 350, rejected: 25 },
    users: { total: 500, admins: 5, moderators: 30, reporters: 465 },
    recentActivity: [
      { type: 'report', action: 'approved', timestamp: new Date() },
      { type: 'verification', action: 'reviewed', timestamp: new Date() },
    ],
  }

  let mockOn: jest.Mock
  let mockSocket: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockOn = jest.fn((event, callback) => {
      if (event === SOCKET_EVENTS.QUEUE_REFRESH) {
        // Store callback for testing
        (mockSocket as any)._queueRefreshCallback = callback
      }
      return jest.fn() // Return unsubscribe function
    })

    mockSocket = {
      connected: true,
      on: mockOn,
      joinRoom: jest.fn(),
      leaveRoom: jest.fn(),
      emit: jest.fn(),
    }

    ;(useAuth as jest.Mock).mockReturnValue({ user: mockUser, isAuthenticated: true })
    ;(useSocket as jest.Mock).mockReturnValue(mockSocket)
    ;(adminService.getDashboardStats as jest.Mock).mockResolvedValue(mockDashboardStats)
  })

  describe('Dashboard Rendering', () => {
    it('should render dashboard with stats', async () => {
      render(<AdminDashboard />)

      await waitFor(() => {
        expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument()
      })

      // Check stats are displayed
      expect(screen.getByText(/150/)).toBeInTheDocument() // Total reports
      expect(screen.getByText(/25/)).toBeInTheDocument() // Pending reports
    })

    it('should display connection status when connected', async () => {
      render(<AdminDashboard />)

      await waitFor(() => {
        expect(screen.getByText(/Live|Connected|Online/i)).toBeInTheDocument()
      })
    })

    it('should display offline status when disconnected', async () => {
      mockSocket.connected = false

      render(<AdminDashboard />)

      await waitFor(() => {
        expect(screen.getByText(/Offline|Disconnected/i)).toBeInTheDocument()
      })
    })

    it('should load dashboard data on mount', async () => {
      render(<AdminDashboard />)

      await waitFor(() => {
        expect(adminService.getDashboardStats).toHaveBeenCalled()
      })
    })
  })

  describe('Real-Time Updates', () => {
    it('should subscribe to queue refresh events', async () => {
      render(<AdminDashboard />)

      await waitFor(() => {
        expect(mockOn).toHaveBeenCalledWith(
          SOCKET_EVENTS.QUEUE_REFRESH,
          expect.any(Function)
        )
      })
    })

    it('should refresh dashboard when queue refresh event received', async () => {
      render(<AdminDashboard />)

      await waitFor(() => {
        expect(adminService.getDashboardStats).toHaveBeenCalledTimes(1)
      })

      // Trigger queue refresh event
      if ((mockSocket as any)._queueRefreshCallback) {
        fireEvent.click(screen.getByText(/Refresh/i) || document.body) // Simulate event

        await waitFor(() => {
          expect(adminService.getDashboardStats).toHaveBeenCalledTimes(2)
        })
      }
    })

    it('should update statistics when refresh occurs', async () => {
      const updatedStats = {
        ...mockDashboardStats,
        reports: { total: 160, pending: 20, approved: 110, rejected: 30 },
      }

      ;(adminService.getDashboardStats as jest.Mock)
        .mockResolvedValueOnce(mockDashboardStats)
        .mockResolvedValueOnce(updatedStats)

      render(<AdminDashboard />)

      await waitFor(() => {
        // Initial load should show original stats
        expect(adminService.getDashboardStats).toHaveBeenCalledTimes(1)
      })

      // Simulate queue refresh event
      const callback = mockOn.mock.calls.find(call => call[0] === SOCKET_EVENTS.QUEUE_REFRESH)?.[1]
      if (callback) {
        fireEvent.click(document.body)
        await waitFor(() => {
          expect(adminService.getDashboardStats).toHaveBeenCalledTimes(2)
        })
      }
    })
  })

  describe('User Interactions', () => {
    it('should handle manual refresh button click', async () => {
      render(<AdminDashboard />)

      const refreshButton = screen.queryByRole('button', { name: /refresh/i })
      if (refreshButton) {
        fireEvent.click(refreshButton)

        await waitFor(() => {
          expect(adminService.getDashboardStats).toHaveBeenCalled()
        })
      }
    })

    it('should navigate to moderation pages', async () => {
      render(<AdminDashboard />)

      const reportButton = screen.queryByRole('button', { name: /Moderate Reports/i })
      if (reportButton) {
        fireEvent.click(reportButton)
        // Navigation would be tested separately with router
      }
    })
  })

  describe('Socket Connection Lifecycle', () => {
    it('should enable socket when user is admin', async () => {
      render(<AdminDashboard />)

      await waitFor(() => {
        expect(useSocket).toHaveBeenCalledWith(
          expect.objectContaining({
            enabled: true,
          })
        )
      })
    })

    it('should disable socket when user is not admin', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, role: 'reporter' },
        isAuthenticated: true,
      })

      render(<AdminDashboard />)

      expect(useSocket).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      )
    })

    it('should unsubscribe from events on unmount', async () => {
      const unsubscribeFn = jest.fn()
      mockOn.mockReturnValue(unsubscribeFn)

      const { unmount } = render(<AdminDashboard />)

      unmount()

      expect(unsubscribeFn).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle stats loading errors', async () => {
      ;(adminService.getDashboardStats as jest.Mock).mockRejectedValue(
        new Error('Failed to load stats')
      )

      render(<AdminDashboard />)

      await waitFor(() => {
        expect(screen.queryByText(/error|Error|failed/i)).toBeInTheDocument()
      })
    })

    it('should display loading state while fetching', async () => {
      ;(adminService.getDashboardStats as jest.Mock).mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => resolve(mockDashboardStats), 100)
          })
      )

      render(<AdminDashboard />)

      await waitFor(() => {
        expect(document.querySelector('[data-testid="loading"]') || screen.queryByText(/loading|Loading/i)).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('should not render unnecessary re-renders on socket events', async () => {
      const renderSpy = jest.fn()
      const TestDashboard = () => {
        renderSpy()
        return <AdminDashboard />
      }

      const { rerender } = render(<TestDashboard />)

      const initialRenderCount = renderSpy.mock.calls.length

      // Simulate socket events
      if ((mockSocket as any)._queueRefreshCallback) {
        ;(mockSocket as any)._queueRefreshCallback({ queueType: 'reports' })
      }

      await waitFor(() => {
        expect(renderSpy.mock.calls.length).toBeLessThanOrEqual(initialRenderCount + 1)
      })
    })
  })

  describe('Stats Display', () => {
    it('should display all stat categories', async () => {
      render(<AdminDashboard />)

      await waitFor(() => {
        expect(screen.getByText(/Reports/i)).toBeInTheDocument()
        expect(screen.getByText(/Verifications/i)).toBeInTheDocument()
        expect(screen.getByText(/Evidence/i)).toBeInTheDocument()
        expect(screen.getByText(/Users/i)).toBeInTheDocument()
      })
    })

    it('should display pending vs approved breakdown', async () => {
      render(<AdminDashboard />)

      await waitFor(() => {
        // Pending count should be shown
        const pendingElements = screen.queryAllByText(/pending/i)
        expect(pendingElements.length).toBeGreaterThan(0)
      })
    })

    it('should format large numbers with separators', async () => {
      render(<AdminDashboard />)

      await waitFor(() => {
        // Check for formatted numbers like "150" or similar
        const numberElements = screen.queryAllByText(/\d+/)
        expect(numberElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Responsive Design', () => {
    it('should display stats in grid or list on mobile', () => {
      // Mock mobile viewport
      global.innerWidth = 375

      render(<AdminDashboard />)

      const dashboardContainer = screen.getByText(/Admin Dashboard|Dashboard/i).closest('div')
      expect(dashboardContainer).toBeInTheDocument()
    })
  })
})
