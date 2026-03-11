import { FC, useState } from 'react'

interface GoLiveButtonProps {
  onLiveStart?: (streamData: { title: string; caseId?: string }) => void
}

const GoLiveButton: FC<GoLiveButtonProps> = ({ onLiveStart }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [caseId, setCaseId] = useState('')

  const handleStartStream = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('Please enter a stream title')
      return
    }

    onLiveStart?.({ title, caseId })
    setIsModalOpen(false)
    setTitle('')
    setCaseId('')
  }

  return (
    <>
      <button
        className="jc-btn jc-btn-primary"
        onClick={() => setIsModalOpen(true)}
        style={{
          backgroundColor: '#ff0000',
          borderColor: '#cc0000',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '18px' }}>●</span> Go Live
      </button>

      {isModalOpen && (
        <div className="jc-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="jc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="jc-modal-header">
              <h2>Start a Livestream</h2>
              <button
                className="jc-modal-close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleStartStream} className="jc-form">
              <label className="jc-form-field">
                <strong>Stream Title</strong>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Live Investigation at Town Hall"
                  required
                />
              </label>

              <label className="jc-form-field">
                <strong>Related Case ID (Optional)</strong>
                <input
                  type="text"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  placeholder="Enter case ID if related to a report"
                />
              </label>

              <div className="jc-form-actions">
                <button type="submit" className="jc-btn jc-btn-primary">
                  Start Streaming
                </button>
                <button
                  type="button"
                  className="jc-btn jc-btn-ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .jc-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .jc-modal {
          background: white;
          border-radius: 8px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .jc-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .jc-modal-close {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #666;
        }
      `}</style>
    </>
  )
}

export default GoLiveButton
