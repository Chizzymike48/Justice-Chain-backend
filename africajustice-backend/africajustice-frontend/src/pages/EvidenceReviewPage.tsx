import { FC, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import adminService, { EvidenceForReview } from '../services/adminService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'
import SuccessAlert from '../components/common/SuccessAlert'
import ConfirmDialog from '../components/common/ConfirmDialog'
import PaginationControls from '../components/common/PaginationControls'

const EvidenceReviewPage: FC = () => {
  const { user } = useAuth()
  const [evidence, setEvidence] = useState<EvidenceForReview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceForReview | null>(null)
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const canReview = user?.role === 'admin' || user?.role === 'moderator'

  useEffect(() => {
    if (!canReview) return
    const load = async (): Promise<void> => {
      try {
        setError(null)
        const { data, pagination } = await adminService.getEvidenceForReview(page, 20, 'pending')
        setEvidence(data)
        setTotalPages(pagination.pages ?? 1)
      } catch {
        setError('Failed to load evidence for review.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [page, canReview])

  const handleAction = async (evt: EvidenceForReview, actionType: 'approve' | 'reject'): Promise<void> => {
    setSelectedEvidence(evt)
    setAction(actionType)
  }

  const confirmAction = async (): Promise<void> => {
    if (!selectedEvidence || !action) return

    setIsSubmitting(true)
    try {
      await adminService.reviewEvidence(selectedEvidence.id, action, reason)
      setSuccess(`Evidence ${action}d successfully.`)
      setEvidence(evidence.filter((e) => e.id !== selectedEvidence.id))
      setSelectedEvidence(null)
      setAction(null)
      setReason('')
    } catch {
      setError('Failed to review evidence.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (user && !canReview) {
    return <Navigate to="/dashboard" replace />
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading evidence for review..." fullScreen={false} />
  }

  return (
    <div className="jc-shell">
      <section className="jc-page">
        <h1>Evidence Review</h1>
        <p className="jc-subtitle">Review and approve/reject uploaded evidence files.</p>

        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
        {success && <SuccessAlert message={success} onDismiss={() => setSuccess(null)} />}

        {!isLoading && evidence.length === 0 && (
          <div className="jc-card">
            <p style={{ textAlign: 'center', color: '#666' }}>No pending evidence to review.</p>
          </div>
        )}

        <div className="jc-grid">
          {evidence.map((file) => (
            <article key={file.id} className="jc-card jc-col-6">
              <h3 style={{ fontSize: '1rem', marginBottom: '0.7rem', wordBreak: 'break-word' }}>{file.filename}</h3>
              <p style={{ color: 'var(--jc-ink-soft)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <strong>Type:</strong> {file.mimeType}
              </p>
              <p style={{ color: 'var(--jc-ink-soft)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <strong>Size:</strong> {formatFileSize(file.size)}
              </p>
              <p style={{ color: 'var(--jc-ink-soft)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <strong>Status:</strong> {file.status}
              </p>
              <p style={{ color: 'var(--jc-ink-soft)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Uploaded: {new Date(file.createdAt).toLocaleDateString()}
              </p>

              <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '0.7rem' }}>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="jc-btn"
                  style={{ textDecoration: 'none', flex: 1, textAlign: 'center' }}
                >
                  Preview
                </a>
              </div>

              <div style={{ display: 'flex', gap: '0.7rem' }}>
                <button
                  className="jc-btn jc-btn-primary"
                  onClick={() => {
                    void handleAction(file, 'approve')
                  }}
                >
                  Approve
                </button>
                <button
                  className="jc-btn"
                  style={{ backgroundColor: '#f44336', color: '#fff', border: 'none' }}
                  onClick={() => {
                    void handleAction(file, 'reject')
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

        {selectedEvidence && action && (
          <ConfirmDialog
            title={`${action.charAt(0).toUpperCase() + action.slice(1)} Evidence`}
            message={`Are you sure you want to ${action} this evidence file: "${selectedEvidence.filename}"?`}
            confirmText={action === 'approve' ? 'Approve' : 'Reject'}
            onConfirm={confirmAction}
            onCancel={() => {
              setSelectedEvidence(null)
              setAction(null)
            }}
            isLoading={isSubmitting}
            isDangerous={action === 'reject'}
          />
        )}
      </section>
    </div>
  )
}

export default EvidenceReviewPage
