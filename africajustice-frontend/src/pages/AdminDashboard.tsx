import { FC, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import type { AdminDashboard } from '../services/adminService'
import adminService from '../services/adminService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'
import { useSocket, SOCKET_EVENTS } from '../hooks/useSocket'

const emptyDashboard: AdminDashboard = {
  reports: { total: 0, pending: 0 },
  verifications: { total: 0, pending: 0 },
  evidence: { total: 0 },
  users: { total: 0, admins: 0, moderators: 0 },
  lastUpdated: new Date().toISOString(),
}

const AdminDashboard: FC = () => {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState<AdminDashboard>(emptyDashboard)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isAdmin = user?.role === 'admin'
  const { on } = useSocket({ enabled: isAdmin })

  const loadDashboard = async (): Promise<void> => {
    try {
      setError(null)
      const data = await adminService.getDashboard()
      setDashboard(data)
    } catch {
      setError('Failed to load admin dashboard.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) return
    void loadDashboard()
  }, [isAdmin])

  // Listen for real-time queue refresh events
  useEffect(() => {
    if (!isAdmin) return
    const unsubscribe = on(SOCKET_EVENTS.QUEUE_REFRESH, () => {
      void loadDashboard()
    })

    return unsubscribe
  }, [on, isAdmin])

  // Redirect non-admins
  if (user && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading admin dashboard..." fullScreen={false} />
  }

  return (
    <div className="jc-shell">
      <section className="jc-page">
        <h1>Admin Dashboard</h1>
        <p className="jc-subtitle">Platform overview and moderation queue.</p>

        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

        <div className="jc-grid">
          {/* Reports Stats */}
          <article className="jc-card jc-col-3">
            <p style={{ color: 'var(--jc-ink-soft)', fontSize: '0.88rem' }}>Total Reports</p>
            <p className="jc-kpi">{dashboard.reports.total}</p>
            <p style={{ color: '#d32f2f', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              {dashboard.reports.pending} pending
            </p>
          </article>

          {/* Verifications Stats */}
          <article className="jc-card jc-col-3">
            <p style={{ color: 'var(--jc-ink-soft)', fontSize: '0.88rem' }}>Verifications</p>
            <p className="jc-kpi">{dashboard.verifications.total}</p>
            <p style={{ color: '#d32f2f', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              {dashboard.verifications.pending} pending
            </p>
          </article>

          {/* Evidence Stats */}
          <article className="jc-card jc-col-3">
            <p style={{ color: 'var(--jc-ink-soft)', fontSize: '0.88rem' }}>Evidence Files</p>
            <p className="jc-kpi">{dashboard.evidence.total}</p>
            <p style={{ color: 'var(--jc-ink-soft)', fontSize: '0.86rem', marginTop: '0.5rem' }}>Files stored</p>
          </article>

          {/* Users Stats */}
          <article className="jc-card jc-col-3">
            <p style={{ color: 'var(--jc-ink-soft)', fontSize: '0.88rem' }}>Total Users</p>
            <p className="jc-kpi">{dashboard.users.total}</p>
            <p style={{ color: 'var(--jc-ink-soft)', fontSize: '0.86rem', marginTop: '0.5rem' }}>
              {dashboard.users.admins} admins, {dashboard.users.moderators} mods
            </p>
          </article>

          {/* Moderation Queue */}
          <article className="jc-card jc-col-12">
            <h3 style={{ marginBottom: '1rem' }}>Moderation Queue</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#fff3e0',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '2rem', margin: '0.5rem 0', color: '#e65100' }}>
                  {dashboard.reports.pending}
                </p>
                <p style={{ color: '#666', margin: 0 }}>Reports to Review</p>
                <a href="/admin/reports" style={{ color: '#1f1f1f', textDecoration: 'underline', display: 'block', marginTop: '0.5rem' }}>
                  View →
                </a>
              </div>

              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '2rem', margin: '0.5rem 0', color: '#1565c0' }}>
                  {dashboard.verifications.pending}
                </p>
                <p style={{ color: '#666', margin: 0 }}>Verifications to Review</p>
                <a href="/admin/verifications" style={{ color: '#1f1f1f', textDecoration: 'underline', display: 'block', marginTop: '0.5rem' }}>
                  View →
                </a>
              </div>

              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#f3e5f5',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '2rem', margin: '0.5rem 0', color: '#6a1b9a' }}>
                  Evidence
                </p>
                <p style={{ color: '#666', margin: 0 }}>Files to Review</p>
                <a href="/admin/evidence" style={{ color: '#1f1f1f', textDecoration: 'underline', display: 'block', marginTop: '0.5rem' }}>
                  View →
                </a>
              </div>
            </div>
          </article>

          {/* Admin Tools */}
          <article className="jc-card jc-col-12">
            <h3 style={{ marginBottom: '1rem' }}>Admin Tools</h3>
            <ul className="jc-list">
              <li className="jc-list-item">
                <a href="/admin/users">Manage Users & Roles</a>
              </li>
              <li className="jc-list-item">
                <a href="/admin/logs">View Audit Logs</a>
              </li>
              <li className="jc-list-item">
                <a href="/analytics">Platform Analytics</a>
              </li>
            </ul>
          </article>
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
