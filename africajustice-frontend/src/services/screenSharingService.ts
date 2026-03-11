/**
 * Screen Sharing Service
 * Enables users to share their screen during live streams
 */

export interface ScreenShareOptions {
  audio: boolean
  video: {
    cursor?: 'always' | 'motion' | 'never'
  }
}

type DisplayMediaVideoConstraints = MediaTrackConstraints & {
  cursor?: 'always' | 'motion' | 'never'
}

class ScreenSharingService {
  private screenStream: MediaStream | null = null
  private originalStream: MediaStream | null = null

  async startScreenShare(options?: ScreenShareOptions): Promise<MediaStream> {
    try {
      const displayMediaOptions: DisplayMediaStreamOptions = {
        video: {
          cursor: options?.video?.cursor || 'always',
        } as DisplayMediaVideoConstraints,
        audio: options?.audio || false,
      }

      this.screenStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions)
      return this.screenStream
    } catch (error) {
      if ((error as Error).name === 'NotAllowedError') {
        throw new Error('Screen sharing was cancelled')
      }
      throw error
    }
  }

  stopScreenShare(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop())
      this.screenStream = null
    }
  }

  async switchToScreenShare(
    originalStream: MediaStream,
    screenStream: MediaStream,
  ): Promise<MediaStream> {
    // Store original for switching back
    this.originalStream = originalStream

    // Replace video track with screen share
    const screenVideoTrack = screenStream.getVideoTracks()[0]
    const originalVideoTrack = originalStream.getVideoTracks()[0]

    if (screenVideoTrack) {
      if (originalVideoTrack) {
        originalStream.removeTrack(originalVideoTrack)
      }
      originalStream.addTrack(screenVideoTrack)
    }

    return originalStream
  }

  async switchBackToCamera(): Promise<MediaStream | null> {
    if (!this.originalStream) return null

    const originalVideoTrack = this.originalStream.getVideoTracks()[0]
    if (originalVideoTrack) {
      // The original track should already be in place
      return this.originalStream
    }

    return null
  }

  isScreenSharing(): boolean {
    return this.screenStream !== null
  }

  getScreenStream(): MediaStream | null {
    return this.screenStream
  }
}

export const screenSharingService = new ScreenSharingService()
export default screenSharingService
