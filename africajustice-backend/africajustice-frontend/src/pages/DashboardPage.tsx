import { FC, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/common/PageHeader'
import { useAuth } from '../context/AuthContext'
import analyticsService, { DashboardMetrics } from '../services/analyticsService'

const emptyMetrics: DashboardMetrics = {
  openReports: 0,
  projectsTracked: 0,
  verifiedClaims: 0,
  avgConfidence: 0,
  alerts: [],
}

const DashboardPage: FC = () => {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        setError(null)
        const response = await analyticsService.getDashboardMetrics()
        setMetrics(response)
      } catch {
        setError('Unable to load dashboard metrics.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  const stats = [
    { label: 'Open reports', value: String(metrics.openReports), note: 'Items still in progress or pending review.' },
    { label: 'Projects tracked', value: String(metrics.projectsTracked), note: 'Public projects currently followed in the workspace.' },
    {
      label: 'Verified claims',
      value: String(metrics.verifiedClaims),
      note: `Average confidence level: ${metrics.avgConfidence}%`,
    },
  ]

  const quickActions = [
    {
      title: 'Submit a new corruption report',
      description: 'Move directly into the structured intake form when you need to document a case.',
      path: '/report-corruption',
      cta: 'Start report',
    },
    {
      title: 'Upload fresh evidence',
      description: 'Attach supporting files without losing the context of the case or issue.',
      path: '/evidence-upload',
      cta: 'Upload files',
    },
    {
      title: 'Verify a public claim',
      description: 'Contribute to fact-checking and validation with documents or source references.',
      path: '/verify',
      cta: 'Verify claim',
    },
  ]

  return (
    <div className="jc-shell">
      <section className="jc-page">
        <PageHeader
          eyebrow="Citizen workspace"
          title={`Welcome back, ${user?.name ?? 'Citizen'}`}
          subtitle="Your dashboard now highlights what needs attention, what is moving well, and where to act next."
          actions={
            <>
              <Link className="jc-btn jc-btn-primary" to="/report-corruption">
                Start a report
              </Link>
              <Link className="jc-btn jc-btn-ghost" to="/projects">
                Review projects
              </Link>
            </>
          }
          metrics={[
            { label: 'Open reports', value: String(metrics.openReports), tone: 'brand' },
            { label: 'Projects tracked', value: String(metrics.projectsTracked), tone: 'info' },
            { label: 'Average confidence', value: `${metrics.avgConfidence}%`, tone: 'success' },
          ]}
        />

        {isLoading ? <p className="jc-alert jc-alert-info">Loading dashboard data...</p> : null}
        {error ? <p className="jc-alert jc-alert-error">{error}</p> : null}

        <div className="jc-grid">
          {stats.map((item) => (
            <article key={item.label} className="jc-card jc-col-4">
              <p className="jc-metric-label">{item.label}</p>
              <p className="jc-kpi">{item.value}</p>
              <p className="jc-muted">{item.note}</p>
            </article>
          ))}

          <article className="jc-card jc-col-7 jc-card--accent">
            <p className="jc-card-kicker">Recommended next steps</p>
            <h2 className="jc-section-title">Keep momentum across your workflow.</h2>
            <div className="jc-grid" style={{ gap: '0.75rem' }}>
              {quickActions.map((item) => (
                <div key={item.title} className="jc-card jc-col-12" style={{ padding: '1rem' }}>
                  <h3 className="jc-card-title" style={{ fontSize: '1.02rem' }}>
                    {item.title}
                  </h3>
                  <p className="jc-muted">{item.description}</p>
                  <Link to={item.path} className="jc-btn jc-btn-primary">
                    {item.cta}
                  </Link>
                </div>
              ))}
            </div>
          </article>

          <article className="jc-card jc-col-5">
            <p className="jc-card-kicker">Priority alerts</p>
            <h2 className="jc-section-title">What needs attention now</h2>
            <ul className="jc-list">
              {metrics.alerts.length === 0 ? (
                <li className="jc-list-item">No alerts yet. New submissions and workflow updates will appear here.</li>
              ) : null}
              {metrics.alerts.map((alert) => (
                <li key={alert} className="jc-list-item">
                  {alert}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
