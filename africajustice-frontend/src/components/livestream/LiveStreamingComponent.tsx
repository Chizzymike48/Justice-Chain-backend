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
  const [isRecording, setIsRecording] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)

  // Start camera access with better mobile/desktop support
  const startCamera = async () => {
    try {
      setError(null)
      console.log('[Livestream] 📷 Requesting camera access...')
      
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
      setIsMobile(isMobileDevice)
      
      let constraints: MediaStreamConstraints
      
      if (isMobileDevice) {
        constraints = {
          audio: true,
          video: {
            facingMode: 'environment',
            width: { ideal: 720 },
            height: { ideal: 1280 },
          },
        }
      } else {
        constraints = {
          audio: true,
          video: {
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
          },
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraReady(true)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera'
      let userFriendlyError = `Camera Error: ${errorMessage}`
      
      if (errorMessage.includes('Permission') || errorMessage.includes('denied')) {
        userFriendlyError = 'Camera permission denied. Check browser settings and allow camera access.'
      }
      
      setIsCameraReady(false)
      setError(userFriendlyError)
    }
  }

  // Get current location
  const getLocation = () => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        })
      },
      () => {
        // Don't block on location error
      },
      {
        enableHighAccuracy: false,
        maximumAge: 300000,
        timeout: 10000,
      }
    )
  }

  // Start streaming
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

      const newStreamId = `stream-${user?.id}-${Date.now()}`
      setStreamId(newStreamId)

      await livestreamService.createLiveStream({
        title: streamTitle,
        description: `Live stream from ${user?.username || 'Anonymous'} | Location: ${
          location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Not available'
        }`,
        caseId: caseId || undefined,
        status: 'active',
        streamId: newStreamId,
      })

      livestreamSocketService.connect(newStreamId, {
        onViewerCount: (count) => setViewerCount(count),
        onStreamEnded: () => handleStopStream(),
        onError: (error) => setError(error),
      })

      let retries = 0
      const maxRetries = 10
      const connectionCheckInterval = setInterval(() => {
        retries++
        
        if (livestreamSocketService.isConnected()) {
          clearInterval(connectionCheckInterval)
          livestreamSocketService.sendStatusUpdate('active')
          setStreamStatus('active')
          setIsStreaming(true)
        } else if (retries >= maxRetries) {
          clearInterval(connectionCheckInterval)
          setError('Failed to establish streaming connection')
          setStreamStatus('stopped')
        }
      }, 300)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start stream'
      setError(`Stream Error: ${errorMessage}`)
      setStreamStatus('stopped')
    } finally {
      setIsCreatingStream(false)
    }
  }

  // Setup MediaRecorder
  const setupMediaRecorder = () => {
    if (!streamRef.current) {
      setError('Stream not available for recording')
      return
    }

    try {
      const codecOptions = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ]
      
      let selectedMimeType = ''
      for (const mimeType of codecOptions) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType
          break
        }
      }

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: selectedMimeType || undefined,
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000,
      })

      mediaRecorder.onstart = () => {
        setIsRecording(true)
      }

      mediaRecorder.onstop = () => {
        setIsRecording(false)
      }

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

      mediaRecorder.start(1000)
      mediaRecorderRef.current = mediaRecorder
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to setup recording'
      setError(`Recording Error: ${errorMessage}`)
    }
  }

  const handleStartRecording = () => {
    if (!isStreaming || streamStatus !== 'active') {
      setError('Start the livestream before recording.')
      return
    }

    if (!streamRef.current) {
      setError('Camera not initialized')
      return
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setError('Recording is already in progress.')
      return
    }

    setupMediaRecorder()
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  // Stop streaming
  const handleStopStream = async () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }

      if (streamId) {
        livestreamSocketService.sendStatusUpdate('stopped')
        await livestreamService.updateLiveStreamStatus(streamId, 'stopped')
      }

      livestreamSocketService.disconnect()

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      setIsStreaming(false)
      setStreamStatus('stopped')
      setIsRecording(false)
      setViewerCount(0)
      onClose()
    } catch (err) {
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

          const videoTrack = screenStream.getVideoTracks()[0]
          if (videoTrack) {
            videoTrack.addEventListener('ended', () => {
              setIsScreenSharing(false)
            })
          }
        }
      } else {
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
  const handleQualityChange = (quality: 'low' | 'medium' | 'high') => {
    setCurrentQuality(quality)
    livestreamSocketService.sendStatusUpdate('active')
  }

  // Initialize camera and location
  useEffect(() => {
    startCamera()
    getLocation()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  // Setup Quality Adaptation Monitoring
  useEffect(() => {
    if (isStreaming) {
      qualityAdaptationService.startMonitoring((adaptedQuality) => {
        setCurrentQuality(adaptedQuality)
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
          min-height: 100vh;
          align-items: start;
        }

        .jc-livestream-main {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-height: 0;
          align-items: center;
        }

        .jc-livestream-video {
          position: relative;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
          width: 100%;
          max-width: 480px;
          height: 280px;
          margin: 0 auto;
        }

        .jc-livestream-video video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
        }

        .jc-livestream-controls-bar {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 0 auto;
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
          z-index: 10;
        }

        .jc-livestream-status {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 0, 0, 0.8);
          padding: 10px 15px;
          border-radius: 20px;
          font-weight: bold;
        }

        .jc-livestream-status-dot {
          width: 10px;
          height: 10px;
          background: #fff;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }

        .jc-livestream-badges {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
        }

        .jc-livestream-badge {
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .jc-livestream-badge.rec {
          background: rgba(255, 0, 0, 0.7);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .jc-livestream-info {
          display: flex;
          flex-direction: column;
          gap: 15px;
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
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
          align-items: center;
          justify-content: center;
        }

        .jc-livestream-advanced {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
        }

        .jc-livestream-button {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 14px;
          white-space: nowrap;
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

        .jc-btn-record {
          background: #ff9800;
          color: #111;
        }

        .jc-btn-record:hover:not(:disabled) {
          background: #f57c00;
        }

        .jc-btn-live-back {
          background: transparent;
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.35);
        }

        .jc-btn-live-back:hover {
          border-color: rgba(255, 255, 255, 0.6);
          background: rgba(255, 255, 255, 0.08);
        }

        .jc-livestream-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .jc-livestream-hint {
          font-size: 12px;
          color: #aaa;
          text-align: center;
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
          color: white;
        }

        @media (max-width: 768px) {
          .jc-livestream-container {
            grid-template-columns: 1fr;
            padding: 10px;
            gap: 10px;
          }

          .jc-livestream-video {
            max-width: 100%;
            height: 300px;
          }

          .jc-livestream-button {
            padding: 10px 16px;
            font-size: 13px;
          }

          .jc-livestream-controls-bar {
            max-width: 100%;
          }
        }

        @media (max-width: 480px) {
          .jc-livestream-video {
            height: 200px;
          }

          .jc-livestream-video video {
            transform: none;
          }

          .jc-livestream-button {
            padding: 8px 12px;
            font-size: 12px;
          }

          .jc-livestream-controls {
            flex-direction: column;
            width: 100%;
          }

          .jc-livestream-controls .jc-livestream-button {
            width: 100%;
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
              <div className="jc-livestream-badges">
                <div className="jc-livestream-badge">
                  👥 {viewerCount} watching
                </div>
                {isRecording ? (
                  <div className="jc-livestream-badge rec">
                    ● Recording
                  </div>
                ) : (
                  <div className="jc-livestream-badge">
                    Recording off
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="jc-livestream-controls-bar">
          {isStreaming && (
            <div className="jc-livestream-advanced">
              <button
                className="jc-livestream-button"
                onClick={handleScreenShare}
                style={{
                  background: isScreenSharing ? '#2196F3' : '#333',
                }}
                title={isScreenSharing ? 'Stop screen sharing' : 'Start screen sharing'}
              >
                {isScreenSharing ? '⊟ Stop Screen' : '⊞ Share Screen'}
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
            </div>
          )}

          <div className="jc-livestream-controls">
            {!isStreaming ? (
              <>
                <button
                  className="jc-livestream-button jc-btn-live-start"
                  onClick={handleStartStream}
                  disabled={isCreatingStream}
                >
                  {isCreatingStream ? 'Starting...' : '● Start Live Stream'}
                </button>
                <button
                  className="jc-livestream-button jc-btn-record"
                  onClick={handleStartRecording}
                  disabled
                  title="Start the livestream first"
                >
                  ⏺ Start Recording
                </button>
                <button className="jc-livestream-button jc-btn-live-back" onClick={onClose}>
                  Back
                </button>
              </>
            ) : (
              <>
                <button className="jc-livestream-button jc-btn-live-stop" onClick={handleStopStream}>
                  ⏹ Stop Live Stream
                </button>
                {!isRecording ? (
                  <button
                    className="jc-livestream-button jc-btn-record"
                    onClick={handleStartRecording}
                    disabled={!isCameraReady || streamStatus !== 'active'}
                  >
                    ⏺ Start Recording
                  </button>
                ) : (
                  <button className="jc-livestream-button jc-btn-record" onClick={handleStopRecording}>
                    ⏹ Stop Recording
                  </button>
                )}
                <button className="jc-livestream-button jc-btn-live-back" onClick={onClose}>
                  Back
                </button>
              </>
            )}
          </div>

          {!isStreaming && (
            <span className="jc-livestream-hint">Start the livestream to enable recording.</span>
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

          {networkStats && (
            <div style={{ background: '#222', padding: '10px', borderRadius: '6px', fontSize: '12px' }}>
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
