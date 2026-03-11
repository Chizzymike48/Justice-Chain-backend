import { FC, ReactNode } from 'react'

export interface PageHeaderMetric {
  label: string
  value: string
  tone?: 'brand' | 'info' | 'success' | 'neutral'
}

interface PageHeaderProps {
  eyebrow?: string
  title: string
  subtitle: string
  actions?: ReactNode
  metrics?: PageHeaderMetric[]
}

const PageHeader: FC<PageHeaderProps> = ({ eyebrow, title, subtitle, actions, metrics = [] }) => {
  return (
    <header className="jc-page-header">
      <div className="jc-page-header-copy">
        {eyebrow ? <p className="jc-eyebrow">{eyebrow}</p> : null}
        <div>
          <h1>{title}</h1>
          <p className="jc-subtitle jc-subtitle-lg">{subtitle}</p>
        </div>
        {actions ? <div className="jc-page-header-actions">{actions}</div> : null}
      </div>

      {metrics.length > 0 ? (
        <div className="jc-page-header-metrics">
          {metrics.map((metric) => (
            <article
              key={`${metric.label}-${metric.value}`}
              className={`jc-header-stat jc-header-stat--${metric.tone ?? 'neutral'}`}
            >
              <span className="jc-header-stat-label">{metric.label}</span>
              <strong className="jc-header-stat-value">{metric.value}</strong>
            </article>
          ))}
        </div>
      ) : null}
    </header>
  )
}

export default PageHeader
