import { FC, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import adminService, { VerificationForReview } from '../services/adminService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'
import SuccessAlert from '../components/common/SuccessAlert'
import ConfirmDialog from '../components/common/ConfirmDialog'
import PaginationControls from '../components/common/PaginationControls'

const VerificationReviewPage: FC = () => {
  const { user } = useAuth()
  const [verifications, setVerifications] = useState<VerificationForReview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [selectedVerification, setSelectedVerification] = useState<VerificationForReview | null>(null)
  const [action, setAction] = useState<'verify' | 'dispute' | null>(null)
  const [confidence, setConfidence] = useState(50)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const canReview = user?.role === 'admin' || user?.role === 'moderator'

  useEffect(() => {
    if (!canReview) return
    const load = async (): Promise<void> => {
      try {
        setError(null)
        const { data, pagination } = await adminService.getVerificationsForReview(page, 20, 'pending')
        setVerifications(data)
        setTotalPages(pagination.pages ?? 1)
      } catch {
        setError('Failed to load verifications for review.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [page, canReview])

  const handleAction = async (verification: VerificationForReview, actionType: 'verify' | 'dispute'): Promise<void> => {
    setSelectedVerification(verification)
    setAction(actionType)
  }

  const confirmAction = async (): Promise<void> => {
    if (!selectedVerification || !action) return

    setIsSubmitting(true)
    try {
      await adminService.reviewVerification(selectedVerification.id, action, confidence, notes)
      setSuccess(`Verification ${action}d successfully.`)
      setVerifications(verifications.filter((v) => v.id !== selectedVerification.id))
      setSelectedVerification(null)
      setAction(null)
      setNotes('')
      setConfidence(50)
    } catch {
      setError('Failed to review verification.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (user && !canReview) {
    return <Navigate to="/dashboard" replace />
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading verifications for review..." fullScreen={false} />
  }

  return (
    <div className="jc-shell">
      <section className="jc-page">
        <h1>Verification Review</h1>
        <p className="jc-subtitle">Review and verify/dispute submitted claims.</p>

        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
        {success && <SuccessAlert message={success} onDismiss={() => setSuccess(null)} />}

        {!isLoading && verifications.length === 0 && (
          <div className="jc-card">
            <p style={{ textAlign: 'center', color: '#666' }}>No pending verifications to review.</p>
          </div>
        )}

        <div className="jc-grid">
          {verifications.map((verification) => (
            <article key={verification.id} className="jc-card jc-col-6">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.7rem' }}>{verification.claim.substring(0, 50)}...</h3>
              <p style={{ color: 'var(--jc-ink-soft)', marginBottom: '0.7rem', fontSize: '0.9rem' }}>
                <strong>Source:</strong> {verification.source}
              </p>
              <p style={{ color: 'var(--jc-ink-soft)', marginBottom: '0.7rem', fontSize: '0.9rem' }}>
                <strong>Status:</strong> {verification.status}
              </p>
              <p style={{ color: 'var(--jc-ink-soft)', marginBottom: '0.7rem', fontSize: '0.9rem' }}>
                <strong>Current Confidence:</strong> {verification.confidence}%
              </p>
              <p style={{ color: 'var(--jc-ink-soft)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Submitted: {new Date(verification.createdAt).toLocaleDateString()}
              </p>

              <div style={{ display: 'flex', gap: '0.7rem' }}>
                <button
                  className="jc-btn jc-btn-primary"
                  onClick={() => {
                    void handleAction(verification, 'verify')
                  }}
                >
                  Verify
                </button>
                <button
                  className="jc-btn"
                  style={{ backgroundColor: '#ff9800', color: '#fff', border: 'none' }}
                  onClick={() => {
                    void handleAction(verification, 'dispute')
                  }}
                >
                  Dispute
                </button>
              </div>
            </article>
          ))}
        </div>

        {totalPages > 1 && (
          <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} isLoading={isLoading} />
        )}

        {selectedVerification && action && (
          <ConfirmDialog
            title={`${action.charAt(0).toUpperCase() + action.slice(1)} Verification`}
            message={`Are you sure you want to ${action} this verification?`}
            confirmText={action === 'verify' ? 'Verify' : 'Dispute'}
            onConfirm={confirmAction}
            onCancel={() => {
              setSelectedVerification(null)
              setAction(null)
            }}
            isLoading={isSubmitting}
            isDangerous={action === 'dispute'}
          />
        )}
      </section>
    </div>
  )
}

export default VerificationReviewPage
