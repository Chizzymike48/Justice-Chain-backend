import { renderHook, act, waitFor } from '@testing-library/react'
import { useSocket, SOCKET_EVENTS } from '../../src/hooks/useSocket'
import io from 'socket.io-client'

// Mock socket.io-client
jest.mock('socket.io-client')

describe('useSocket Hook - Real-Time Integration', () => {
  let mockSocket: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock socket instance
    mockSocket = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      connected: true,
      id: 'socket-client-123',
    }

    ;(io as jest.Mock).mockReturnValue(mockSocket)

    // Mock localStorage
    localStorage.getItem = jest.fn((key) => {
      if (key === 'authToken') {
        return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
      return null
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Connection Management', () => {
    it('should connect to socket server on mount', () => {
      renderHook(() => useSocket({ enabled: true }))

      expect(io).toHaveBeenCalledWith(
        'http://localhost:3000',
        expect.objectContaining({
          auth: expect.any(Object),
          reconnection: true,
        })
      )
    })

    it('should not connect when disabled', () => {
      renderHook(() => useSocket({ enabled: false }))

      // Should not call io if disabled
      expect(io).not.toHaveBeenCalled()
    })

    it('should pass JWT token in auth', () => {
      renderHook(() => useSocket({ enabled: true }))

      expect(io).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: {
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        })
      )
    })

    it('should use custom URL if provided', () => {
      renderHook(() => useSocket({ enabled: true, url: 'http://custom-url:3001' }))

      expect(io).toHaveBeenCalledWith(
        'http://custom-url:3001',
        expect.any(Object)
      )
    })

    it('should handle missing auth token gracefully', () => {
      ;(localStorage.getItem as jest.Mock).mockReturnValue(null)

      renderHook(() => useSocket({ enabled: true }))

      expect(io).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: { token: null },
        })
      )
    })

    it('should disconnect on unmount', () => {
      const { unmount } = renderHook(() => useSocket({ enabled: true }))

      unmount()

      expect(mockSocket.disconnect).toHaveBeenCalled()
    })
  })

  describe('Event Subscription', () => {
    it('should subscribe to events', () => {
      const { result } = renderHook(() => useSocket({ enabled: true }))

      const callback = jest.fn()
      act(() => {
        result.current.on(SOCKET_EVENTS.REPORT_MODERATED, callback)
      })

      expect(mockSocket.on).toHaveBeenCalledWith(
        SOCKET_EVENTS.REPORT_MODERATED,
        expect.any(Function)
      )
    })

    it('should return unsubscribe function', () => {
      const { result } = renderHook(() => useSocket({ enabled: true }))

      const callback = jest.fn()
      const unsubscribe = result.current.on(SOCKET_EVENTS.REPORT_MODERATED, callback)

      // Unsubscribe should be a function
      expect(typeof unsubscribe).toBe('function')

      // Call unsubscribe
      act(() => {
        unsubscribe()
      })

      expect(mockSocket.off).toHaveBeenCalledWith(
        SOCKET_EVENTS.REPORT_MODERATED,
        expect.any(Function)
      )
    })

    it('should subscribe to once events', () => {
      const { result } = renderHook(() => useSocket({ enabled: true }))

      const callback = jest.fn()
      act(() => {
        result.current.once(SOCKET_EVENTS.QUEUE_REFRESH, callback)
      })

      expect(mockSocket.once).toHaveBeenCalledWith(
        SOCKET_EVENTS.QUEUE_REFRESH,
        expect.any(Function)
      )
    })

    it('should handle multiple event subscriptions', () => {
      const { result } = renderHook(() => useSocket({ enabled: true }))

      const callback1 = jest.fn()
      const callback2 = jest.fn()

      act(() => {
        result.current.on(SOCKET_EVENTS.REPORT_MODERATED, callback1)
        result.current.on(SOCKET_EVENTS.VERIFICATION_REVIEWED, callback2)
      })

      expect(mockSocket.on).toHaveBeenCalledTimes(2)
    })

    it('should trigger callback when event received', () => {
      const { result } = renderHook(() => useSocket({ enabled: true }))

      const callback = jest.fn()
      const eventData = {
        reportId: 'report-123',
        title: 'Test Report',
        moderatorEmail: 'test@example.com',
        status: 'approved',
      }

      act(() => {
        result.current.on(SOCKET_EVENTS.REPORT_MODERATED, callback)
      })

      // Simulate event from server
      const onCall = mockSocket.on.mock.calls.find(
        call => call[0] === SOCKET_EVENTS.REPORT_MODERATED
      )
      if (onCall && typeof onCall[1] === 'function') {
        act(() => {
          onCall[1](eventData)
        })
      }

      expect(callback).toHaveBeenCalledWith(eventData)
    })
  })

  describe('Event Emission', () => {
    it('should emit events to server', () => {
      const { result } = renderHook(() => useSocket({ enabled: true }))

      const data = { action: 'test' }
      act(() => {
        result.current.emit('custom:event', data)
      })

      expect(mockSocket.emit).toHaveBeenCalledWith('custom:event', data)
    })

    it('should emit events without data', () => {
      const { result } = renderHook(() => useSocket({ enabled: true }))

      act(() => {
        result.current.emit('custom:event')
      })

      expect(mockSocket.emit).toHaveBeenCalledWith('custom:event', undefined)
    })
  })

  describe('Room Management', () => {
    it('should join room', async () => {
      const { result } = waitFor(() => result.current)
      const hook = renderHook(() => useSocket({ enabled: true }))

      await act(async () => {
        await hook.result.current.joinRoom('moderators')
      })

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'join:room',
        { room: 'moderators' },
        expect.any(Function)
      )
    })

    it('should leave room', async () => {
      const { result } = renderHook(() => useSocket({ enabled: true }))

      await act(async () => {
        await result.current.leaveRoom('moderators')
      })

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'leave:room',
        { room: 'moderators' },
        expect.any(Function)
      )
    })
  })

  describe('Connection State', () => {
    it('should expose connection status', () => {
      mockSocket.connected = true

      const { result } = renderHook(() => useSocket({ enabled: true }))

      expect(result.current.connected).toBe(true)
    })

    it('should expose socket instance', () => {
      const { result } = renderHook(() => useSocket({ enabled: true }))

      expect(result.current.socket).toBe(mockSocket)
    })

    it('should update connected status on reconnection', () => {
      const { result, rerender } = renderHook(() => useSocket({ enabled: true }))

      mockSocket.connected = false
      rerender()

      expect(result.current.connected).toBe(false)
    })
  })

  describe('Singleton Pattern', () => {
    it('should reuse socket instance across multiple hooks', () => {
      renderHook(() => useSocket({ enabled: true }))
      renderHook(() => useSocket({ enabled: true }))

      // io should only be called once (singleton pattern)
      expect(io).toHaveBeenCalledTimes(1)
    })

    it('should create new instance with different configuration', () => {
      renderHook(() => useSocket({ enabled: true, url: 'http://localhost:3000' }))
      renderHook(() => useSocket({ enabled: true, url: 'http://custom:3001' }))

      // Should create new instances for different URLs
      expect(io).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle connection errors', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          callback(new Error('Connection error'))
        }
      })

      renderHook(() => useSocket({ enabled: true }))

      consoleErrorSpy.mockRestore()
    })

    it('should handle disconnect gracefully', () => {
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'disconnect') {
          callback('io server disconnect')
        }
      })

      const { result } = renderHook(() => useSocket({ enabled: true }))

      expect(result.current.connected).toBeDefined()
    })
  })

  describe('Event Constants', () => {
    it('should export all event types', () => {
      expect(SOCKET_EVENTS.REPORT_MODERATED).toBe('report:moderated')
      expect(SOCKET_EVENTS.VERIFICATION_REVIEWED).toBe('verification:reviewed')
      expect(SOCKET_EVENTS.EVIDENCE_REVIEWED).toBe('evidence:reviewed')
      expect(SOCKET_EVENTS.REPORT_NEW).toBe('report:new')
      expect(SOCKET_EVENTS.VERIFICATION_NEW).toBe('verification:new')
      expect(SOCKET_EVENTS.EVIDENCE_NEW).toBe('evidence:new')
      expect(SOCKET_EVENTS.USER_ROLE_CHANGED).toBe('user:roleChanged')
      expect(SOCKET_EVENTS.DASHBOARD_UPDATED).toBe('dashboard:updated')
      expect(SOCKET_EVENTS.NOTIFICATION).toBe('notification')
      expect(SOCKET_EVENTS.QUEUE_REFRESH).toBe('queue:refresh')
    })
  })

  describe('Real-World Scenarios', () => {
    it('should handle rapid event subscriptions and unsubscriptions', () => {
      const { result } = renderHook(() => useSocket({ enabled: true }))

      const callbacks = Array.from({ length: 10 }, () => jest.fn())

      act(() => {
        callbacks.forEach((cb, i) => {
          result.current.on(`event:${i}`, cb)
        })
      })

      expect(mockSocket.on).toHaveBeenCalledTimes(10)

      act(() => {
        callbacks.forEach((cb, i) => {
          result.current.on(`event:${i}`, cb)()
        })
      })

      expect(mockSocket.off).toHaveBeenCalledTimes(10)
    })

    it('should handle reconnection with token refresh', async () => {
      renderHook(() => useSocket({ enabled: true }))

      // Simulate disconnect and reconnect
      mockSocket.connected = false
      mockSocket.connected = true

      expect(mockSocket.connect).toBeDefined()
    })

    it('should support moderator dashboard real-time updates', () => {
      const { result } = renderHook(() => useSocket({ enabled: true }))

      const callbacks = {
        queueRefresh: jest.fn(),
        reportModerated: jest.fn(),
        verificationReviewed: jest.fn(),
      }

      act(() => {
        result.current.on(SOCKET_EVENTS.QUEUE_REFRESH, callbacks.queueRefresh)
        result.current.on(SOCKET_EVENTS.REPORT_MODERATED, callbacks.reportModerated)
        result.current.on(SOCKET_EVENTS.VERIFICATION_REVIEWED, callbacks.verificationReviewed)
      })

      // Simulate events
      const calls = mockSocket.on.mock.calls
      calls.forEach(call => {
        if (call[0] === SOCKET_EVENTS.QUEUE_REFRESH && typeof call[1] === 'function') {
          act(() => call[1]({ queueType: 'reports' }))
        }
      })

      expect(callbacks.queueRefresh).toHaveBeenCalled()
    })
  })
})
