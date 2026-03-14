import { FC } from 'react'

interface LoadingSpinnerProps {
  message?: string
  fullScreen?: boolean
}

/**
 * LoadingSpinner - Displays a centered loading indicator
 * Can be used inline or full-screen
 */
const LoadingSpinner: FC<LoadingSpinnerProps> = ({ message = 'Loading...', fullScreen = false }) => {
  const containerStyle: React.CSSProperties = fullScreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 9999,
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        gap: '1rem',
      }

  return (
    <div style={containerStyle}>
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e0e0e0',
          borderTop: '4px solid #1f1f1f',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p style={{ fontSize: '0.9rem', color: '#666' }}>{message}</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default LoadingSpinner
