import { Server } from 'socket.io'
import { getSocketServer } from './socketRegistry'

/**
 * Real-time socket event emitters for moderation workflows
 * These events are broadcast to moderators and admins in real-time
 */

interface ReportModeratedEvent {
  reportId: string
  title: string
  action: 'approve' | 'reject'
  moderatedBy: string
  moderatedAt: string
  reason?: string
}

interface VerificationReviewedEvent {
  verificationId: string
  claim: string
  action: 'verify' | 'dispute'
  confidence: number
  reviewedBy: string
  reviewedAt: string
}

interface EvidenceReviewedEvent {
  evidenceId: string
  filename: string
  action: 'approve' | 'reject'
  reviewedBy: string
  reviewedAt: string
  reason?: string
}

interface NewReportEvent {
  reportId: string
  title: string
  category: string
  office: string
  amount: number
  submittedDate: string
  pendingCount: number
}

interface NewVerificationEvent {
  verificationId: string
  claim: string
  submittedDate: string
  pendingCount: number
}

interface NewEvidenceEvent {
  evidenceId: string
  filename: string
  uploadedDate: string
  pendingCount: number
}

interface UserRoleChangedEvent {
  userId: string
  oldRole: string
  newRole: string
  changedBy: string
}

interface DashboardStatsUpdate {
  reports: {
    total: number
    pending: number
  }
  verifications: {
    total: number
    pending: number
  }
  evidence: {
    total: number
    pending: number
  }
  users: {
    total: number
    admins: number
    moderators: number
  }
}

export class SocketEvents {
  private io: Server

  constructor(io: Server) {
    this.io = io
  }

  /**
   * Emitted when a report is moderated (approved or rejected)
   * Sent to: all moderators in the "moderators" room
   */
  emitReportModerated(event: ReportModeratedEvent): void {
    this.io.to('moderators').emit('report:moderated', event)
  }

  /**
   * Emitted when a verification is reviewed
   * Sent to: all moderators
   */
  emitVerificationReviewed(event: VerificationReviewedEvent): void {
    this.io.to('moderators').emit('verification:reviewed', event)
  }

  /**
   * Emitted when evidence is reviewed
   * Sent to: all moderators
   */
  emitEvidenceReviewed(event: EvidenceReviewedEvent): void {
    this.io.to('moderators').emit('evidence:reviewed', event)
  }

  /**
   * Emitted when a new report is submitted (pending review)
   * Sent to: all moderators
   */
  emitNewReport(event: NewReportEvent): void {
    this.io.to('moderators').emit('report:new', event)
  }

  /**
   * Emitted when a new verification is submitted
   * Sent to: all moderators
   */
  emitNewVerification(event: NewVerificationEvent): void {
    this.io.to('moderators').emit('verification:new', event)
  }

  /**
   * Emitted when new evidence is uploaded
   * Sent to: all moderators
   */
  emitNewEvidence(event: NewEvidenceEvent): void {
    this.io.to('moderators').emit('evidence:new', event)
  }

  /**
   * Emitted when a user's role is changed
   * Sent to: the specific user and all admins
   */
  emitUserRoleChanged(userId: string, event: UserRoleChangedEvent): void {
    // Notify the user of their role change
    this.io.to(`user:${userId}`).emit('user:roleChanged', event)
    // Notify all admins
    this.io.to('moderators').emit('user:roleChanged', event)
  }

  /**
   * Emitted when dashboard statistics are updated
   * Can be sent periodically or after each moderation action
   * Sent to: specific admin user
   */
  emitDashboardUpdate(stats: DashboardStatsUpdate, userId?: string): void {
    if (userId) {
      this.io.to(`user:${userId}`).emit('dashboard:updated', stats)
    } else {
      this.io.to('moderators').emit('dashboard:updated', stats)
    }
  }

  /**
   * Emitted to notify all moderators of activity
   * Generic notification for toast messages
   */
  emitNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    this.io.to('moderators').emit('notification', { message, type })
  }

  /**
   * Emitted to trigger a refresh of a specific queue
   * Useful for pagination or filtering updates
   */
  emitQueueRefresh(queueType: 'reports' | 'verifications' | 'evidence'): void {
    this.io.to('moderators').emit(`queue:refresh`, { queueType })
  }
}

/**
 * Initialize socket events with the global io instance
 */
export const initializeSocketEvents = (): SocketEvents => {
  return new SocketEvents(getSocketServer())
}
