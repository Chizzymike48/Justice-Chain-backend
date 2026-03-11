import { FC, useEffect, useState } from 'react'
import analyticsService, { DistrictPerformanceRecord } from '../services/analyticsService'

const AnalyticsPage: FC = () => {
  const [districtPerformance, setDistrictPerformance] = useState<DistrictPerformanceRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        setError(null)
        const response = await analyticsService.getAnalytics()
        setDistrictPerformance(response.districtPerformance)
      } catch {
        setError('Unable to load analytics data.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  return (
    <div className="jc-shell">
      <section className="jc-page">
        <h1>Governance Analytics</h1>
        <p className="jc-subtitle">
          A quick visual summary of district delivery and anomaly exposure across tracked projects.
        </p>
        {isLoading ? <p>Loading analytics...</p> : null}
        {error ? <p style={{ color: '#8f1f16' }}>{error}</p> : null}
        {!isLoading && !error && districtPerformance.length === 0 ? (
          <p>No project analytics yet. Add projects first to see district trends.</p>
        ) : null}
        <div className="jc-grid">
          <article className="jc-card jc-col-8">
            <h3 style={{ marginBottom: '0.85rem' }}>Completion Trend</h3>
            <ul className="jc-list">
              {districtPerformance.map((item) => (
                <li key={item.district}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span>{item.district}</span>
                    <span>{item.completionRate}%</span>
                  </div>
                  <div className="jc-progress">
                    <span style={{ width: `${item.completionRate}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </article>
          <article className="jc-card jc-col-4">
            <h3 style={{ marginBottom: '0.85rem' }}>Anomaly Score</h3>
            <ul className="jc-list">
              {districtPerformance.map((item) => (
                <li key={`${item.district}-anomaly`} className="jc-list-item">
                  <strong>{item.district}</strong>: {item.anomalyScore}/100 risk index
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </div>
  )
}

export default AnalyticsPage
