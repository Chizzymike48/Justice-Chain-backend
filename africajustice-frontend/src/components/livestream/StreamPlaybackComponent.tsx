import { FC, useEffect, useRef, useState } from 'react'
import api from '../../services/api'

interface RecordingData {
  id: string
  streamId: string
  title: string
  description?: string
  recordingPath: string
  thumbnailPath?: string
  duration: number
  quality: 'low' | 'medium' | 'high'
  viewerCount: number
  peakViewers: number
  startedAt: string
  endedAt: string
}

const StreamPlaybackComponent: FC<{ streamId: string }> = ({ streamId }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [recording, setRecording] = useState<RecordingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('high')
  const [currentTime, setCurrentTime] = useState(0)
  const [filteredWidth, setFilteredWidth] = useState<number | undefined>(undefined)

  useEffect(() => {
    const loadRecording = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await api.get(`/recordings/${streamId}`)
        setRecording(response.data.data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load recording'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    loadRecording()
  }, [streamId])

  const handleQualityChange = (newQuality: 'low' | 'medium' | 'high') => {
    setQuality(newQuality)
    // Apply quality filters
    if (videoRef.current) {
      if (newQuality === 'low') {
        setFilteredWidth(480)
        videoRef.current.style.filter = 'blur(2px)'
      } else if (newQuality === 'medium') {
        setFilteredWidth(720)
        videoRef.current.style.filter = 'blur(0px)'
      } else {
        setFilteredWidth(undefined)
        videoRef.current.style.filter = 'blur(0px)'
      }
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return [hours, minutes, secs].map((v) => v.toString().padStart(2, '0')).join(':')
  }

  if (isLoading) {
    return (
      <div className="jc-playback-container">
        <div className="jc-playback-loading">Loading recording...</div>
      </div>
    )
  }

  if (error || !recording) {
    return (
      <div className="jc-playback-container">
        <div className="jc-playback-error">
          {error ? `Error: ${error}` : 'Recording not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="jc-playback-container">
      <style>{`
        .jc-playback-container {
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          max-width: 100%;
        }

        .jc-playback-video-wrapper {
          position: relative;
          background: #000;
          aspect-ratio: 16 / 9;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .jc-playback-video {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .jc-playback-controls {
          background: #1a1a1a;
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          color: white;
        }

        .jc-playback-progress {
          width: 100%;
          height: 6px;
          background: #333;
          border-radius: 3px;
          cursor: pointer;
          position: relative;
        }

        .jc-playback-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #ff0000, #cc0000);
          border-radius: 3px;
          transition: width 0.1s;
        }

        .jc-playback-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          color: #aaa;
        }

        .jc-playback-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .jc-playback-button {
          padding: 8px 16px;
          background: #333;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }

        .jc-playback-button:hover {
          background: #444;
        }

        .jc-playback-button.active {
          background: #ff0000;
        }

        .jc-quality-selector {
          display: flex;
          gap: 8px;
        }

        .jc-playback-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-top: 10px;
          font-size: 13px;
        }

        .jc-stat-item {
          background: #222;
          padding: 10px;
          border-radius: 6px;
          border-left: 3px solid #ff0000;
        }

        .jc-stat-label {
          color: #aaa;
          font-size: 11px;
          text-transform: uppercase;
        }

        .jc-stat-value {
          color: white;
          font-weight: bold;
          margin-top: 4px;
        }

        .jc-playback-loading,
        .jc-playback-error {
          padding: 40px;
          text-align: center;
          background: #1a1a1a;
          color: white;
          border-radius: 12px;
        }

        @media (max-width: 768px) {
          .jc-playback-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .jc-quality-selector {
            flex-wrap: wrap;
          }
        }
      `}</style>

      <div className="jc-playback-video-wrapper">
        <video
          ref={videoRef}
          className="jc-playback-video"
          controls={false}
          style={{ width: filteredWidth }}
          onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
        >
          <source src={recording.recordingPath} type="video/webm" />
          Your browser does not support video playback.
        </video>
      </div>

      <div className="jc-playback-controls">
        <div>
          <h3 style={{ margin: '0 0 5px 0' }}>{recording.title}</h3>
          {recording.description && (
            <p style={{ margin: 0, fontSize: '13px', color: '#aaa' }}>{recording.description}</p>
          )}
        </div>

        <div className="jc-playback-progress">
          <div
            className="jc-playback-progress-bar"
            style={{ width: `${(currentTime / recording.duration) * 100}%` }}
          />
        </div>

        <div className="jc-playback-info">
          <span>
            {formatTime(currentTime)} / {formatTime(recording.duration)}
          </span>
          <span>{recording.quality.toUpperCase()}</span>
        </div>

        <div className="jc-playback-buttons">
          <button
            className="jc-playback-button"
            onClick={() => (videoRef.current?.play())}
          >
            ▶ Play
          </button>
          <button
            className="jc-playback-button"
            onClick={() => (videoRef.current?.pause())}
          >
            ⏸ Pause
          </button>

          <div className="jc-quality-selector">
            <button
              className={`jc-playback-button ${quality === 'low' ? 'active' : ''}`}
              onClick={() => handleQualityChange('low')}
            >
              Low (480p)
            </button>
            <button
              className={`jc-playback-button ${quality === 'medium' ? 'active' : ''}`}
              onClick={() => handleQualityChange('medium')}
            >
              Medium (720p)
            </button>
            <button
              className={`jc-playback-button ${quality === 'high' ? 'active' : ''}`}
              onClick={() => handleQualityChange('high')}
            >
              High (1080p)
            </button>
          </div>
        </div>

        <div className="jc-playback-stats">
          <div className="jc-stat-item">
            <div className="jc-stat-label">Duration</div>
            <div className="jc-stat-value">{formatTime(recording.duration)}</div>
          </div>
          <div className="jc-stat-item">
            <div className="jc-stat-label">Peak Viewers</div>
            <div className="jc-stat-value">{recording.peakViewers}</div>
          </div>
          <div className="jc-stat-item">
            <div className="jc-stat-label">Total Views</div>
            <div className="jc-stat-value">{recording.viewerCount}</div>
          </div>
          <div className="jc-stat-item">
            <div className="jc-stat-label">Quality</div>
            <div className="jc-stat-value">{recording.quality.toUpperCase()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StreamPlaybackComponent
