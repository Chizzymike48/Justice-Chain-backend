import { FC } from 'react'

interface SuccessAlertProps {
  message: string
  onDismiss?: () => void
  details?: string
}

/**
 * SuccessAlert - Displays a success message with optional dismiss button
 * Used for successful form submissions, operations completed, etc.
 */
const SuccessAlert: FC<SuccessAlertProps> = ({ message, onDismiss, details }) => {
  return (
    <div
      style={{
        backgroundColor: '#e8f5e9',
        border: '1px solid #81c784',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1rem',
        color: '#1b5e20',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>✓ {message}</p>
          {details ? <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: '0.85' }}>{details}</p> : null}
        </div>
        {onDismiss ? (
          <button
            onClick={onDismiss}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#1b5e20',
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

export default SuccessAlert
