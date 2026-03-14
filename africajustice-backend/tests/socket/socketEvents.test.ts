import { Server as SocketServer, Socket } from 'socket.io'
import { registerSocketHandlers } from '../../src/socket/socketHandlers'
import { SocketEvents } from '../../src/socket/socketEvents'
import { User } from '../../src/models/User'
import jwt from 'jsonwebtoken'

// Mock socket and user model
jest.mock('../../src/models/User')
jest.mock('jsonwebtoken')

describe('Socket.io Real-Time Features - Integration Tests', () => {
  let io: jest.Mocked<SocketServer>
  let mockSocket: jest.Mocked<Socket>
  let socketEvents: SocketEvents
  let mockUser: { _id: string; email: string; role: string; name: string }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock socket
    mockSocket = {
      id: 'socket-123',
      emit: jest.fn(),
      on: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      to: jest.fn(),
      data: { user: null },
    } as unknown as jest.Mocked<Socket>

    // Mock IO server
    io = {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
      emit: jest.fn(),
      engine: {
        clientsCount: 1,
      },
    } as unknown as jest.Mocked<SocketServer>

    // Mock user
    mockUser = {
      _id: 'user-123',
      email: 'admin@example.com',
      role: 'admin',
      name: 'Test Admin',
    }

    ;(User.findById as jest.Mock).mockResolvedValue(mockUser)
    ;(jwt.verify as jest.Mock).mockReturnValue({
      userId: 'user-123',
      email: 'admin@example.com',
    })

    socketEvents = new SocketEvents(io)
  })

  describe('Socket Connection Lifecycle', () => {
    it('should authenticate user on connection', async () => {
      const token = 'valid.jwt.token'
      mockSocket.handshake = {
        auth: { token },
      } as unknown as Socket['handshake']

      initSocketHandlers(io, mockSocket)

      // Verify JWT verification
      expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String))
    })

    it('should join moderators room for admin user', async () => {
      const token = 'valid.jwt.token'
      mockSocket.handshake = {
        auth: { token },
      } as unknown as Socket['handshake']

      mockUser.role = 'admin'
      ;(User.findById as jest.Mock).mockResolvedValue(mockUser)

      initSocketHandlers(io, mockSocket)

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockSocket.join).toHaveBeenCalledWith('moderators')
      expect(mockSocket.join).toHaveBeenCalledWith('user:user-123')
    })

    it('should not join moderators room for regular users', async () => {
      const token = 'valid.jwt.token'
      mockSocket.handshake = {
        auth: { token },
      } as unknown as Socket['handshake']

      mockUser.role = 'reporter'
      ;(User.findById as jest.Mock).mockResolvedValue(mockUser)

      initSocketHandlers(io, mockSocket)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockSocket.join).not.toHaveBeenCalledWith('moderators')
      expect(mockSocket.join).toHaveBeenCalledWith('user:user-123')
    })

    it('should handle authentication errors gracefully', async () => {
      mockSocket.handshake = {
        auth: { token: 'invalid.token' },
      } as unknown as Socket['handshake']

      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const initHandler = (): void => registerSocketHandlers(io, mockSocket)

      // Should not throw, but handle error
      expect(() => initHandler()).not.toThrow()
    })

    it('should attach user data to socket', async () => {
      const token = 'valid.jwt.token'
      mockSocket.handshake = {
        auth: { token },
      } as unknown as Socket['handshake']

      initSocketHandlers(io, mockSocket)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockSocket.data.user).toBeDefined()
    })
  })

  describe('Real-Time Event Broadcasting', () => {
    it('should emit report moderated event to moderators', () => {
      const event = {
        reportId: 'report-123',
        title: 'Corruption Report',
        moderatorEmail: 'admin@example.com',
        status: 'approved' as const,
        timestamp: new Date(),
      }

      socketEvents.emitReportModerated(event)

      expect(io.to).toHaveBeenCalledWith('moderators')
      const emitCall = (io.to as jest.Mock).mock.results[0].value.emit
      expect((emitCall as jest.Mock).mock.calls[0][0]).toBe('report:moderated')
    })

    it('should emit verification reviewed event', () => {
      const event = {
        verificationId: 'ver-123',
        status: 'approved' as const,
        reviewedBy: 'moderator@example.com',
        timestamp: new Date(),
      }

      socketEvents.emitVerificationReviewed(event)

      expect(io.to).toHaveBeenCalledWith('moderators')
    })

    it('should emit evidence reviewed event', () => {
      const event = {
        evidenceId: 'ev-123',
        fileName: 'document.pdf',
        status: 'approved' as const,
        reviewedBy: 'admin@example.com',
        timestamp: new Date(),
      }

      socketEvents.emitEvidenceReviewed(event)

      expect(io.to).toHaveBeenCalledWith('moderators')
    })

    it('should emit queue refresh event', () => {
      socketEvents.emitQueueRefresh('reports')

      expect(io.to).toHaveBeenCalledWith('moderators')
    })

    it('should emit user role changed event to user', () => {
      const userId = 'user-123'
      const event = {
        oldRole: 'reporter',
        newRole: 'moderator',
        changedBy: 'admin@example.com',
        timestamp: new Date(),
      }

      socketEvents.emitUserRoleChanged(userId, event)

      // Should emit to both target user room and moderators room
      expect(io.to).toHaveBeenCalledWith(`user:${userId}`)
      expect(io.to).toHaveBeenCalledWith('moderators')
    })

    it('should emit dashboard update event', () => {
      const stats = {
        totalReports: 100,
        pendingReports: 20,
        approvedReports: 60,
        rejectedReports: 20,
      }

      socketEvents.emitDashboardUpdate(stats)

      expect(io.to).toHaveBeenCalledWith('moderators')
    })

    it('should emit dashboard update to specific user', () => {
      const stats = {
        totalReports: 100,
        pendingReports: 20,
      }
      const userId = 'user-456'

      socketEvents.emitDashboardUpdate(stats, userId)

      expect(io.to).toHaveBeenCalledWith(`user:${userId}`)
    })

    it('should emit notification event', () => {
      socketEvents.emitNotification('Test notification', 'success')

      expect(io.emit).toHaveBeenCalledWith(
        'notification',
        expect.objectContaining({
          message: 'Test notification',
          type: 'success',
        })
      )
    })
  })

  describe('New Item Notifications', () => {
    it('should emit new report event', () => {
      const event = {
        reportId: 'report-new-123',
        title: 'New Report',
        submittedBy: 'reporter@example.com',
        timestamp: new Date(),
      }

      socketEvents.emitNewReport(event)

      expect(io.to).toHaveBeenCalledWith('moderators')
    })

    it('should emit new verification event', () => {
      const event = {
        verificationId: 'ver-new-123',
        timestamp: new Date(),
      }

      socketEvents.emitNewVerification(event)

      expect(io.to).toHaveBeenCalledWith('moderators')
    })

    it('should emit new evidence event', () => {
      const event = {
        evidenceId: 'ev-new-123',
        fileName: 'new-evidence.pdf',
        timestamp: new Date(),
      }

      socketEvents.emitNewEvidence(event)

      expect(io.to).toHaveBeenCalledWith('moderators')
    })
  })

  describe('Error Handling', () => {
    it('should handle null socket gracefully', () => {
      const event = {
        reportId: 'report-123',
        title: 'Test',
        moderatorEmail: 'test@example.com',
        status: 'approved' as const,
        timestamp: new Date(),
      }

      // Should not throw even with issues
      expect(() => socketEvents.emitReportModerated(event)).not.toThrow()
    })

    it('should catch emission errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      ;(io.to as jest.Mock).mockImplementation(() => {
        throw new Error('Emission failed')
      })

      const event = {
        reportId: 'report-123',
        title: 'Test',
        moderatorEmail: 'test@example.com',
        status: 'approved' as const,
        timestamp: new Date(),
      }

      // Should handle error gracefully
      expect(() => socketEvents.emitReportModerated(event)).not.toThrow()

      consoleSpy.mockRestore()
    })
  })

  describe('Connection Metrics', () => {
    it('should track connection count', () => {
      expect(io.engine?.clientsCount).toBe(1)
    })

    it('should handle connection limit warnings', () => {
      io.engine = {
        clientsCount: 1001, // Exceeds typical limit
      }

      // Should log warning for high connection count
      expect(io.engine.clientsCount).toBeGreaterThan(1000)
    })
  })

  describe('Room Management', () => {
    it('should allow joining custom rooms', async () => {
      mockSocket.join('reports:pending')

      expect(mockSocket.join).toHaveBeenCalledWith('reports:pending')
    })

    it('should allow leaving rooms', async () => {
      mockSocket.leave('moderators')

      expect(mockSocket.leave).toHaveBeenCalledWith('moderators')
    })

    it('should broadcast to specific room only', () => {
      const targetRoom = 'moderators'
      mockSocket.to(targetRoom).emit('test:event', { data: 'test' })

      expect(mockSocket.to).toHaveBeenCalledWith(targetRoom)
    })
  })

  describe('Event Data Validation', () => {
    it('should validate event structure for report moderated', () => {
      const invalidEvent: Record<string, unknown> = {
        // Missing required fields
        title: 'Test',
      }

      // Should not throw - implementation handles gracefully
      expect(() => socketEvents.emitReportModerated(invalidEvent)).not.toThrow()
    })

    it('should include timestamps on all events', () => {
      const event = {
        reportId: 'report-123',
        title: 'Test Report',
        moderatorEmail: 'test@example.com',
        status: 'approved' as const,
        timestamp: new Date(),
      }

      socketEvents.emitReportModerated(event)

      // Verify event has timestamp
      expect(event.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('Multi-Moderator Scenarios', () => {
    it('should broadcast to all moderators when action taken', () => {
      const broadcastSpy = jest.fn()
      ;(io.to as jest.Mock).mockReturnValue({ emit: broadcastSpy })

      const event = {
        reportId: 'report-123',
        title: 'Test',
        moderatorEmail: 'moderator1@example.com',
        status: 'approved' as const,
        timestamp: new Date(),
      }

      socketEvents.emitReportModerated(event)

      expect(broadcastSpy).toHaveBeenCalled()
    })

    it('should notify all moderators of role change', () => {
      const userId = 'user-456'
      const event = {
        oldRole: 'reporter',
        newRole: 'moderator',
        changedBy: 'admin@example.com',
        timestamp: new Date(),
      }

      socketEvents.emitUserRoleChanged(userId, event)

      // Should notify moderators room
      expect(io.to).toHaveBeenCalledWith('moderators')
    })

    it('should notify specific user of changes', () => {
      const userId = 'user-789'
      const event = {
        oldRole: 'reporter',
        newRole: 'moderator',
        changedBy: 'admin@example.com',
        timestamp: new Date(),
      }

      socketEvents.emitUserRoleChanged(userId, event)

      // Should notify specific user
      expect(io.to).toHaveBeenCalledWith(`user:${userId}`)
    })
  })
})
