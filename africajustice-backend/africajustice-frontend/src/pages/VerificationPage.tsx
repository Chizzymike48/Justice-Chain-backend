import { FC, FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/common/PageHeader'
import verificationService, { VerificationRecord } from '../services/verificationService'

const verificationStandards = [
  'State the claim exactly as it was made.',
  'Include a source URL or reference when one exists.',
  'Use the description to guide reviewers toward documents or dates.',
]

const verificationWorkflow = [
  'The claim enters the verification queue as pending.',
  'Reviewers compare the claim against sources and evidence.',
  'Confidence scoring and status updates are reflected in the history list.',
]

const VerificationPage: FC = () => {
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verifications, setVerifications] = useState<VerificationRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const data = await verificationService.getVerifications()
        setVerifications(data)
      } catch {
        setError('Unable to load verification history.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const payload = {
      claim: String(formData.get('claim') ?? ''),
      source: String(formData.get('source') ?? ''),
    }

    try {
      const created = await verificationService.submitVerification(payload)
      setVerifications((prev) => [created, ...prev])
      setSubmitted(true)
      event.currentTarget.reset()
    } catch {
      setSubmitted(false)
      setError('Unable to start verification right now. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const pendingCount = verifications.filter((item) => (item.status ?? 'pending') === 'pending').length
  const averageConfidence =
    verifications.length > 0
      ? Math.round(verifications.reduce((sum, item) => sum + (item.confidence ?? 0), 0) / verifications.length)
      : 0

  return (
    <div className="jc-shell">
      <section className="jc-page">
        <PageHeader
          eyebrow="Verification workspace"
          title="Verify a public claim"
          subtitle="Keep the request clean and source-oriented so reviewers can move from the statement to evidence quickly."
          actions={
            <>
              <Link to="/dashboard" className="jc-btn jc-btn-primary">
                Open dashboard
              </Link>
              <Link to="/analytics" className="jc-btn jc-btn-ghost">
                View analytics
              </Link>
            </>
          }
          metrics={[
            { label: 'Requests logged', value: String(verifications.length), tone: 'brand' },
            { label: 'Pending checks', value: String(pendingCount), tone: 'info' },
            { label: 'Average confidence', value: `${averageConfidence}%`, tone: 'success' },
          ]}
        />

        <div className="jc-grid">
          <article className="jc-card jc-col-7">
            <p className="jc-card-kicker">New request</p>
            <h2 className="jc-section-title">Submit a claim for verification</h2>
            <form className="jc-form" onSubmit={onSubmit}>
              <label className="jc-form-field" htmlFor="claim">
                <div className="jc-form-field-header">
                  <strong>Claim statement</strong>
                  <span className="jc-input-hint">Paste the exact statement you want checked.</span>
                </div>
                <textarea id="claim" name="claim" required placeholder="Paste the statement to verify." />
              </label>

              <label className="jc-form-field" htmlFor="source">
                <div className="jc-form-field-header">
                  <strong>Source URL or reference</strong>
                  <span className="jc-input-hint">Optional, but it gives reviewers a faster starting point.</span>
                </div>
                <input id="source" name="source" type="url" placeholder="https://..." />
              </label>

              {submitted ? <p className="jc-alert jc-alert-success">Verification request submitted.</p> : null}
              {error ? <p className="jc-alert jc-alert-error">{error}</p> : null}

              <div className="jc-form-actions">
                <button type="submit" className="jc-btn jc-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Start verification'}
                </button>
                <Link to="/analytics" className="jc-btn jc-btn-secondary">
                  Review analytics
                </Link>
              </div>
            </form>
          </article>

          <aside className="jc-col-5 jc-sidebar-stack">
            <article className="jc-card jc-card--info">
              <p className="jc-card-kicker">Verification standard</p>
              <ul className="jc-checklist">
                {verificationStandards.map((item, index) => (
                  <li key={item}>
                    <span className="jc-check-badge">{index + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="jc-card">
              <p className="jc-card-kicker">Review path</p>
              <ol className="jc-timeline">
                {verificationWorkflow.map((item, index) => (
                  <li key={item}>
                    <span className="jc-timeline-step">{index + 1}</span>
                    <div className="jc-timeline-text">{item}</div>
                  </li>
                ))}
              </ol>
            </article>
          </aside>

          <article className="jc-card jc-col-12">
            <p className="jc-card-kicker">Recent checks</p>
            <h2 className="jc-section-title">Verification history</h2>
            {isLoading ? <p className="jc-alert jc-alert-info">Loading verification history...</p> : null}
            {!isLoading && verifications.length === 0 ? (
              <div className="jc-empty-state">No verification requests yet. Start a request above.</div>
            ) : null}
            <ul className="jc-list">
              {verifications.map((item) => (
                <li key={item.id} className="jc-list-item">
                  <strong>{item.claim}</strong>
                  <p className="jc-muted" style={{ marginTop: '0.25rem' }}>
                    Status: {(item.status ?? 'pending').toUpperCase()} | Confidence: {item.confidence ?? 0}%
                  </p>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </div>
  )
}

export default VerificationPage
