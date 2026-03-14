import { FC, FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/common/PageHeader'
import projectsService, { ProjectRecord } from '../services/projectsService'

const numberFormatter = new Intl.NumberFormat('en-NG')

const projectGuide = [
  'Use a clear project title and concise description.',
  'Capture the agency, location, and known budget.',
  'Set realistic progress and status values to support tracking.',
]

const projectWorkflow = [
  'New projects appear immediately in the monitoring list.',
  'Progress and status help users identify delivery risk.',
  'The tracking page can extend follow-up on important projects.',
]

const getStatusChipClass = (status?: string): string => {
  if (status === 'delayed') return 'jc-chip jc-chip--danger'
  if (status === 'at_risk') return 'jc-chip jc-chip--warning'
  return 'jc-chip'
}

const getStatusLabel = (status?: string): string => {
  if (status === 'at_risk') return 'At risk'
  if (status === 'delayed') return 'Delayed'
  if (status === 'on_track') return 'On track'
  return 'Pending'
}

const ProjectsPage: FC = () => {
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        setError(null)
        const data = await projectsService.getProjects()
        setProjects(data)
      } catch {
        setError('Unable to load projects.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const payload = {
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? ''),
      budget: Number(formData.get('budget') ?? 0),
      agency: String(formData.get('agency') ?? ''),
      location: String(formData.get('location') ?? ''),
      progress: Number(formData.get('progress') ?? 0),
      status: String(formData.get('status') ?? 'on_track'),
    }

    try {
      const created = await projectsService.createProject(payload)
      setProjects((prev) => [created, ...prev])
      event.currentTarget.reset()
    } catch {
      setSubmitError('Unable to create project.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onTrackCount = projects.filter((project) => project.status === 'on_track').length
  const riskCount = projects.filter((project) => project.status === 'at_risk' || project.status === 'delayed').length
  const averageProgress =
    projects.length > 0
      ? Math.round(projects.reduce((sum, project) => sum + (project.progress ?? 0), 0) / projects.length)
      : 0

  return (
    <div className="jc-shell">
      <section className="jc-page">
        <PageHeader
          eyebrow="Project oversight"
          title="Monitor public projects"
          subtitle="Track implementation, delivery pressure, and execution risk with a cleaner layout for both intake and monitoring."
          actions={
            <>
              <Link to="/track-projects" className="jc-btn jc-btn-primary">
                Open tracking page
              </Link>
              <Link to="/dashboard" className="jc-btn jc-btn-ghost">
                Return to dashboard
              </Link>
            </>
          }
          metrics={[
            { label: 'Projects listed', value: String(projects.length), tone: 'brand' },
            { label: 'On track', value: String(onTrackCount), tone: 'success' },
            { label: 'Average progress', value: `${averageProgress}%`, tone: 'info' },
          ]}
        />

        <div className="jc-grid">
          <article className="jc-card jc-col-7">
            <p className="jc-card-kicker">Project intake</p>
            <h2 className="jc-section-title">Add a project for tracking</h2>
            <form className="jc-form" onSubmit={onSubmit}>
              <label className="jc-form-field" htmlFor="project-title">
                <div className="jc-form-field-header">
                  <strong>Title</strong>
                  <span className="jc-input-hint">Name the project in a way people can recognize quickly.</span>
                </div>
                <input id="project-title" name="title" required />
              </label>

              <label className="jc-form-field" htmlFor="project-description">
                <div className="jc-form-field-header">
                  <strong>Description</strong>
                  <span className="jc-input-hint">Summarize the project scope, intended outcome, and context.</span>
                </div>
                <textarea id="project-description" name="description" required />
              </label>

              <div className="jc-form-row">
                <label className="jc-form-field" htmlFor="project-budget">
                  <div className="jc-form-field-header">
                    <strong>Budget</strong>
                    <span className="jc-input-hint">Use a numeric value for easier comparison across projects.</span>
                  </div>
                  <input id="project-budget" name="budget" type="number" min={0} required />
                </label>

                <label className="jc-form-field" htmlFor="project-agency">
                  <div className="jc-form-field-header">
                    <strong>Agency</strong>
                    <span className="jc-input-hint">Record the main office or implementing authority.</span>
                  </div>
                  <input id="project-agency" name="agency" required />
                </label>
              </div>

              <div className="jc-form-row">
                <label className="jc-form-field" htmlFor="project-location">
                  <div className="jc-form-field-header">
                    <strong>Location</strong>
                    <span className="jc-input-hint">Optional, but useful for geographically distributed tracking.</span>
                  </div>
                  <input id="project-location" name="location" />
                </label>

                <label className="jc-form-field" htmlFor="project-progress">
                  <div className="jc-form-field-header">
                    <strong>Progress</strong>
                    <span className="jc-input-hint">Set a current completion estimate from 0 to 100.</span>
                  </div>
                  <input id="project-progress" name="progress" type="number" min={0} max={100} />
                </label>
              </div>

              <label className="jc-form-field" htmlFor="project-status">
                <div className="jc-form-field-header">
                  <strong>Status</strong>
                  <span className="jc-input-hint">Use a status that matches the delivery risk of the project.</span>
                </div>
                <select id="project-status" name="status" defaultValue="on_track">
                  <option value="on_track">On track</option>
                  <option value="at_risk">At risk</option>
                  <option value="delayed">Delayed</option>
                </select>
              </label>

              {submitError ? <p className="jc-alert jc-alert-error">{submitError}</p> : null}

              <div className="jc-form-actions">
                <button className="jc-btn jc-btn-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Create project'}
                </button>
                <Link to="/track-projects" className="jc-btn jc-btn-secondary">
                  Go to tracked projects
                </Link>
              </div>
            </form>
          </article>

          <aside className="jc-col-5 jc-sidebar-stack">
            <article className="jc-card jc-card--info">
              <p className="jc-card-kicker">Oversight checklist</p>
              <ul className="jc-checklist">
                {projectGuide.map((item, index) => (
                  <li key={item}>
                    <span className="jc-check-badge">{index + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="jc-card">
              <p className="jc-card-kicker">Monitoring snapshot</p>
              <div className="jc-grid" style={{ gap: '0.75rem' }}>
                <div className="jc-card jc-col-6" style={{ padding: '1rem' }}>
                  <span className="jc-metric-label">Projects at risk</span>
                  <strong className="jc-kpi">{riskCount}</strong>
                </div>
                <div className="jc-card jc-col-6" style={{ padding: '1rem' }}>
                  <span className="jc-metric-label">Average progress</span>
                  <strong className="jc-kpi">{averageProgress}%</strong>
                </div>
              </div>
              <ol className="jc-timeline">
                {projectWorkflow.map((item, index) => (
                  <li key={item}>
                    <span className="jc-timeline-step">{index + 1}</span>
                    <div className="jc-timeline-text">{item}</div>
                  </li>
                ))}
              </ol>
            </article>
          </aside>

          <article className="jc-card jc-col-12">
            <p className="jc-card-kicker">Project list</p>
            <h2 className="jc-section-title">Current monitoring view</h2>
            {isLoading ? <p className="jc-alert jc-alert-info">Loading projects...</p> : null}
            {error ? <p className="jc-alert jc-alert-error">{error}</p> : null}
            {!isLoading && !error && projects.length === 0 ? (
              <div className="jc-empty-state">No projects yet. Add your first project above.</div>
            ) : null}

            <div className="jc-grid">
              {projects.map((project) => (
                <article key={project.id} className="jc-card jc-col-4">
                  <h3 className="jc-card-title">{project.title}</h3>
                  <p className="jc-muted">{project.description}</p>
                  <p className="jc-muted">
                    {project.location || 'Unknown location'} | {project.agency}
                  </p>
                  <p className="jc-muted">Budget: {numberFormatter.format(project.budget || 0)}</p>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span>Progress</span>
                      <span>{project.progress || 0}%</span>
                    </div>
                    <div className="jc-progress">
                      <span style={{ width: `${project.progress || 0}%` }} />
                    </div>
                  </div>
                  <p>
                    <span className={getStatusChipClass(project.status)}>{getStatusLabel(project.status)}</span>
                  </p>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}

export default ProjectsPage
