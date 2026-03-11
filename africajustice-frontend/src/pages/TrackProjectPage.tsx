import { FC, useEffect, useState } from 'react'
import projectsService, { ProjectRecord } from '../services/projectsService'

const formatDate = (value?: string): string => {
  if (!value) {
    return 'Unknown date'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date'
  }

  return date.toLocaleDateString()
}

const TrackProjectPage: FC = () => {
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        setError(null)
        const data = await projectsService.getProjects()
        setProjects(data)
      } catch {
        setError('Unable to load tracked projects.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  return (
    <div className="jc-shell">
      <section className="jc-page">
        <h1>Track Project Milestones</h1>
        <p className="jc-subtitle">
          Follow each project from budget authorization to final inspection and citizen handover.
        </p>

        {isLoading ? <p>Loading tracked projects...</p> : null}
        {error ? <p style={{ color: '#8f1f16' }}>{error}</p> : null}

        <div className="jc-card">
          <ul className="jc-list">
            {projects.length === 0 ? <li className="jc-list-item">No tracked projects yet.</li> : null}
            {projects.map((project) => (
              <li key={project.id} className="jc-list-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.7rem', flexWrap: 'wrap' }}>
                  <strong>{project.title}</strong>
                  <span>{formatDate(project.createdAt)}</span>
                </div>
                <p style={{ color: 'var(--jc-ink-soft)', marginTop: '0.25rem' }}>
                  Status: {project.status || 'pending'} | Progress: {project.progress || 0}%
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

export default TrackProjectPage
