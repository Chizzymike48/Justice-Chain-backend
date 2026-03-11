import { FC, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import livestreamService from '../../services/livestreamService'
import livestreamSocketService from '../../services/livestreamSocketService'
import qualityAdaptationService, { NetworkStats } from '../../services/qualityAdaptationService'
import screenSharingService from '../../services/screenSharingService'
import streamAnalyticsService from '../../services/streamAnalyticsService'
import LiveChatComponent from './LiveChat'

interface LiveStreamingProps {
  streamTitle: string
  caseId?: string
  onClose: () => void
}

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

const LiveStreamingComponent: FC<LiveStreamingProps> = ({ streamTitle, caseId, onClose }) => {
  const { user } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [streamId, setStreamId] = useState<string | null>(null)
  const [isCreatingStream, setIsCreatingStream] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [streamStatus, setStreamStatus] = useState<'initializing' | 'active' | 'stopped'>('initializing')
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [currentQuality, setCurrentQuality] = useState<'low' | 'medium' | 'high'>('high')
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Start camera access
  const startCamera = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera'
      setError(`Camera Error: ${errorMessage}`)
      console.error('Camera access error:', err)
    }
  }

  // Get current location
  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        })
        setError(null)
      },
      (err) => {
        console.error('Location error:', err)
        setError(`Location Error: ${err.message}`)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      },
    )
  }

  // Start streaming with Socket.io
  const handleStartStream = async () => {
    if (!streamTitle.trim()) {
      setError('Please enter a stream title')
      return
    }

    if (!streamRef.current) {
      setError('Camera not initialized')
      return
    }

    try {
      setIsCreatingStream(true)
      setError(null)
      setStreamStatus('initializing')

      // Generate unique stream ID
      const newStreamId = `stream-${user?.id}-${Date.now()}`
      setStreamId(newStreamId)

      // Create livestream record in database
      await livestreamService.createLiveStream({
        title: streamTitle,
        description: `Live stream from ${user?.username || 'Anonymous'} | Location: ${
          location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Not available'
        }`,
        caseId: caseId || undefined,
        status: 'active',
        streamId: newStreamId,
      })

      // Connect Socket.io livestream
      livestreamSocketService.connect(newStreamId, {
        onViewerCount: (count) => setViewerCount(count),
        onStreamEnded: () => handleStopStream(),
        onError: (error) => setError(error),
      })

      // Wait a moment for socket to connect
      setTimeout(() => {
        if (livestreamSocketService.isConnected()) {
          setupMediaRecorder()
          livestreamSocketService.sendStatusUpdate('active')
          setStreamStatus('active')
          setIsStreaming(true)
        } else {
          setError('Failed to establish streaming connection')
          setStreamStatus('stopped')
        }
      }, 500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start stream'
      setError(`Stream Error: ${errorMessage}`)
      console.error('Stream creation error:', err)
      setStreamStatus('stopped')
    } finally {
      setIsCreatingStream(false)
    }
  }

  // Setup MediaRecorder to capture and send video chunks via Socket.io
  const setupMediaRecorder = () => {
    if (!streamRef.current) return

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9',
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          const reader = new FileReader()
          reader.onload = () => {
            livestreamSocketService.sendStreamChunk({
              type: 'stream-chunk',
              data: reader.result,
              timestamp: Date.now(),
            })
          }
          reader.readAsArrayBuffer(event.data)
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error)
        setError(`Recording Error: ${event.error}`)
      }

      mediaRecorder.start(1000) // Send chunks every 1 second
      mediaRecorderRef.current = mediaRecorder
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to setup media recorder'
      console.error('MediaRecorder setup error:', err)
      setError(`Recording Error: ${errorMessage}`)
    }
  }

  // Stop streaming
  const handleStopStream = async () => {
    try {
      // Stop media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }

      // Notify backend stream stopped
      if (streamId) {
        livestreamSocketService.sendStatusUpdate('stopped')
        await livestreamService.updateLiveStreamStatus(streamId, 'stopped')
      }

      // Disconnect Socket.io
      livestreamSocketService.disconnect()

      // Stop camera tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      setIsStreaming(false)
      setStreamStatus('stopped')
      setViewerCount(0)
      onClose()
    } catch (err) {
      console.error('Error stopping stream:', err)
      setError('Failed to stop stream properly')
    }
  }

  // Screen Sharing Handler
  const handleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await screenSharingService.startScreenShare({
          audio: false,
          video: { cursor: 'always' },
        })

        if (streamRef.current) {
          await screenSharingService.switchToScreenShare(streamRef.current, screenStream)
          setIsScreenSharing(true)
          streamAnalyticsService.recordStreamShare(streamId || '')

          // Listen for when user stops sharing screen
          const videoTrack = screenStream.getVideoTracks()[0]
          if (videoTrack) {
            videoTrack.addEventListener('ended', () => {
              setIsScreenSharing(false)
            })
          }
        }
      } else {
        // Switch back to camera
        await screenSharingService.switchBackToCamera()
        setIsScreenSharing(false)
        screenSharingService.stopScreenShare()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Screen sharing failed'
      setError(errorMessage)
    }
  }

  // Quality Change Handler
  const handleQualityChange = async (quality: 'low' | 'medium' | 'high') => {
    setCurrentQuality(quality)
    livestreamSocketService.sendStatusUpdate('active')
    streamAnalyticsService.recordQualityChange(streamId || '', quality)
  }

  // Initialize camera and location
  useEffect(() => {
    startCamera()
    getLocation()

    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // Setup Quality Adaptation Monitoring
  useEffect(() => {
    if (isStreaming) {
      qualityAdaptationService.startMonitoring((adaptedQuality) => {
        setCurrentQuality(adaptedQuality)
        console.log(`Quality adapted to: ${adaptedQuality}`)
      })

      const statsInterval = setInterval(() => {
        const stats = qualityAdaptationService.getNetworkStats()
        setNetworkStats(stats)
      }, 3000)

      return () => {
        qualityAdaptationService.stopMonitoring()
        clearInterval(statsInterval)
      }
    }
  }, [isStreaming])

  // Detect Mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /mobile|android|iphone/i.test(navigator.userAgent))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="jc-livestream-container">
      <style>{`
        .jc-livestream-container {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 20px;
          padding: 20px;
          background: #1a1a1a;
          color: white;
          height: 100vh;
          overflow: hidden;
        }

        .jc-livestream-main {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .jc-livestream-video {
          position: relative;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
          flex: 1;
        }

        .jc-livestream-video video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
        }

        .jc-livestream-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent);
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .jc-livestream-status {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 0, 0, 0.8);
          padding: 10px 15px;
          border-radius: 20px;
          font-weight: bold;
          z-index: 10;
        }

        .jc-livestream-status-dot {
          width: 10px;
          height: 10px;
          background: #fff;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .jc-livestream-info {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .jc-livestream-title {
          background: rgba(0, 0, 0, 0.8);
          padding: 15px;
          border-radius: 8px;
        }

        .jc-livestream-title h2 {
          margin: 0;
          font-size: 20px;
          color: white;
        }

        .jc-livestream-location {
          background: rgba(0, 0, 0, 0.8);
          padding: 15px;
          border-radius: 8px;
          font-size: 14px;
        }

        .jc-livestream-location strong {
          color: #4CAF50;
          display: block;
          margin-bottom: 5px;
        }

        .jc-livestream-controls {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .jc-livestream-button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 14px;
        }

        .jc-btn-live-start {
          background: #4CAF50;
          color: white;
        }

        .jc-btn-live-start:hover:not(:disabled) {
          background: #45a049;
        }

        .jc-btn-live-stop {
          background: #f44336;
          color: white;
        }

        .jc-btn-live-stop:hover {
          background: #da190b;
        }

        .jc-livestream-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .jc-livestream-sidebar {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .jc-livestream-viewers {
          background: rgba(255, 255, 255, 0.1);
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .jc-livestream-viewers-number {
          font-size: 32px;
          font-weight: bold;
          color: #fff;
        }

        .jc-livestream-viewers-label {
          font-size: 12px;
          color: #aaa;
          text-transform: uppercase;
        }

        .jc-livestream-error {
          background: #f44336;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 10px;
        }

        @media (max-width: 768px) {
          .jc-livestream-container {
            grid-template-columns: 1fr;
            height: auto;
            padding: 10px;
            gap: 10px;
          }

          .jc-livestream-video {
            min-height: 250px;
            aspect-ratio: 9 / 16;
          }

          .jc-livestream-sidebar {
            order: -1;
            display: none;
          }

          .jc-livestream-button {
            padding: 8px 12px;
            font-size: 12px;
          }

          .jc-livestream-controls {
            flex-direction: column;
          }

          .jc-livestream-info {
            gap: 8px;
          }
        }

        @media (max-width: 480px) {
          .jc-livestream-container {
            padding: 5px;
          }

          .jc-livestream-video {
            min-height: 200px;
          }

          .jc-livestream-video video {
            transform: none;
          }

          .jc-livestream-button {
            padding: 6px 10px;
            font-size: 11px;
          }

          .jc-livestream-title h2 {
            font-size: 16px;
          }

          .jc-livestream-viewers-number {
            font-size: 24px;
          }
        }
      `}</style>

      <div className="jc-livestream-main">
        {error && <div className="jc-livestream-error">{error}</div>}

        <div className="jc-livestream-video">
          <video ref={videoRef} autoPlay playsInline muted />
          {isStreaming && (
            <div className="jc-livestream-header">
              <div className="jc-livestream-status">
                <span className="jc-livestream-status-dot" />
                LIVE
              </div>
            </div>
          )}
        </div>

        <div className="jc-livestream-info">
          <div className="jc-livestream-title">
            <h2>{streamTitle}</h2>
          </div>

          {location && (
            <div className="jc-livestream-location">
              <strong>📍 Current Location</strong>
              <div>Lat: {location.latitude.toFixed(6)}</div>
              <div>Lng: {location.longitude.toFixed(6)}</div>
              <div style={{ fontSize: '12px', marginTop: '5px', color: '#aaa' }}>
                Accuracy: ±{location.accuracy.toFixed(0)}m
              </div>
            </div>
          )}

          <div className="jc-livestream-controls">
            {!isStreaming ? (
              <button
                className="jc-livestream-button jc-btn-live-start"
                onClick={handleStartStream}
                disabled={isCreatingStream}
              >
                {isCreatingStream ? 'Starting...' : '● Start Live Stream'}
              </button>
            ) : (
              <>
                <button className="jc-livestream-button jc-btn-live-stop" onClick={handleStopStream}>
                  ⏹ Stop Streaming
                </button>
                <button
                  className="jc-livestream-button"
                  onClick={handleScreenShare}
                  style={{
                    background: isScreenSharing ? '#2196F3' : '#333',
                  }}
                  title={isScreenSharing ? 'Stop screen sharing' : 'Start screen sharing'}
                >
                  {isScreenSharing ? '⊞ Stop Screen' : '⊡ Share Screen'}
                </button>
                {!isMobile && (
                  <>
                    <button
                      className="jc-livestream-button"
                      onClick={() => handleQualityChange('low')}
                      style={{
                        background: currentQuality === 'low' ? '#FF9800' : '#333',
                      }}
                    >
                      480p
                    </button>
                    <button
                      className="jc-livestream-button"
                      onClick={() => handleQualityChange('medium')}
                      style={{
                        background: currentQuality === 'medium' ? '#FF9800' : '#333',
                      }}
                    >
                      720p
                    </button>
                    <button
                      className="jc-livestream-button"
                      onClick={() => handleQualityChange('high')}
                      style={{
                        background: currentQuality === 'high' ? '#FF9800' : '#333',
                      }}
                    >
                      1080p
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {networkStats && (
            <div style={{ background: '#222', padding: '10px', borderRadius: '6px', fontSize: '12px', marginTop: '10px' }}>
              <div>🌐 Bandwidth: {(networkStats.bandwidth / 1000000).toFixed(1)} Mbps</div>
              <div>⏱ Latency: {networkStats.latency}ms</div>
              <div>📊 Packet Loss: {networkStats.packetLoss.toFixed(1)}%</div>
            </div>
          )}
        </div>
      </div>

      <div className="jc-livestream-sidebar">
        {isStreaming && (
          <div className="jc-livestream-viewers">
            <div className="jc-livestream-viewers-number">{viewerCount}</div>
            <div className="jc-livestream-viewers-label">Viewers</div>
            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '10px' }}>
              Status: <span style={{ color: streamStatus === 'active' ? '#4CAF50' : '#ff9800' }}>{streamStatus}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '8px' }}>
              Quality: <span style={{ color: '#4CAF50' }}>{currentQuality.toUpperCase()}</span>
            </div>
            {networkStats && (
              <div style={{ fontSize: '10px', marginTop: '8px', borderTop: '1px solid #333', paddingTop: '8px' }}>
                <div>📶 {(networkStats.bandwidth / 1000000).toFixed(1)} Mbps</div>
                <div>⏱ {networkStats.latency}ms</div>
              </div>
            )}
          </div>
        )}

        {isStreaming && streamId && <LiveChatComponent streamId={streamId} caseId={caseId} />}
      </div>
    </div>
  )
}

export default LiveStreamingComponent
