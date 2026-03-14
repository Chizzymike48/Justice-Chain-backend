import { FC, FormEvent, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '../components/common/PageHeader'
import reportService from '../services/reportService'

const issueChecklist = [
  'Describe the public service or infrastructure problem.',
  'Include where the issue is happening and when it was observed.',
  'Choose the category that best matches the issue.',
  'Use evidence upload next if you have documents or media.',
]

const issueWorkflow = [
  'Your issue enters the moderation queue with category and description context.',
  'Supporting evidence can be linked immediately from the upload page.',
  'Status updates appear on the dashboard as the case moves forward.',
]

const ReportIssue: FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const navigate = useNavigate()

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const issueType = String(formData.get('issue-category') ?? '')
    
    const payload = {
      title: String(formData.get('issue-title') ?? ''),
      category: 'civic',
      description: String(formData.get('issue-description') ?? ''),
      source: `civic-${issueType}`,
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
          returnTo: '/report-issue',
        },
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to submit issue right now. Please try again.'
      console.error('Issue submission error:', err)
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="jc-shell">
      <section className="jc-page">
        <PageHeader
          eyebrow="Civic issue intake"
          title="Report a civic issue"
          subtitle="Capture service delivery gaps with enough structure that the review team can assess and route them quickly."
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
            { label: 'Issue types', value: 'Roads to education', tone: 'brand' },
            { label: 'Review path', value: 'Moderation queue', tone: 'info' },
            { label: 'Follow-up', value: 'Dashboard alerts', tone: 'success' },
          ]}
        />

        <div className="jc-grid">
          <article className="jc-card jc-col-8">
            <p className="jc-card-kicker">Issue details</p>
            <h2 className="jc-section-title">Make the problem easy to understand</h2>
            <form className="jc-form" onSubmit={onSubmit} ref={formRef}>
              <label className="jc-form-field" htmlFor="issue-title">
                <div className="jc-form-field-header">
                  <strong>Issue title</strong>
                  <span className="jc-input-hint">A short summary helps moderators triage the report faster. (3-180 characters)</span>
                </div>
                <input 
                  id="issue-title" 
                  name="issue-title" 
                  required 
                  minLength={3}
                  maxLength={180}
                  placeholder="Example: Unfinished health center roof" 
                />
              </label>

              <label className="jc-form-field" htmlFor="issue-category">
                <div className="jc-form-field-header">
                  <strong>Category</strong>
                  <span className="jc-input-hint">Choose the area that best represents the public service gap.</span>
                </div>
                <select id="issue-category" name="issue-category" required defaultValue="">
                  <option value="" disabled>
                    Select category
                  </option>
                  <option value="roads">Roads</option>
                  <option value="water">Water</option>
                  <option value="health">Health</option>
                  <option value="education">Education</option>
                </select>
              </label>

              <label className="jc-form-field" htmlFor="issue-description">
                <div className="jc-form-field-header">
                  <strong>Description</strong>
                  <span className="jc-input-hint">Include what happened, where it is happening, and who is affected. (10+ characters)</span>
                </div>
                <textarea
                  id="issue-description"
                  name="issue-description"
                  required
                  minLength={10}
                  placeholder="Describe the issue, location, timing, and any known impact."
                />
              </label>

              {error ? <p className="jc-alert jc-alert-error">{error}</p> : null}

              <div className="jc-form-actions">
                <button type="submit" className="jc-btn jc-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving issue...' : 'Next: add evidence'}
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
                {issueChecklist.map((item, index) => (
                  <li key={item}>
                    <span className="jc-check-badge">{index + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="jc-card">
              <p className="jc-card-kicker">Workflow after submission</p>
              <ol className="jc-timeline">
                {issueWorkflow.map((item, index) => (
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

export default ReportIssue
