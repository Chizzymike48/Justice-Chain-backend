import { useEffect, useCallback, useMemo } from 'react'
import io, { Socket } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'

let socketInstance: Socket | null = null

interface SocketOptions {
  url?: string
  enabled?: boolean
}

/**
 * Custom hook for Socket.io connection and event management
 * Handles authentication and maintains single socket instance
 */
const resolveSocketUrl = (inputUrl?: string): string => {
  const fallback = 'http://localhost:5000'
  if (!inputUrl) return fallback
  try {
    const parsed = new URL(inputUrl)
    return parsed.origin
  } catch {
    return inputUrl.replace(/\/api\/v1\/?$/i, '') || fallback
  }
}

export const useSocket = (options: SocketOptions = {}) => {
  const { enabled = true, url } = options
  const socketUrl = resolveSocketUrl(url || import.meta.env.VITE_API_URL)
  const { isLoggedIn } = useAuth()
  const token = useMemo(() => {
    if (!isLoggedIn || typeof window === 'undefined') {
      return null
    }
    return localStorage.getItem('authToken')
  }, [isLoggedIn])

  // Initialize socket connection
  useEffect(() => {
    if (!enabled || !token) {
      return
    }

    if (socketInstance?.connected) {
      return
    }

    try {
      socketInstance = io(socketUrl, {
        auth: {
          token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      })

      socketInstance.on('socket:connected', (data: unknown) => {
        console.log('Socket connected:', data)
      })

      socketInstance.on('error', (error: unknown) => {
        console.error('Socket error:', error)
      })

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected')
      })
    } catch (error) {
      console.error('Failed to connect socket:', error)
    }

    return () => {
      // Don't disconnect on unmount to maintain persistent connection
    }
  }, [enabled, token, socketUrl])

  // Join a room
  const joinRoom = useCallback((room: string) => {
    if (socketInstance?.connected) {
      socketInstance.emit('room:join', room)
    }
  }, [])

  // Leave a room
  const leaveRoom = useCallback((room: string) => {
    if (socketInstance?.connected) {
      socketInstance.emit('room:leave', room)
    }
  }, [])

  // Listen for an event
  const on = useCallback((event: string, callback: (...args: unknown[]) => void) => {
    if (socketInstance) {
      socketInstance.on(event, callback)
    }

    // Return unsubscribe function
    return () => {
      if (socketInstance) {
        socketInstance.off(event, callback)
      }
    }
  }, [])

  // Listen for an event once
  const once = useCallback((event: string, callback: (...args: unknown[]) => void) => {
    if (socketInstance) {
      socketInstance.once(event, callback)
    }
  }, [])

  // Emit an event
  const emit = useCallback((event: string, data?: unknown) => {
    if (socketInstance?.connected) {
      socketInstance.emit(event, data)
    }
  }, [])

  return {
    socket: socketInstance,
    connected: socketInstance?.connected || false,
    joinRoom,
    leaveRoom,
    on,
    once,
    emit,
  }
}

/**
 * Event types for real-time admin notifications
 */
export interface ReportModeratedEvent {
  reportId: string
  title: string
  action: 'approve' | 'reject'
  moderatedBy: string
  moderatedAt: string
  reason?: string
}

export interface VerificationReviewedEvent {
  verificationId: string
  claim: string
  action: 'verify' | 'dispute'
  confidence: number
  reviewedBy: string
  reviewedAt: string
}

export interface EvidenceReviewedEvent {
  evidenceId: string
  filename: string
  action: 'approve' | 'reject'
  reviewedBy: string
  reviewedAt: string
  reason?: string
}

export interface NewReportEvent {
  reportId: string
  title: string
  category: string
  office: string
  amount: number
  submittedDate: string
  pendingCount: number
}

export interface NewVerificationEvent {
  verificationId: string
  claim: string
  submittedDate: string
  pendingCount: number
}

export interface NewEvidenceEvent {
  evidenceId: string
  filename: string
  uploadedDate: string
  pendingCount: number
}

export interface UserRoleChangedEvent {
  userId: string
  oldRole: string
  newRole: string
  changedBy: string
}

export interface NotificationEvent {
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export interface QueueRefreshEvent {
  queueType: 'reports' | 'verifications' | 'evidence'
}

/**
 * Socket event names (event names must match backend socketEvents.ts)
 */
export const SOCKET_EVENTS = {
  // Moderation events
  REPORT_MODERATED: 'report:moderated',
  VERIFICATION_REVIEWED: 'verification:reviewed',
  EVIDENCE_REVIEWED: 'evidence:reviewed',

  // New item events
  REPORT_NEW: 'report:new',
  VERIFICATION_NEW: 'verification:new',
  EVIDENCE_NEW: 'evidence:new',

  // User events
  USER_ROLE_CHANGED: 'user:roleChanged',

  // Dashboard events
  DASHBOARD_UPDATED: 'dashboard:updated',
  QUEUE_REFRESH: 'queue:refresh',

  // General notifications
  NOTIFICATION: 'notification',
}
