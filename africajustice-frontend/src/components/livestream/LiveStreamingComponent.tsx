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

  // Start camera access with better mobile/desktop support
  const startCamera = async () => {
    try {
      setError(null)
      console.log('[Livestream] 📷 Requesting camera access...')
      
      // Different constraints for mobile vs desktop
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
      setIsMobile(isMobileDevice)
      
      let constraints: MediaStreamConstraints
      
      if (isMobileDevice) {
        constraints = {
          audio: true,
          video: {
            facingMode: 'environment', // Back camera on mobile
            width: { ideal: 720 },
            height: { ideal: 1280 },
          },
        }
        console.log('[Livestream] 📱 Mobile device detected, using back camera')
      } else {
        // For desktop: try 1080p first, then fallback to 720p
        constraints = {
          audio: true,
          video: {
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
          },
        }
        console.log('[Livestream] 💻 Desktop device detected, requesting 1080p')
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('[Livestream] ✅ Camera access granted')
      console.log('[Livestream] Device type:', isMobileDevice ? 'Mobile' : 'Desktop')
      console.log('[Livestream] Video tracks:', stream.getVideoTracks().length)
      console.log('[Livestream] Audio tracks:', stream.getAudioTracks().length)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera'
      console.error('[Livestream] ❌ Camera access error:', err)
      
      // Provide helpful hints based on error type
      let userFriendlyError = `Camera Error: ${errorMessage}`
      
      if (errorMessage.includes('Permission') || errorMessage.includes('denied')) {
        userFriendlyError = '❌ Camera permission denied. Please:\n1. Check browser permissions\n2. Go to Settings → Privacy & Security\n3. Allow camera access for this site\n4. Refresh and try again'
        console.warn('[Livestream] 💡 Hint: Camera permission denied - check browser settings')
      } else if (errorMessage.includes('NotFound')) {
        userFriendlyError = '❌ No camera found. Please:\n1. Check if camera is connected\n2. Close other apps using the camera\n3. Try a different USB port\n4. Restart your browser'
        console.warn('[Livestream] 💡 Hint: No camera device found - check hardware')
      } else if (errorMessage.includes('NotSupported')) {
        userFriendlyError = '❌ Camera not supported. Please:\n1. Use Chrome, Firefox, or Edge\n2. Ensure site is using HTTPS (not HTTP)\n3. Update your browser'
        console.warn('[Livestream] 💡 Hint: Camera not supported - try different browser or HTTPS')
      } else if (errorMessage.includes('NotAllowed') || errorMessage.includes('PermissionDenied')) {
        userFriendlyError = '❌ Permission denied. System blocked this app from accessing camera.\nTry: Settings → Privacy → Camera'
        console.warn('[Livestream] 💡 Hint: System permission denied for camera')
      } else if (errorMessage.includes('Timeout')) {
        userFriendlyError = '❌ Camera access timeout. Try:\n1. Unplugging and re-plugging camera\n2. Restarting browser\n3. Checking device manager for errors'
        console.warn('[Livestream] 💡 Hint: Camera timeout - may be hardware issue')
      }
      
      setError(userFriendlyError)
    }
  }

  // Get current location (non-blocking, optional feature)
  const getLocation = () => {
    if (!navigator.geolocation) {
      console.warn('[Livestream] ⚠️ Geolocation not supported, continuing without location')
      return
    }

    console.log('[Livestream] 📍 Requesting location...')
    
    // Use getCurrentPosition with longer timeout for better success rate
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        })
        console.log('[Livestream] ✅ Location acquired:', position.coords.latitude, position.coords.longitude)
        setError(null)
      },
      (err) => {
        // Don't block streaming if location fails - it's optional
        console.warn('[Livestream] ⚠️ Location error (non-blocking):', err.message)
        // Don't set error state - location is optional for streaming
      },
      {
        enableHighAccuracy: false, // Less strict for faster response
        maximumAge: 300000, // Use 5-minute cached location if available
        timeout: 10000, // Longer timeout (10 seconds)
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

      // Wait for socket to actually connect with retry logic
      let retries = 0
      const maxRetries = 10
      const connectionCheckInterval = setInterval(() => {
        retries++
        console.log(`[Livestream] Connection check ${retries}/${maxRetries}, connected: ${livestreamSocketService.isConnected()}`)
        
        if (livestreamSocketService.isConnected()) {
          clearInterval(connectionCheckInterval)
          setupMediaRecorder()
          livestreamSocketService.sendStatusUpdate('active')
          setStreamStatus('active')
          setIsStreaming(true)
          console.log('[Livestream] ✅ Stream started successfully, recording active')
        } else if (retries >= maxRetries) {
          clearInterval(connectionCheckInterval)
          setError('Failed to establish streaming connection after multiple attempts')
          setStreamStatus('stopped')
          console.error('[Livestream] ❌ Connection failed after max retries')
        }
      }, 300)
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
    if (!streamRef.current) {
      console.error('[Livestream] ❌ No stream ref available')
      setError('Stream not available for recording')
      return
    }

    try {
      console.log('[Livestream] 🎥 Initializing MediaRecorder...')
      
      // Try multiple codec options for maximum browser compatibility
      const codecOptions = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp8',
        'video/webm;codecs=h264,opus',
        'video/webm;codecs=h264',
        'video/webm',
        'video/mp4',
      ]
      
      let selectedMimeType = ''
      for (const mimeType of codecOptions) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType
          console.log(`[Livestream] ✅ Using codec: ${mimeType}`)
          break
        }
      }

      if (!selectedMimeType) {
        console.warn('[Livestream] ⚠️ No supported MIME type found, using default')
      }

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: selectedMimeType || undefined,
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000,
      })

      let chunkCount = 0
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunkCount++
          console.log(`[Livestream] 📤 Sending chunk ${chunkCount} (${(event.data.size / 1024).toFixed(2)} KB)`)
          
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

      mediaRecorder.onstart = () => {
        console.log('[Livestream] ▶️ MediaRecorder started')
      }

      mediaRecorder.onstop = () => {
        console.log(`[Livestream] ⏹️ MediaRecorder stopped (sent ${chunkCount} chunks)`)
      }

      mediaRecorder.onerror = (event) => {
        console.error('[Livestream] ❌ MediaRecorder error:', event.error)
        setError(`Recording Error: ${event.error}`)
      }

      mediaRecorder.start(1000) // Send chunks every 1 second
      mediaRecorderRef.current = mediaRecorder
      console.log('[Livestream] ✅ MediaRecorder setup complete')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to setup media recorder'
      console.error('[Livestream] ❌ MediaRecorder setup error:', err)
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
    console.log('[Livestream] 🚀 Component mounted, initializing...')
    startCamera()
    getLocation()
    console.log('[Livestream] ✅ Initialization complete')

    return () => {
      // Cleanup on unmount
      console.log('[Livestream] 🧹 Cleaning up...')
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
