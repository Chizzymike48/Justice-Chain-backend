import { FC, useEffect, useState } from 'react'
import analyticsService, { AiEvidenceResult } from '../../services/analyticsService'

const AIEvidenceAnalysis: FC = () => {
  const [results, setResults] = useState<AiEvidenceResult[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        setError(null)
        const response = await analyticsService.getAiEvidence()
        setResults(response.results)
      } catch {
        setError('Unable to load AI evidence analysis.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  return (
    <div className="jc-shell">
      <section className="jc-page">
        <h1>AI Evidence Analysis</h1>
        <p className="jc-subtitle">Automated scoring helps prioritize strong submissions for human review.</p>

        {isLoading ? <p>Loading analysis...</p> : null}
        {error ? <p style={{ color: '#8f1f16' }}>{error}</p> : null}
        {!isLoading && !error && results.length === 0 ? (
          <p>No analysis data yet. Submit reports and verifications first.</p>
        ) : null}

        <div className="jc-grid">
          {results.map((result) => (
            <article key={result.signal} className="jc-card jc-col-4">
              <h3>{result.signal}</h3>
              <p className="jc-kpi" style={{ marginTop: '0.5rem' }}>
                {result.score}/100
              </p>
              <p style={{ marginTop: '0.55rem', color: 'var(--jc-ink-soft)' }}>{result.interpretation}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default AIEvidenceAnalysis
