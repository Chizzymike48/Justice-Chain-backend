import { FC, ReactNode } from 'react'
import { AlertCircle, Lightbulb, Info } from 'lucide-react'
import '../../styles/page-guidance.css'

interface PageGuidanceProps {
  title: string
  description: string
  sections: {
    title: string
    content: string | string[]
    type?: 'tip' | 'info' | 'warning'
  }[]
  children?: ReactNode
}

export const PageGuidance: FC<PageGuidanceProps> = ({ title, description, sections, children }) => {
  const icons = {
    tip: <Lightbulb size={18} />,
    info: <Info size={18} />,
    warning: <AlertCircle size={18} />,
  }

  return (
    <div className="page-guidance-container">
      {/* Header */}
      <div className="page-guidance-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      {/* Guidance Sections */}
      <div className="page-guidance-sections">
        {sections.map((section, i) => (
          <div key={i} className={`guidance-section guidance-${section.type || 'info'}`}>
            <div className="guidance-section-header">
              {icons[section.type || 'info']}
              <h3>{section.title}</h3>
            </div>
            <div className="guidance-section-content">
              {Array.isArray(section.content) ? (
                <ul>
                  {section.content.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>{section.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      {children && <div className="page-guidance-content">{children}</div>}
    </div>
  )
}

interface QuickTipProps {
  tip: string
  icon?: 'tip' | 'info' | 'warning'
}

export const QuickTip: FC<QuickTipProps> = ({ tip, icon = 'tip' }) => {
  const icons = {
    tip: <Lightbulb size={16} />,
    info: <Info size={16} />,
    warning: <AlertCircle size={16} />,
  }

  return (
    <div className={`quick-tip quick-tip-${icon}`}>
      {icons[icon]}
      <span>{tip}</span>
    </div>
  )
}

interface StepGuideProps {
  steps: {
    number: number
    title: string
    description: string
    action?: string
  }[]
}

export const StepGuide: FC<StepGuideProps> = ({ steps }) => {
  return (
    <div className="step-guide">
      {steps.map((step, i) => (
        <div key={i} className="step-guide-item">
          <div className="step-number">{step.number}</div>
          <div className="step-details">
            <h4>{step.title}</h4>
            <p>{step.description}</p>
            {step.action && <code className="step-action">{step.action}</code>}
          </div>
          {i < steps.length - 1 && <div className="step-connector" />}
        </div>
      ))}
    </div>
  )
}

export default { PageGuidance, QuickTip, StepGuide }
