import { FC, FormEvent, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '../components/common/PageHeader'
import reportService from '../services/reportService'

const intakeChecklist = [
  'Use a direct title that names the issue.',
  'Identify the office or agency involved.',
  'Describe the timeline and what can be verified.',
  'Upload supporting evidence immediately after submission if you have it.',
]

const nextSteps = [
  'Moderators review the initial report for clarity and relevance.',
  'Evidence can be added or linked from the upload workflow.',
  'Verification and escalation decisions appear in the dashboard.',
]

const ReportCorruptionPage: FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const navigate = useNavigate()

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const payload = {
      title: String(formData.get('case-title') ?? ''),
      category: 'corruption',
      office: String(formData.get('agency-name') ?? ''),
      amount: Number(formData.get('amount') ?? 0),
      description: String(formData.get('narrative') ?? ''),
      source: 'corruption-form',
    }

    try {
      const created = await reportService.createReport(payload)
      if (formRef.current) {
        formRef.current.reset()
      }
      navigate('/evidence-upload', {
        state: {
          caseId: created.id,
          reportTitle: created.title,
          reportCategory: created.category,
          flowStep: 'evidence',
          returnTo: '/report-corruption',
        },
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to submit corruption report right now. Please try again.'
      console.error('Report submission error:', err)
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="jc-shell">
      <section className="jc-page">
        <PageHeader
          eyebrow="Protected reporting"
          title="Report a corruption case"
          subtitle="Provide factual, review-ready information so moderators can move faster and with less back-and-forth."
          actions={
            <>
              <Link to="/evidence-upload" className="jc-btn jc-btn-primary">
                Upload evidence
              </Link>
              <Link to="/dashboard" className="jc-btn jc-btn-ghost">
                Open dashboard
              </Link>
            </>
          }
          metrics={[
            { label: 'Submission path', value: 'Confidential', tone: 'brand' },
            { label: 'Next step', value: 'Evidence upload', tone: 'info' },
            { label: 'Review flow', value: 'Moderation', tone: 'success' },
          ]}
        />

        <div className="jc-grid">
          <article className="jc-card jc-col-8">
            <p className="jc-card-kicker">Case intake</p>
            <h2 className="jc-section-title">Document the allegation clearly</h2>
            <form className="jc-form" onSubmit={onSubmit} ref={formRef}>
              <label className="jc-form-field" htmlFor="case-title">
                <div className="jc-form-field-header">
                  <strong>Case title</strong>
                  <span className="jc-input-hint">Use a short label that names the issue immediately. (3-180 characters)</span>
                </div>
                <input
                  id="case-title"
                  name="case-title"
                  required
                  minLength={3}
                  maxLength={180}
                  placeholder="Example: Inflated contract for school renovation"
                />
              </label>

              <div className="jc-form-row">
                <label className="jc-form-field" htmlFor="agency-name">
                  <div className="jc-form-field-header">
                    <strong>Agency or office</strong>
                    <span className="jc-input-hint">Identify the institution or office connected to the case.</span>
                  </div>
                  <input id="agency-name" name="agency-name" required placeholder="Agency involved" />
                </label>

                <label className="jc-form-field" htmlFor="amount">
                  <div className="jc-form-field-header">
                    <strong>Estimated amount</strong>
                    <span className="jc-input-hint">Optional, but useful when there is a known financial impact.</span>
                  </div>
                  <input id="amount" name="amount" type="number" min={0} placeholder="0.00" />
                </label>
              </div>

              <label className="jc-form-field" htmlFor="narrative">
                <div className="jc-form-field-header">
                  <strong>Incident narrative</strong>
                  <span className="jc-input-hint">Focus on what happened, who handled it, and what can be verified. (10+ characters)</span>
                </div>
                <textarea
                  id="narrative"
                  name="narrative"
                  required
                  minLength={10}
                  placeholder="Describe the evidence trail, people involved, and the timeline."
                />
              </label>

              {error ? <p className="jc-alert jc-alert-error">{error}</p> : null}

              <div className="jc-form-actions">
                <button type="submit" className="jc-btn jc-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving report...' : 'Next: add evidence'}
                </button>
                <Link to="/evidence-upload" className="jc-btn jc-btn-secondary">
                  Open evidence step
                </Link>
              </div>
            </form>
          </article>

          <aside className="jc-col-4 jc-sidebar-stack">
            <article className="jc-card jc-card--accent">
              <p className="jc-card-kicker">Submission checklist</p>
              <ul className="jc-checklist">
                {intakeChecklist.map((item, index) => (
                  <li key={item}>
                    <span className="jc-check-badge">{index + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="jc-card">
              <p className="jc-card-kicker">What happens next</p>
              <ol className="jc-timeline">
                {nextSteps.map((item, index) => (
                  <li key={item}>
                    <span className="jc-timeline-step">{index + 1}</span>
                    <div className="jc-timeline-text">{item}</div>
                  </li>
                ))}
              </ol>
            </article>
          </aside>
        </div>
      </section>
    </div>
  )
}

export default ReportCorruptionPage
