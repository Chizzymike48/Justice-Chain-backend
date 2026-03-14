import { FC, ReactNode, useRef, useState } from 'react'
import { HelpCircle, Info, AlertCircle } from 'lucide-react'
import '../../styles/help-components.css'

interface TooltipProps {
  text: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export const Tooltip: FC<TooltipProps> = ({ text, children, position = 'top', delay = 200 }) => {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(false)
  }

  return (
    <div className={`tooltip-wrapper tooltip-${position}`} onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
      {children}
      {isVisible && <div className="tooltip-content">{text}</div>}
    </div>
  )
}

interface HelpIconProps {
  title: string
  description: string | string[]
}

export const HelpIcon: FC<HelpIconProps> = ({ title, description }) => {
  const [isOpen, setIsOpen] = useState(false)

  const descArray = Array.isArray(description) ? description : [description]

  return (
    <div className="help-icon-container">
      <button
        className="help-icon-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={title}
        aria-label={`Help: ${title}`}
      >
        <HelpCircle size={18} />
      </button>

      {isOpen && (
        <div className="help-icon-popup">
          <div className="help-icon-header">
            <h4>{title}</h4>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>
          <div className="help-icon-content">
            {descArray.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface ContextualHelpProps {
  title: string
  children: ReactNode
  type?: 'info' | 'warning' | 'tip'
}

export const ContextualHelp: FC<ContextualHelpProps> = ({ title, children, type = 'info' }) => {
  const icons = {
    info: <Info size={20} />,
    warning: <AlertCircle size={20} />,
    tip: <HelpCircle size={20} />,
  }

  return (
    <div className={`contextual-help help-${type}`}>
      <div className="contextual-help-title">
        {icons[type]}
        <strong>{title}</strong>
      </div>
      <div className="contextual-help-content">{children}</div>
    </div>
  )
}

interface GuidestepProps {
  number: number | string
  title: string
  description: string
  tips?: string[]
}

export const GuideStep: FC<GuidestepProps> = ({ number, title, description, tips }) => {
  return (
    <div className="guide-step">
      <div className="step-badge">{number}</div>
      <div className="step-content">
        <h4>{title}</h4>
        <p>{description}</p>
        {tips && tips.length > 0 && (
          <div className="step-tips">
            {tips.map((tip, i) => (
              <div key={i} className="step-tip">
                💡 {tip}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface InlineHelpProps {
  label: string
  help: string
}

export const InlineHelp: FC<InlineHelpProps> = ({ label, help }) => {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className="inline-help-wrapper">
      <label>
        {label}
        <button
          className="inline-help-toggle"
          onClick={() => setShowHelp(!showHelp)}
          aria-label={`Help about ${label}`}
        >
          ?
        </button>
      </label>
      {showHelp && <div className="inline-help-text">{help}</div>}
    </div>
  )
}

export default {
  Tooltip,
  HelpIcon,
  ContextualHelp,
  GuideStep,
  InlineHelp,
}
