import { FC, FormEvent, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  FileText,
  RadioTower,
  Video,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import PageHeader from '../common/PageHeader'
import evidenceService, { EvidenceRecord } from '../../services/evidenceService'
import livestreamService, { LiveStreamRecord } from '../../services/livestreamService'

type EvidenceType = 'document' | 'video' | 'livestream'

interface EvidenceFlowState {
  caseId?: string
  reportTitle?: string
  reportCategory?: string
  flowStep?: string
  returnTo?: string
}

interface EvidenceChoice {
  id: EvidenceType
  title: string
  description: string
  icon: LucideIcon
  accept?: string
}

const evidenceChoices: EvidenceChoice[] = [
  {
    id: 'document',
    title: 'Document',
    description: 'Upload PDFs, Word files, spreadsheets, or text documents tied to the report.',
    icon: FileText,
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt',
  },
  {
    id: 'video',
    title: 'Video',
    description: 'Upload supporting video material such as recorded footage or clips that show the incident.',
    icon: Video,
    accept: '.mp4,.mov,video/mp4,video/quicktime',
  },
  {
    id: 'livestream',
    title: 'Live Stream',
    description: 'Attach a live stream link for ongoing coverage connected to this report.',
    icon: RadioTower,
  },
]

const formatDate = (value?: string): string => {
  if (!value) return 'Recently added'

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? 'Recently added'
    : new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed)
}

const EvidenceUpload: FC = () => {
  const location = useLocation()
  const flowState = (location.state as EvidenceFlowState | null) ?? null
  const [selectedType, setSelectedType] = useState<EvidenceType | null>(null)
  const [caseId, setCaseId] = useState(flowState?.caseId ?? '')
  const [sourceNote, setSourceNote] = useState('')
  const [streamTitle, setStreamTitle] = useState(flowState?.reportTitle ? `${flowState.reportTitle} live coverage` : '')
  const [streamDescription, setStreamDescription] = useState(
    flowState?.reportTitle ? `Live stream evidence linked to report: ${flowState.reportTitle}.` : '',
  )
  const [streamUrl, setStreamUrl] = useState('')
  const [streamStatus, setStreamStatus] = useState('active')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [records, setRecords] = useState<EvidenceRecord[]>([])
  const [streams, setStreams] = useState<LiveStreamRecord[]>([])

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        setError(null)
        const [evidenceRecords, liveStreams] = await Promise.all([
          evidenceService.getEvidence(caseId || undefined),
          livestreamService.getLiveStreams(caseId || undefined),
        ])
        setRecords(evidenceRecords)
        setStreams(liveStreams)
      } catch (err) {
        console.error('Failed to load evidence step data:', err)
        setError('Unable to load uploaded evidence for this step right now.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [caseId])

  const currentChoice = useMemo(
    () => evidenceChoices.find((choice) => choice.id === selectedType) ?? null,
    [selectedType],
  )

  const canSubmitFile = Boolean(caseId.trim() && selectedType && selectedType !== 'livestream' && selectedFile)
  const canSubmitStream = Boolean(caseId.trim() && streamTitle.trim() && streamUrl.trim() && selectedType === 'livestream')

  const resetMessages = (): void => {
    setSubmitted(null)
    setError(null)
  }

  const onFileSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    resetMessages()

    if (!caseId.trim()) {
      setError('A case ID is required before evidence can be attached.')
      return
    }

    if (!selectedType || selectedType === 'livestream') {
      setError('Select either Document or Video for file upload.')
      return
    }

    if (!selectedFile) {
      setError('Choose a file before continuing.')
      return
    }

    setIsSubmitting(true)

    try {
      const notePrefix = selectedType === 'video' ? 'Video evidence' : 'Document evidence'
      const created = await evidenceService.uploadEvidence(caseId.trim(), selectedFile, `${notePrefix}: ${sourceNote}`.trim())
      setRecords((prev) => [created, ...prev])
      setSubmitted(`${currentChoice?.title ?? 'Evidence'} uploaded successfully.`)
      setSelectedFile(null)
      setSourceNote('')
      const form = event.currentTarget
      form.reset()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to upload evidence right now. Please try again.'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onStreamSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    resetMessages()

    if (!caseId.trim()) {
      setError('A case ID is required before a live stream can be linked.')
      return
    }

    setIsSubmitting(true)

    try {
      const created = await livestreamService.createLiveStream({
        title: streamTitle.trim(),
        description: streamDescription.trim(),
        streamUrl: streamUrl.trim(),
        caseId: caseId.trim(),
        status: streamStatus,
      })
      setStreams((prev) => [created, ...prev])
      setSubmitted('Live stream linked successfully.')
      setStreamUrl('')
      setStreamStatus('active')
      if (!flowState?.reportTitle) {
        setStreamTitle('')
        setStreamDescription('')
      }
    } catch {
      setError('Unable to link livestream right now. Check the stream URL and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="jc-shell">
      <section className="jc-page">
        <PageHeader
          eyebrow="Step 2: Evidence"
          title="Choose the evidence you want to attach"
          subtitle="After the report is saved, the next step is to attach the proof that supports it. Select the evidence type first, then complete that upload."
          actions={
            <>
              <Link to={flowState?.returnTo ?? '/report-corruption'} className="jc-btn jc-btn-ghost">
                Back to report form
              </Link>
              <Link to="/dashboard" className="jc-btn jc-btn-secondary">
                Finish later
              </Link>
            </>
          }
          metrics={[
            { label: 'Current step', value: '2 of 2', tone: 'brand' },
            { label: 'Case ID', value: caseId || 'Pending', tone: 'info' },
            { label: 'Report', value: flowState?.reportTitle ?? 'Manual evidence upload', tone: 'success' },
          ]}
        />

        <div className="jc-step-strip">
          <div className="jc-step-item jc-step-item--done">
            <span className="jc-step-badge">
              <CheckCircle2 size={16} strokeWidth={2.2} />
            </span>
            <div>
              <strong>Report details saved</strong>
              <p>{flowState?.reportTitle ?? 'Your report has been created and is ready for evidence.'}</p>
            </div>
          </div>
          <div className="jc-step-item jc-step-item--active">
            <span className="jc-step-badge">2</span>
            <div>
              <strong>Attach supporting evidence</strong>
              <p>Select a proof type and upload what best supports this case.</p>
            </div>
          </div>
        </div>

        <div className="jc-grid">
          <article className="jc-card jc-col-8">
            <p className="jc-card-kicker">Evidence type</p>
            <h2 className="jc-section-title">What do you want to upload?</h2>

            {!flowState?.caseId ? (
              <label className="jc-form-field" htmlFor="case-id-manual" style={{ marginBottom: '1rem' }}>
                <div className="jc-form-field-header">
                  <strong>Case ID</strong>
                  <span className="jc-input-hint">If you opened this page directly, enter the case ID first.</span>
                </div>
                <input
                  id="case-id-manual"
                  name="case-id-manual"
                  value={caseId}
                  onChange={(event) => setCaseId(event.target.value)}
                  placeholder="Paste the report or case ID"
                />
              </label>
            ) : (
              <div className="jc-inline-summary">
                <strong>Case ID:</strong> <span>{caseId}</span>
                {flowState?.reportTitle ? (
                  <>
                    <strong>Report:</strong> <span>{flowState.reportTitle}</span>
                  </>
                ) : null}
              </div>
            )}

            <div className="jc-choice-grid">
              {evidenceChoices.map((choice) => {
                const Icon = choice.icon
                const isActive = selectedType === choice.id
                return (
                  <button
                    key={choice.id}
                    type="button"
                    className={`jc-choice-card${isActive ? ' active' : ''}`}
                    onClick={() => {
                      resetMessages()
                      setSelectedType(choice.id)
                      setSelectedFile(null)
                    }}
                  >
                    <span className="jc-choice-icon">
                      <Icon size={18} strokeWidth={2.1} />
                    </span>
                    <span className="jc-choice-title">{choice.title}</span>
                    <span className="jc-choice-text">{choice.description}</span>
                  </button>
                )
              })}
            </div>

            {selectedType && currentChoice && selectedType !== 'livestream' ? (
              <form className="jc-form" onSubmit={onFileSubmit} style={{ marginTop: '1.25rem' }}>
                <p className="jc-card-kicker">Selected: {currentChoice.title}</p>
                <label className="jc-form-field" htmlFor="evidence-file">
                  <div className="jc-form-field-header">
                    <strong>{currentChoice.title} file</strong>
                    <span className="jc-input-hint">
                      Choose the {selectedType} file you want attached to case {caseId || 'this report'}.
                    </span>
                  </div>
                  <input
                    id="evidence-file"
                    name="evidence-file"
                    type="file"
                    accept={currentChoice.accept}
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                    required
                  />
                </label>

                <label className="jc-form-field" htmlFor="source-note">
                  <div className="jc-form-field-header">
                    <strong>Source note</strong>
                    <span className="jc-input-hint">Explain what this file contains and how it supports the case.</span>
                  </div>
                  <textarea
                    id="source-note"
                    name="source-note"
                    value={sourceNote}
                    onChange={(event) => setSourceNote(event.target.value)}
                    placeholder="Example: Contract copy, payment schedule, or recorded footage from the site."
                  />
                </label>

                {submitted ? <p className="jc-alert jc-alert-success">{submitted}</p> : null}
                {error ? <p className="jc-alert jc-alert-error">{error}</p> : null}

                <div className="jc-form-actions">
                  <button className="jc-btn jc-btn-primary" type="submit" disabled={isSubmitting || !canSubmitFile}>
                    {isSubmitting ? 'Uploading...' : `Upload ${currentChoice.title}`}
                  </button>
                  <Link to="/dashboard" className="jc-btn jc-btn-secondary">
                    Finish workflow
                  </Link>
                </div>
              </form>
            ) : null}

            {selectedType === 'livestream' ? (
              <form className="jc-form" onSubmit={onStreamSubmit} style={{ marginTop: '1.25rem' }}>
                <p className="jc-card-kicker">Selected: Live Stream</p>
                <label className="jc-form-field" htmlFor="stream-title">
                  <div className="jc-form-field-header">
                    <strong>Stream title</strong>
                    <span className="jc-input-hint">Name the live coverage clearly so reviewers know what they are opening.</span>
                  </div>
                  <input
                    id="stream-title"
                    value={streamTitle}
                    onChange={(event) => setStreamTitle(event.target.value)}
                    placeholder="Live coverage title"
                    required
                  />
                </label>

                <label className="jc-form-field" htmlFor="stream-description">
                  <div className="jc-form-field-header">
                    <strong>Description</strong>
                    <span className="jc-input-hint">Give a short explanation of what the stream shows.</span>
                  </div>
                  <textarea
                    id="stream-description"
                    value={streamDescription}
                    onChange={(event) => setStreamDescription(event.target.value)}
                    placeholder="What does the stream cover and why is it relevant to this report?"
                  />
                </label>

                <div className="jc-form-row">
                  <label className="jc-form-field" htmlFor="stream-url">
                    <div className="jc-form-field-header">
                      <strong>Stream URL</strong>
                      <span className="jc-input-hint">Paste the live stream link.</span>
                    </div>
                    <input
                      id="stream-url"
                      type="url"
                      value={streamUrl}
                      onChange={(event) => setStreamUrl(event.target.value)}
                      placeholder="https://..."
                      required
                    />
                  </label>

                  <label className="jc-form-field" htmlFor="stream-status">
                    <div className="jc-form-field-header">
                      <strong>Status</strong>
                      <span className="jc-input-hint">Set the current state of the stream.</span>
                    </div>
                    <select
                      id="stream-status"
                      value={streamStatus}
                      onChange={(event) => setStreamStatus(event.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </label>
                </div>

                {submitted ? <p className="jc-alert jc-alert-success">{submitted}</p> : null}
                {error ? <p className="jc-alert jc-alert-error">{error}</p> : null}

                <div className="jc-form-actions">
                  <button className="jc-btn jc-btn-primary" type="submit" disabled={isSubmitting || !canSubmitStream}>
                    {isSubmitting ? 'Linking...' : 'Link livestream'}
                  </button>
                  <Link to="/dashboard" className="jc-btn jc-btn-secondary">
                    Finish workflow
                  </Link>
                </div>
              </form>
            ) : null}

            {!selectedType ? (
              <div className="jc-empty-state" style={{ marginTop: '1.25rem' }}>
                Select either Document, Video, or Live Stream to continue the evidence step.
              </div>
            ) : null}
          </article>

          <aside className="jc-col-4 jc-sidebar-stack">
            <article className="jc-card jc-card--accent">
              <p className="jc-card-kicker">How this step works</p>
              <ul className="jc-checklist">
                <li>
                  <span className="jc-check-badge">1</span>
                  <span>The report is created first so every upload can point to the correct case ID.</span>
                </li>
                <li>
                  <span className="jc-check-badge">2</span>
                  <span>You choose the evidence type before uploading anything.</span>
                </li>
                <li>
                  <span className="jc-check-badge">3</span>
                  <span>Document and video uploads attach directly to the case. Live stream links are now stored with that same case ID.</span>
                </li>
              </ul>
            </article>

            <article className="jc-card">
              <p className="jc-card-kicker">Current case context</p>
              <p className="jc-muted">
                {flowState?.reportTitle
                  ? `You are adding evidence for "${flowState.reportTitle}".`
                  : 'You opened the evidence page directly, so attach uploads by entering the case ID.'}
              </p>
              <div className="jc-inline-summary" style={{ marginTop: '0.75rem' }}>
                <strong>Case ID:</strong> <span>{caseId || 'Not entered yet'}</span>
                {flowState?.reportCategory ? (
                  <>
                    <strong>Category:</strong> <span>{flowState.reportCategory}</span>
                  </>
                ) : null}
              </div>
            </article>
          </aside>

          <article className="jc-card jc-col-6">
            <p className="jc-card-kicker">Recent file evidence</p>
            {isLoading ? <p className="jc-alert jc-alert-info">Loading evidence history...</p> : null}
            {!isLoading && records.length === 0 ? (
              <div className="jc-empty-state">No document or video evidence uploaded for this case yet.</div>
            ) : null}
            <ul className="jc-list">
              {records.map((record) => (
                <li key={record.id} className="jc-list-item">
                  <strong>{record.fileName}</strong>
                  <p className="jc-muted" style={{ marginTop: '0.2rem' }}>
                    Case: {record.caseId} | Status: {record.status}
                  </p>
                </li>
              ))}
            </ul>
          </article>

          <article className="jc-card jc-col-6">
            <p className="jc-card-kicker">Linked live streams</p>
            {isLoading ? <p className="jc-alert jc-alert-info">Loading linked streams...</p> : null}
            {!isLoading && streams.length === 0 ? (
              <div className="jc-empty-state">No live streams linked to this case yet.</div>
            ) : null}
            <ul className="jc-list">
              {streams.map((stream) => (
                <li key={stream.id} className="jc-list-item">
                  <strong>{stream.title}</strong>
                  <p className="jc-muted" style={{ marginTop: '0.2rem' }}>
                    {stream.status ?? 'active'} | {formatDate(stream.createdAt)}
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

export default EvidenceUpload
