import { FC, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLocation } from 'react-router-dom'
import LiveStreamingComponent from './LiveStreamingComponent'
import { HelpIcon, ContextualHelp } from '../common/HelpComponents'

const FloatingGoLiveButton: FC = () => {
  const { isLoggedIn } = useAuth()
  const location = useLocation()
  const [isLiveStreaming, setIsLiveStreaming] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [showHelpTip, setShowHelpTip] = useState(false)

  // Determine if we're on evidence upload page
  const isEvidenceUploadPage = location.pathname === '/evidence-upload'

  // Show camera when streaming
  if (isLiveStreaming && title) {
    return <LiveStreamingComponent streamTitle={title} onClose={() => {
      setIsLiveStreaming(false)
      setTitle('')
      setShowModal(false)
    }} />
  }

  // Don't show button if not logged in
  if (!isLoggedIn) return null

  // Show button on evidence upload page or when user clicks the main Go Live button
  if (!isEvidenceUploadPage) return null

  const handleQuickStart = () => {
    if (title.trim()) {
      setIsLiveStreaming(true)
      setShowModal(false)
    } else {
      alert('Please enter a stream title')
    }
  }

  // Emergency presets - one click to start
  const emergencyPresets = [
    { label: '🚨 Emergency (Auto)', value: `Emergency - ${new Date().toLocaleTimeString()}` },
    { label: '🔪 Robbery in Progress', value: 'Robbery in Progress' },
    { label: '⚠️ Sexual Assault', value: 'Sexual Assault Incident' },
    { label: '💥 Violence/Attack', value: 'Violence - Immediate Help Needed' },
    { label: '👮 Police Abuse', value: 'Police Abuse/Misconduct' },
    { label: '💰 Bribery/Corruption', value: 'Bribery/Corruption Incident' },
  ]

  const handleEmergencyStart = (presetValue: string) => {
    setTitle(presetValue)
    setIsLiveStreaming(true)
    setShowModal(false)
  }

  return (
    <>
      {/* Floating Button with Help Tooltip */}
      <button
        onClick={() => {
          setShowModal(true)
          setShowHelpTip(false)
        }}
        onMouseEnter={() => setShowHelpTip(true)}
        onMouseLeave={() => setShowHelpTip(false)}
        className="jc-floating-go-live"
        title="Click to start recording immediately - Captures live evidence in real-time"
      >
        <span className="jc-pulse">●</span> Go Live
        {showHelpTip && (
          <div className="help-tooltip">
            Record evidence in real-time. One click to start.
            <br />
            <small>Pre-made templates for common incidents</small>
          </div>
        )}
      </button>

      {/* Quick Modal with Enhanced Help */}
      {showModal && (
        <div className="jc-quick-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="jc-quick-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Start Recording Now</h3>
              <HelpIcon
                title="Live Recording"
                description={[
                  'Quickly capture evidence of incidents as they happen',
                  'Choose a pre-filled template or describe in your own words',
                  'Stream is encrypted & only you can see it initially',
                  'Moderators review within 24-48 hours',
                ]}
              />
            </div>

            {/* Safety Notice */}
            <ContextualHelp type="warning" title="Safety First">
              Never record in dangerous situations. Your safety is more important than evidence. Record
              from a safe distance and location.
            </ContextualHelp>

            {/* Emergency Quick Buttons */}
            <div className="jc-emergency-buttons">
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                <strong>Emergency Situations - One Click:</strong>
              </p>
              {emergencyPresets.map((preset) => (
                <button
                  key={preset.value}
                  className="jc-emergency-btn"
                  onClick={() => handleEmergencyStart(preset.value)}
                  title={`Quick start: ${preset.label}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div style={{ margin: '15px 0', textAlign: 'center', color: '#999', fontSize: '12px' }}>
              ─── OR ───
            </div>

            {/* Custom Title Input with Help */}
            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                <strong>Custom Description:</strong>
              </p>
              <input
                type="text"
                placeholder="Be specific: what, where, who? (e.g., illegal dumping at Market Square)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleQuickStart()}
                autoFocus
              />
              <small style={{ color: '#999', marginTop: '5px', display: 'block' }}>
                💡 Tip: Include location, time, and who is involved for maximum impact
              </small>
            </div>

            <div className="jc-quick-modal-actions">
              <button className="jc-btn-record" onClick={handleQuickStart}>
                ● Start Recording
              </button>
              <button className="jc-btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>

            {/* Info Box */}
            <ContextualHelp type="info" title="What Happens Next">
              Your stream is saved securely. Moderators verify it within 24-48 hours. Once approved,
              you control who sees it - can be private (only you) or public (everyone).
            </ContextualHelp>
          </div>
        </div>
      )}

      <style>{`
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .modal-header h3 {
          margin: 0;
        }

        .help-tooltip {
          position: absolute;
          bottom: 60px;
          right: 0;
          background: #333;
          color: white;
          padding: 0.8rem;
          border-radius: 6px;
          font-size: 0.85rem;
          white-space: nowrap;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .help-tooltip small {
          display: block;
          opacity: 0.8;
          margin-top: 0.4rem;
        }
      `}</style>

      <style>{`
        .jc-floating-go-live {
          position: fixed;
          bottom: 30px;
          right: 30px;
          background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%);
          color: white;
          border: none;
          padding: 16px 24px;
          border-radius: 50px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          z-index: 999;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(255, 0, 0, 0.4);
          transition: all 0.3s;
        }

        .jc-floating-go-live:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(255, 0, 0, 0.6);
        }

        .jc-floating-go-live:active {
          transform: scale(0.98);
        }

        .jc-pulse {
          animation: pulse 1s infinite;
          display: inline-block;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .jc-quick-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .jc-quick-modal {
          background: white;
          border-radius: 12px;
          padding: 30px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          max-height: 90vh;
          overflow-y: auto;
        }

        .jc-emergency-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .jc-emergency-btn {
          padding: 12px 16px;
          background: linear-gradient(135deg, #ff4444, #dd0000);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
          text-align: left;
        }

        .jc-emergency-btn:hover {
          background: linear-gradient(135deg, #ff6666, #ff0000);
          transform: translateX(2px);
        }

        .jc-emergency-btn:active {
          transform: translateX(0);
        }

        .jc-quick-modal h3 {
          margin: 0 0 20px 0;
          font-size: 20px;
          color: #333;
        }

        .jc-quick-modal input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 20px;
          box-sizing: border-box;
          font-family: inherit;
        }

        .jc-quick-modal input:focus {
          outline: none;
          border-color: #ff0000;
          box-shadow: 0 0 0 3px rgba(255, 0, 0, 0.1);
        }

        .jc-quick-modal-actions {
          display: flex;
          gap: 10px;
        }

        .jc-btn-record {
          flex: 1;
          padding: 12px 20px;
          background: #ff0000;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .jc-btn-record:hover {
          background: #cc0000;
        }

        .jc-btn-cancel {
          flex: 1;
          padding: 12px 20px;
          background: #f0f0f0;
          color: #333;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .jc-btn-cancel:hover {
          background: #e0e0e0;
        }

        @media (max-width: 480px) {
          .jc-floating-go-live {
            bottom: 20px;
            right: 20px;
            padding: 12px 16px;
            font-size: 14px;
          }

          .jc-quick-modal {
            width: 95%;
            padding: 20px;
          }
        }
      `}</style>
    </>
  )
}

export default FloatingGoLiveButton
