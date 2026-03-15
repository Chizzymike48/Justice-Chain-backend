import { FC, FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/common/PageHeader'
import { useAuth } from '../context/AuthContext'
import livestreamService, { LiveStreamRecord } from '../services/livestreamService'
import GoLiveButton from '../components/livestream/GoLiveButton'
import LiveStreamingComponent from '../components/livestream/LiveStreamingComponent'
import LiveChatComponent from '../components/livestream/LiveChat'

const dateFormatter = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const publishingChecklist = [
  'Use a stream URL that viewers can open reliably.',
  'Write a title that explains what the session is about.',
  'Add context in the description so people know why the stream matters.',
  'Use the dashboard and moderation tools to follow up after the broadcast.',
]

const publishingFlow = [
  'Create the livestream entry from this page.',
  'Share the public stream card with citizens and moderators.',
  'Keep the stream list current so people can find active coverage quickly.',
]

const getEmbedUrl = (streamUrl: string): string | null => {
  try {
    const parsed = new URL(streamUrl)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const videoId = parsed.searchParams.get('v')
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }

    if (host === 'youtu.be') {
      const videoId = parsed.pathname.replace('/', '')
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }

    if (host === 'vimeo.com') {
      const videoId = parsed.pathname.split('/').filter(Boolean).at(-1)
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null
    }

    return null
  } catch {
    return null
  }
}

const formatDate = (value?: string): string => {
  if (!value) return 'Recently added'

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Recently added' : dateFormatter.format(parsed)
}

const getStatusTone = (status?: string): string => {
  const normalized = (status ?? 'active').toLowerCase()
  if (normalized === 'ended' || normalized === 'archived') return 'jc-chip jc-chip--danger'
  if (normalized === 'scheduled' || normalized === 'upcoming') return 'jc-chip jc-chip--warning'
  return 'jc-chip'
}

const LiveStreamsPage: FC = () => {
  const { isLoggedIn } = useAuth()
  const [streams, setStreams] = useState<LiveStreamRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLiveStreaming, setIsLiveStreaming] = useState(false)
  const [liveStreamTitle, setLiveStreamTitle] = useState('')
  const [liveStreamCaseId, setLiveStreamCaseId] = useState<string | undefined>()

  useEffect(() => {
    const loadStreams = async (): Promise<void> => {
      try {
        setError(null)
        const data = await livestreamService.getLiveStreams()
        setStreams(data)
      } catch {
        setError('Unable to load livestreams right now.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadStreams()
  }, [])

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setSubmitError(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const payload = {
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? ''),
      streamUrl: String(formData.get('streamUrl') ?? ''),
      status: String(formData.get('status') ?? 'active'),
    }

    try {
      const created = await livestreamService.createLiveStream(payload)
      setStreams((prev) => [created, ...prev])
      setSuccessMessage('Livestream published. It is now visible in the stream hub.')
      event.currentTarget.reset()
    } catch {
      setSubmitError('Unable to publish livestream. Confirm the URL and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeStreams = useMemo(
    () => streams.filter((stream) => (stream.status ?? 'active').toLowerCase() === 'active'),
    [streams],
  )

  const featuredStream = activeStreams[0] ?? streams[0] ?? null
  const featuredEmbedUrl = featuredStream && featuredStream.streamUrl ? getEmbedUrl(featuredStream.streamUrl) : null
  const featuredStreamId = featuredStream?.streamId
  const isFeaturedLive = Boolean(featuredStreamId && (featuredStream?.status ?? 'active').toLowerCase() === 'active')

  const handleStartLiveStream = (streamData: { title: string; caseId?: string }) => {
    setLiveStreamTitle(streamData.title)
    setLiveStreamCaseId(streamData.caseId)
    setIsLiveStreaming(true)
  }

  const handleEndLiveStream = () => {
    setIsLiveStreaming(false)
    setLiveStreamTitle('')
    setLiveStreamCaseId(undefined)
    // Refresh streams list
    void (() => {
      livestreamService
        .getLiveStreams()
        .then(setStreams)
        .catch(() => setError('Failed to refresh livestreams'))
    })()
  }

  if (isLiveStreaming) {
    return (
      <LiveStreamingComponent
        streamTitle={liveStreamTitle}
        caseId={liveStreamCaseId}
        onClose={handleEndLiveStream}
      />
    )
  }

  return (
    <div className="jc-shell">
      <section className="jc-page">
        <PageHeader
          eyebrow="Public livestream hub"
          title="Live streams and civic coverage"
          subtitle="Your livestream experience is now represented in the frontend, with a public hub for watching active broadcasts and a logged-in publishing workflow."
          actions={
            isLoggedIn ? (
              <>
                <GoLiveButton onLiveStart={handleStartLiveStream} />
                <a href="#livestream-create" className="jc-btn jc-btn-primary">
                  Publish a stream
                </a>
                <Link to="/dashboard" className="jc-btn jc-btn-ghost">
                  Open dashboard
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="jc-btn jc-btn-primary">
                  Login to publish
                </Link>
                <Link to="/signup" className="jc-btn jc-btn-ghost">
                  Create account
                </Link>
              </>
            )
          }
          metrics={[
            { label: 'Active now', value: String(activeStreams.length), tone: 'brand' },
            { label: 'Streams listed', value: String(streams.length), tone: 'info' },
            { label: 'Publishing access', value: isLoggedIn ? 'Enabled' : 'Login required', tone: 'success' },
          ]}
        />

        <div className="jc-grid">
          <article className="jc-card jc-col-8">
            <p className="jc-card-kicker">Featured stream</p>
            <h2 className="jc-section-title">
              {featuredStream ? featuredStream.title : 'No livestream published yet'}
            </h2>

            {featuredStream ? (
              <>
                {featuredEmbedUrl ? (
                  <iframe
                    className="jc-media-frame"
                    src={featuredEmbedUrl}
                    title={featuredStream.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="jc-media-placeholder">
                    <strong>External stream preview</strong>
                    <span>
                      This stream cannot be embedded here, but viewers can still open it in a new tab.
                    </span>
                  </div>
                )}

                <div className="jc-meta-row">
                  <span className={getStatusTone(featuredStream.status)}>{featuredStream.status ?? 'active'}</span>
                  <span className="jc-muted">Published {formatDate(featuredStream.createdAt)}</span>
                </div>
                <p className="jc-muted">
                  {featuredStream.description || 'No additional description provided for this stream yet.'}
                </p>
                {featuredStream.streamUrl ? (
                  <div className="jc-form-actions">
                    <a
                      href={featuredStream.streamUrl}
                      className="jc-btn jc-btn-primary"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Watch live
                    </a>
                    <a
                      href={featuredStream.streamUrl}
                      className="jc-btn jc-btn-secondary"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open source link
                    </a>
                  </div>
                ) : (
                  <p className="jc-muted">This is an in-app livestream. Join the live discussion to comment.</p>
                )}
              </>
            ) : (
              <div className="jc-empty-state">
                No livestream has been published yet. Once a stream is created, this area becomes the featured viewing
                space.
              </div>
            )}
          </article>

          <aside className="jc-col-4 jc-sidebar-stack">
            {isFeaturedLive && featuredStreamId ? (
              <article className="jc-card">
                <p className="jc-card-kicker">Live discussion</p>
                <div style={{ height: '420px' }}>
                  <LiveChatComponent streamId={featuredStreamId} />
                </div>
              </article>
            ) : null}
            {isLoggedIn ? (
              <article id="livestream-create" className="jc-card jc-card--accent">
                <p className="jc-card-kicker">Publish stream</p>
                <h2 className="jc-section-title">Add a livestream</h2>
                <form className="jc-form" onSubmit={onSubmit}>
                  <label className="jc-form-field" htmlFor="livestream-title">
                    <div className="jc-form-field-header">
                      <strong>Title</strong>
                      <span className="jc-input-hint">Use a title that explains the event or investigation clearly.</span>
                    </div>
                    <input id="livestream-title" name="title" required placeholder="Town hall on project delivery" />
                  </label>

                  <label className="jc-form-field" htmlFor="livestream-description">
                    <div className="jc-form-field-header">
                      <strong>Description</strong>
                      <span className="jc-input-hint">Give viewers context before they click through to watch.</span>
                    </div>
                    <textarea
                      id="livestream-description"
                      name="description"
                      placeholder="Explain what is being covered and why it matters."
                    />
                  </label>

                  <label className="jc-form-field" htmlFor="livestream-url">
                    <div className="jc-form-field-header">
                      <strong>Stream URL</strong>
                      <span className="jc-input-hint">Paste the public YouTube, Vimeo, or external stream link.</span>
                    </div>
                    <input id="livestream-url" name="streamUrl" type="url" required placeholder="https://..." />
                  </label>

                  <label className="jc-form-field" htmlFor="livestream-status">
                    <div className="jc-form-field-header">
                      <strong>Status</strong>
                      <span className="jc-input-hint">Mark whether the stream is active or scheduled.</span>
                    </div>
                    <select id="livestream-status" name="status" defaultValue="active">
                      <option value="active">Active</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </label>

                  {successMessage ? <p className="jc-alert jc-alert-success">{successMessage}</p> : null}
                  {submitError ? <p className="jc-alert jc-alert-error">{submitError}</p> : null}

                  <button type="submit" className="jc-btn jc-btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Publishing...' : 'Publish livestream'}
                  </button>
                </form>
              </article>
            ) : (
              <article className="jc-card jc-card--accent">
                <p className="jc-card-kicker">Publish access</p>
                <h2 className="jc-section-title">Login to publish a stream</h2>
                <p className="jc-muted">
                  Viewing can stay public, but creating a livestream entry requires an authenticated workspace.
                </p>
                <div className="jc-form-actions">
                  <Link to="/login" className="jc-btn jc-btn-primary">
                    Login
                  </Link>
                  <Link to="/signup" className="jc-btn jc-btn-secondary">
                    Create account
                  </Link>
                </div>
              </article>
            )}

            <article className="jc-card">
              <p className="jc-card-kicker">Publishing checklist</p>
              <ul className="jc-checklist">
                {publishingChecklist.map((item, index) => (
                  <li key={item}>
                    <span className="jc-check-badge">{index + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="jc-card">
              <p className="jc-card-kicker">How it works</p>
              <ol className="jc-timeline">
                {publishingFlow.map((item, index) => (
                  <li key={item}>
                    <span className="jc-timeline-step">{index + 1}</span>
                    <div className="jc-timeline-text">{item}</div>
                  </li>
                ))}
              </ol>
            </article>
          </aside>

          <article className="jc-card jc-col-12">
            <p className="jc-card-kicker">Stream library</p>
            <h2 className="jc-section-title">Available livestreams</h2>
            {isLoading ? <p className="jc-alert jc-alert-info">Loading livestreams...</p> : null}
            {error ? <p className="jc-alert jc-alert-error">{error}</p> : null}
            {!isLoading && !error && streams.length === 0 ? (
              <div className="jc-empty-state">No livestreams yet. Publish the first one from the stream form.</div>
            ) : null}

            <div className="jc-grid">
              {streams.map((stream) => (
                <article key={stream.id} className="jc-card jc-col-4">
                  <div className="jc-meta-row">
                    <span className={getStatusTone(stream.status)}>{stream.status ?? 'active'}</span>
                    <span className="jc-muted">{formatDate(stream.createdAt)}</span>
                  </div>
                  <h3 className="jc-card-title">{stream.title}</h3>
                  <p className="jc-muted">
                    {stream.description || 'No description provided. Open the stream link to view the broadcast.'}
                  </p>
                  {stream.streamUrl ? (
                    <>
                      <p className="jc-muted" style={{ wordBreak: 'break-word' }}>
                        {stream.streamUrl}
                      </p>
                      <a href={stream.streamUrl} className="jc-btn jc-btn-primary" target="_blank" rel="noreferrer">
                        Watch stream
                      </a>
                    </>
                  ) : (
                    <p className="jc-muted">In-app livestream (no external URL).</p>
                  )}
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}

export default LiveStreamsPage
