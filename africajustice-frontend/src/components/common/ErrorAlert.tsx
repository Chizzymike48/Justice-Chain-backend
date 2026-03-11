import { FC, ReactNode } from 'react'

interface ErrorAlertProps {
  message: string
  onDismiss?: () => void
  details?: string
  children?: ReactNode
}

/**
 * ErrorAlert - Displays an error message with optional dismiss button
 * Used for form submission errors, API failures, etc.
 */
const ErrorAlert: FC<ErrorAlertProps> = ({ message, onDismiss, details, children }) => {
  return (
    <div
      style={{
        backgroundColor: '#fce4ec',
        border: '1px solid #f48fb1',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1rem',
        color: '#8f1f16',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>⚠️ {message}</p>
          {details ? <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: '0.85' }}>{details}</p> : null}
          {children}
        </div>
        {onDismiss ? (
          <button
            onClick={onDismiss}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#8f1f16',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '0',
              marginLeft: '1rem',
            }}
          >
            ✕
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default ErrorAlert
