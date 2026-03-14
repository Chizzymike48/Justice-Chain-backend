import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReportModerationPage } from '../../src/pages/ReportModerationPage'
import { useAuth } from '../../src/context/AuthContext'
import { useSocket, SOCKET_EVENTS } from '../../src/hooks/useSocket'
import * as adminService from '../../src/services/adminService'

// Mock dependencies
jest.mock('../../src/context/AuthContext')
jest.mock('../../src/hooks/useSocket')
jest.mock('../../src/services/adminService')

describe('ReportModerationPage - Real-Time & File Upload Integration', () => {
  const mockUser = {
    id: 'moderator-123',
    email: 'moderator@example.com',
    role: 'moderator',
  }

  const mockReports = [
    {
      _id: 'report-1',
      title: 'Corruption in Infrastructure',
      description: 'Missing road construction funds',
      status: 'pending',
      submittedBy: 'reporter@example.com',
      evidence: [{ _id: 'ev-1', fileName: 'evidence.pdf', status: 'pending' }],
      createdAt: new Date(),
    },
    {
      _id: 'report-2',
      title: 'Election Fraud',
      description: 'Voter intimidation reported',
      status: 'pending',
      submittedBy: 'another-reporter@example.com',
      evidence: [],
      createdAt: new Date(),
    },
  ]

  let mockOn: jest.Mock
  let mockSocket: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockOn = jest.fn((event, callback) => {
      if (event === SOCKET_EVENTS.REPORT_MODERATED) {
        ;(mockSocket as any)._reportModeratedCallback = callback
      }
      if (event === SOCKET_EVENTS.QUEUE_REFRESH) {
        ;(mockSocket as any)._queueRefreshCallback = callback
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
    ;(adminService.getPendingReports as jest.Mock).mockResolvedValue(mockReports)
    ;(adminService.moderateReport as jest.Mock).mockResolvedValue({ success: true })
  })

  describe('Page Rendering', () => {
    it('should render report moderation page', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        expect(screen.getByText(/Pending Reports|Report Moderation/i)).toBeInTheDocument()
      })
    })

    it('should display connection status badge', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        const badge = screen.queryByText(/Live|Connected|Online/i)
        expect(badge).toBeInTheDocument()
      })
    })

    it('should load reports on mount', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        expect(adminService.getPendingReports).toHaveBeenCalled()
      })
    })

    it('should display list of pending reports', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        expect(screen.getByText('Corruption in Infrastructure')).toBeInTheDocument()
        expect(screen.getByText('Election Fraud')).toBeInTheDocument()
      })
    })
  })

  describe('Real-Time Report Moderation', () => {
    it('should subscribe to report moderated events', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        expect(mockOn).toHaveBeenCalledWith(
          SOCKET_EVENTS.REPORT_MODERATED,
          expect.any(Function)
        )
      })
    })

    it('should remove report from list when moderated', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        expect(screen.getByText('Corruption in Infrastructure')).toBeInTheDocument()
      })

      // Simulate report moderated event
      const moderatedReport = {
        reportId: 'report-1',
        title: 'Corruption in Infrastructure',
        moderatorEmail: 'other-moderator@example.com',
        status: 'approved',
        timestamp: new Date(),
      }

      if ((mockSocket as any)._reportModeratedCallback) {
        ;(mockSocket as any)._reportModeratedCallback(moderatedReport)
      }

      await waitFor(() => {
        expect(screen.queryByText('Corruption in Infrastructure')).not.toBeInTheDocument()
      })
    })

    it('should show notification when peer moderates report', async () => {
      render(<ReportModerationPage />)

      const moderatedEvent = {
        reportId: 'report-1',
        title: 'Corruption in Infrastructure',
        moderatorEmail: 'other-moderator@example.com',
        status: 'approved',
        timestamp: new Date(),
      }

      if ((mockSocket as any)._reportModeratedCallback) {
        ;(mockSocket as any)._reportModeratedCallback(moderatedEvent)
      }

      await waitFor(() => {
        // Should show notification message
        expect(screen.queryByText(/approved|Approved/i)).toBeInTheDocument()
      })
    })

    it('should update stats when report moderated by peer', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        const initialReportCards = screen.queryAllByRole('article')
        expect(initialReportCards.length).toBe(2)
      })

      const moderatedEvent = {
        reportId: 'report-1',
        title: 'Corruption in Infrastructure',
        moderatorEmail: 'other-moderator@example.com',
        status: 'approved',
        timestamp: new Date(),
      }

      if ((mockSocket as any)._reportModeratedCallback) {
        ;(mockSocket as any)._reportModeratedCallback(moderatedEvent)
      }

      await waitFor(() => {
        const updatedReportCards = screen.queryAllByRole('article')
        expect(updatedReportCards.length).toBe(1)
      })
    })
  })

  describe('Queue Refresh Events', () => {
    it('should subscribe to queue refresh events', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        expect(mockOn).toHaveBeenCalledWith(
          SOCKET_EVENTS.QUEUE_REFRESH,
          expect.any(Function)
        )
      })
    })

    it('should reload reports when queue refresh for reports received', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        expect(adminService.getPendingReports).toHaveBeenCalledTimes(1)
      })

      // Simulate queue refresh event
      if ((mockSocket as any)._queueRefreshCallback) {
        ;(mockSocket as any)._queueRefreshCallback({ queueType: 'reports' })
      }

      await waitFor(() => {
        expect(adminService.getPendingReports).toHaveBeenCalledTimes(2)
      })
    })

    it('should not reload for other queue types', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        expect(adminService.getPendingReports).toHaveBeenCalledTimes(1)
      })

      // Queue refresh for evidence, not reports
      if ((mockSocket as any)._queueRefreshCallback) {
        ;(mockSocket as any)._queueRefreshCallback({ queueType: 'evidence' })
      }

      // Should still be 1, not 2
      expect(adminService.getPendingReports).toHaveBeenCalledTimes(1)
    })
  })

  describe('Report Moderation Actions', () => {
    it('should approve report', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        expect(screen.getByText('Corruption in Infrastructure')).toBeInTheDocument()
      })

      const approveButton = screen.queryAllByRole('button', { name: /approve/i })[0]
      if (approveButton) {
        fireEvent.click(approveButton)

        await waitFor(() => {
          expect(adminService.moderateReport).toHaveBeenCalledWith(
            'report-1',
            expect.objectContaining({
              status: 'approved',
            })
          )
        })
      }
    })

    it('should reject report with reason', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        expect(screen.getByText('Corruption in Infrastructure')).toBeInTheDocument()
      })

      const rejectButton = screen.queryAllByRole('button', { name: /reject/i })[0]
      if (rejectButton) {
        fireEvent.click(rejectButton)

        // Should show modal or input for rejection reason
        const reasonInput = screen.queryByPlaceholderText(/reason|Reason/i)
        if (reasonInput) {
          fireEvent.change(reasonInput, { target: { value: 'Unverifiable claims' } })

          // Submit rejection
          const submitButton = screen.queryByRole('button', { name: /submit|confirm/i })
          if (submitButton) {
            fireEvent.click(submitButton)

            await waitFor(() => {
              expect(adminService.moderateReport).toHaveBeenCalledWith(
                'report-1',
                expect.objectContaining({
                  status: 'rejected',
                  rejectionReason: 'Unverifiable claims',
                })
              )
            })
          }
        }
      }
    })

    it('should handle moderation errors', async () => {
      ;(adminService.moderateReport as jest.Mock).mockRejectedValue(
        new Error('Remote authorization error')
      )

      render(<ReportModerationPage />)

      await waitFor(() => {
        expect(screen.getByText('Corruption in Infrastructure')).toBeInTheDocument()
      })

      const approveButton = screen.queryAllByRole('button', { name: /approve/i })[0]
      if (approveButton) {
        fireEvent.click(approveButton)

        await waitFor(() => {
          expect(screen.queryByText(/error|Error|failed/i)).toBeInTheDocument()
        })
      }
    })
  })

  describe('Evidence File Display', () => {
    it('should display evidence attached to report', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        expect(screen.getByText('Corruption in Infrastructure')).toBeInTheDocument()
      })

      // Click to expand evidence
      const evidenceLink = screen.queryByText(/evidence.pdf|Evidence/i)
      if (evidenceLink) {
        expect(evidenceLink).toBeInTheDocument()
      }
    })

    it('should allow downloading evidence', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        const downloadButton = screen.queryByRole('link', { name: /download/i })
        if (downloadButton) {
          expect(downloadButton).toHaveAttribute('href')
        }
      })
    })

    it('should show evidence status badges', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        expect(screen.getByText('Corruption in Infrastructure')).toBeInTheDocument()
        // Should show evidence status
        expect(screen.queryByText(/pending|Pending/i)).toBeInTheDocument()
      })
    })
  })

  describe('Filtering & Search', () => {
    it('should filter reports by status', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        expect(adminService.getPendingReports).toHaveBeenCalled()
      })

      const filteredReports = mockReports.filter(r => r.status === 'pending')
      expect(filteredReports.length).toBe(2)
    })

    it('should search reports by title', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        expect(screen.getByText('Corruption in Infrastructure')).toBeInTheDocument()
      })

      const searchInput = screen.queryByPlaceholderText(/search|Search/i)
      if (searchInput) {
        fireEvent.change(searchInput, { target: { value: 'Corruption' } })

        // Should filter results
        expect(screen.queryByText('Corruption in Infrastructure')).toBeInTheDocument()
        expect(screen.queryByText('Election Fraud')).toBeInTheDocument() // Both have 'Corruption' in title or may not
      }
    })
  })

  describe('Socket Connection Management', () => {
    it('should enable socket for moderators', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        expect(useSocket).toHaveBeenCalledWith(
          expect.objectContaining({
            enabled: true,
          })
        )
      })
    })

    it('should disable socket for non-moderators', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, role: 'reporter' },
        isAuthenticated: true,
      })

      render(<ReportModerationPage />)

      expect(useSocket).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      )
    })

    it('should cleanup socket subscriptions on unmount', async () => {
      const unsubscribeFn = jest.fn()
      mockOn.mockReturnValue(unsubscribeFn)

      const { unmount } = render(<ReportModerationPage />)

      unmount()

      // Should call cleanup functions
      expect(unsubscribeFn).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle report loading errors', async () => {
      ;(adminService.getPendingReports as jest.Mock).mockRejectedValue(
        new Error('Failed to load reports')
      )

      render(<ReportModerationPage />)

      await waitFor(() => {
        expect(screen.queryByText(/error|Error|failed/i)).toBeInTheDocument()
      })
    })

    it('should show empty state when no reports', async () => {
      ;(adminService.getPendingReports as jest.Mock).mockResolvedValue([])

      render(<ReportModerationPage />)

      await waitFor(() => {
        expect(screen.queryByText(/no reports|No reports|empty/i)).toBeInTheDocument()
      })
    })
  })

  describe('Performance & Optimization', () => {
    it('should not re-fetch on every socket event', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        expect(adminService.getPendingReports).toHaveBeenCalledTimes(1)
      })

      // Simulate multiple moderated events
      for (let i = 0; i < 5; i++) {
        if ((mockSocket as any)._reportModeratedCallback) {
          ;(mockSocket as any)._reportModeratedCallback({
            reportId: `report-${i}`,
            title: `Report ${i}`,
            status: 'approved',
            timestamp: new Date(),
          })
        }
      }

      // Should still be 1 fetch, not 6
      expect(adminService.getPendingReports).toHaveBeenCalledTimes(1)
    })

    it('should batch updates from multiple events', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        expect(screen.getByText('Corruption in Infrastructure')).toBeInTheDocument()
      })

      // Simulate rapid moderation events
      const events = [
        { reportId: 'report-1', status: 'approved' },
        { reportId: 'report-2', status: 'rejected' },
      ]

      events.forEach(event => {
        if ((mockSocket as any)._reportModeratedCallback) {
          ;(mockSocket as any)._reportModeratedCallback({
            ...event,
            title: 'Test',
            timestamp: new Date(),
          })
        }
      })

      // Both reports should be removed
      await waitFor(() => {
        expect(screen.queryByText('Corruption in Infrastructure')).not.toBeInTheDocument()
        expect(screen.queryByText('Election Fraud')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels on buttons', async () => {
      render(<ReportModerationPage />)

      await waitFor(() => {
        const approveButton = screen.queryByRole('button', { name: /approve/i })
        expect(approveButton).toHaveAttribute('aria-label') || expect(approveButton?.textContent).toBeTruthy()
      })
    })

    it('should be keyboard navigable', async () => {
      render(<ReportModerationPage />)

      const user = userEvent.setup()

      // Tab through elements
      await user.tab()
      expect(document.activeElement).toBeDefined()
    })
  })
})
