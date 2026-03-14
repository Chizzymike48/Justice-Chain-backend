import { FC, useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import type { ReportForModeration } from '../services/adminService'
import adminService from '../services/adminService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'
import SuccessAlert from '../components/common/SuccessAlert'
import ConfirmDialog from '../components/common/ConfirmDialog'
import PaginationControls from '../components/common/PaginationControls'
import { useSocket, SOCKET_EVENTS } from '../hooks/useSocket'
import type { QueueRefreshEvent, ReportModeratedEvent } from '../hooks/useSocket'

const ReportModerationPage: FC = () => {
  const { user } = useAuth()
  const [reports, setReports] = useState<ReportForModeration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [selectedReport, setSelectedReport] = useState<ReportForModeration | null>(null)
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canModerate = user?.role === 'moderator' || user?.role === 'admin'
  const { on } = useSocket({ enabled: canModerate })

  const loadReports = useCallback(async (): Promise<void> => {
    try {
      setError(null)
      const { data, pagination } = await adminService.getReportsForModeration(page, 20, 'pending')
      setReports(data)
      setTotalPages(pagination.pages ?? 1)
    } catch {
      setError('Failed to load reports for moderation.')
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    if (!canModerate) return
    void loadReports()
  }, [canModerate, loadReports])

  // Listen for real-time report moderation events
  useEffect(() => {
    if (!canModerate) return
    const unsubscribe = on(SOCKET_EVENTS.REPORT_MODERATED, (event: unknown) => {
      const typedEvent = event as ReportModeratedEvent
      // Remove moderated report from list
      setReports((prev) => prev.filter((r) => r.id !== typedEvent.reportId))
      // Show notification about the moderation
      setSuccess(`Report "${typedEvent.title}" was ${typedEvent.action}d by ${typedEvent.moderatedBy}`)
    })

    return unsubscribe
  }, [on, canModerate])

  // Listen for queue refresh events
  useEffect(() => {
    if (!canModerate) return
    const unsubscribe = on(SOCKET_EVENTS.QUEUE_REFRESH, (event: unknown) => {
      const typedEvent = event as QueueRefreshEvent
      if (typedEvent.queueType === 'reports') {
        void loadReports()
      }
    })

    return unsubscribe
  }, [on, canModerate, loadReports])

  // Redirect non-moderators
  if (user && !canModerate) {
    return <Navigate to="/dashboard" replace />
  }

  const handleAction = async (report: ReportForModeration, actionType: 'approve' | 'reject'): Promise<void> => {
    setSelectedReport(report)
    setAction(actionType)
  }

  const confirmAction = async (): Promise<void> => {
    if (!selectedReport || !action) return

    setIsSubmitting(true)
    try {
      await adminService.moderateReport(selectedReport.id, action, reason)
      setSuccess(`Report ${action}d successfully.`)
      setReports(reports.filter((r) => r.id !== selectedReport.id))
      setSelectedReport(null)
      setAction(null)
      setReason('')
    } catch {
      setError('Failed to moderate report.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading reports for moderation..." fullScreen={false} />
  }

  return (
    <div className="jc-shell">
      <section className="jc-page">
        <h1>Report Moderation</h1>
        <p className="jc-subtitle">Review and approve/reject corruption and civic reports.</p>

        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
        {success && <SuccessAlert message={success} onDismiss={() => setSuccess(null)} />}

        {!isLoading && reports.length === 0 && (
          <div className="jc-card">
            <p style={{ textAlign: 'center', color: '#666' }}>No pending reports to review.</p>
          </div>
        )}

        <div className="jc-grid">
          {reports.map((report) => (
            <article key={report.id} className="jc-card jc-col-6">
              <h3>{report.title}</h3>
              <p style={{ color: 'var(--jc-ink-soft)', marginBottom: '0.7rem' }}>
                <strong>Category:</strong> {report.category}
              </p>
              <p style={{ color: 'var(--jc-ink-soft)', marginBottom: '0.7rem' }}>
                <strong>Office:</strong> {report.office}
              </p>
              {report.amount > 0 && (
                <p style={{ color: 'var(--jc-ink-soft)', marginBottom: '0.7rem' }}>
                  <strong>Amount:</strong> {report.amount}
                </p>
              )}
              <p style={{ color: 'var(--jc-ink-soft)', marginBottom: '0.7rem', fontSize: '0.9rem' }}>
                <strong>Description:</strong> {report.description.substring(0, 100)}...
              </p>
              <p style={{ color: 'var(--jc-ink-soft)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Submitted: {new Date(report.createdAt).toLocaleDateString()}
              </p>

              <div style={{ display: 'flex', gap: '0.7rem' }}>
                <button
                  className="jc-btn jc-btn-primary"
                  onClick={() => {
                    void handleAction(report, 'approve')
                  }}
                >
                  Approve
                </button>
                <button
                  className="jc-btn"
                  style={{ backgroundColor: '#f44336', color: '#fff', border: 'none' }}
                  onClick={() => {
                    void handleAction(report, 'reject')
                  }}
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>

        {totalPages > 1 && (
          <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} isLoading={isLoading} />
        )}

        {selectedReport && action && (
          <ConfirmDialog
            title={`${action.charAt(0).toUpperCase() + action.slice(1)} Report`}
            message={`Are you sure you want to ${action} this report: "${selectedReport.title}"?`}
            confirmText={action === 'approve' ? 'Approve' : 'Reject'}
            onConfirm={confirmAction}
            onCancel={() => {
              setSelectedReport(null)
              setAction(null)
              setReason('')
            }}
            isLoading={isSubmitting}
            isDangerous={action === 'reject'}
          />
        )}
      </section>
    </div>
  )
}

export default ReportModerationPage
