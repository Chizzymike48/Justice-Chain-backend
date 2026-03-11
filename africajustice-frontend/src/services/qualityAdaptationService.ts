/**
 * Quality Adaptation Service
 * Automatically adjusts streaming quality based on network conditions
 */

export interface NetworkStats {
  bandwidth: number // bits per second
  latency: number // milliseconds
  packetLoss: number // percentage 0-100
  quality: 'low' | 'medium' | 'high'
}

export interface QualityProfile {
  name: 'low' | 'medium' | 'high'
  videoBitrate: number // kbps
  audioBitrate: number // kbps
  videoWidth: number
  videoHeight: number
  frameRate: number
}

export interface EncoderSettings {
  video: {
    bitrate: number
    width: number
    height: number
    frameRate: number
  }
  audio: {
    bitrate: number
  }
}

interface NetworkInformation {
  downlink?: number
  rtt?: number
  effectiveType?: string
}

interface NavigatorNetwork extends Navigator {
  connection?: NetworkInformation
  mozConnection?: NetworkInformation
  webkitConnection?: NetworkInformation
}

const QUALITY_PROFILES: Record<string, QualityProfile> = {
  low: {
    name: 'low',
    videoBitrate: 500,
    audioBitrate: 64,
    videoWidth: 426,
    videoHeight: 240,
    frameRate: 24,
  },
  medium: {
    name: 'medium',
    videoBitrate: 1500,
    audioBitrate: 128,
    videoWidth: 854,
    videoHeight: 480,
    frameRate: 30,
  },
  high: {
    name: 'high',
    videoBitrate: 3000,
    audioBitrate: 192,
    videoWidth: 1280,
    videoHeight: 720,
    frameRate: 30,
  },
}

class QualityAdaptationService {
  private networkStats: NetworkStats | null = null
  private currentQuality: 'low' | 'medium' | 'high' = 'high'
  private updateInterval: ReturnType<typeof setInterval> | null = null

  startMonitoring(callback?: (quality: 'low' | 'medium' | 'high') => void): void {
    this.updateInterval = setInterval(() => {
      this.updateNetworkStats(callback)
    }, 3000) // Check every 3 seconds
  }

  stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  private async updateNetworkStats(
    callback?: (quality: 'low' | 'medium' | 'high') => void,
  ): Promise<void> {
    try {
      if (typeof navigator === 'undefined') {
        return
      }
      // Measure bandwidth using navigator.connection API
      const networkNavigator = navigator as NavigatorNetwork
      const connection =
        networkNavigator.connection ||
        networkNavigator.mozConnection ||
        networkNavigator.webkitConnection

      if (connection) {
        const downlink = typeof connection.downlink === 'number' ? connection.downlink : 0
        const rtt = typeof connection.rtt === 'number' ? connection.rtt : 0
        const effectiveType = connection.effectiveType || '4g'
        const bandwidth = downlink * 1000 * 1000 // Convert Mbps to bps

        // Estimate packet loss (simplified)
        const packetLoss = this.estimatePacketLoss(effectiveType)

        this.networkStats = {
          bandwidth,
          latency: rtt || 0,
          packetLoss,
          quality: this.currentQuality,
        }

        const recommendedQuality = this.determineQuality(bandwidth, rtt, packetLoss)
        if (recommendedQuality !== this.currentQuality) {
          this.currentQuality = recommendedQuality
          callback?.(recommendedQuality)
        }
      }
    } catch (error) {
      console.error('Error updating network stats:', error)
    }
  }

  private determineQuality(
    bandwidth: number,
    latency: number,
    packetLoss: number,
  ): 'low' | 'medium' | 'high' {
    // Poor network conditions
    if (bandwidth < 1000000 || latency > 100 || packetLoss > 5) {
      return 'low'
    }

    // Medium network conditions
    if (bandwidth < 3000000 || latency > 50 || packetLoss > 2) {
      return 'medium'
    }

    // Good network conditions
    return 'high'
  }

  private estimatePacketLoss(effectiveType: string): number {
    const lossMap: Record<string, number> = {
      'slow-2g': 15,
      '2g': 10,
      '3g': 3,
      '4g': 0.5,
    }
    return lossMap[effectiveType] || 1
  }

  getQualityProfile(quality: 'low' | 'medium' | 'high'): QualityProfile {
    return QUALITY_PROFILES[quality]
  }

  getCurrentQuality(): 'low' | 'medium' | 'high' {
    return this.currentQuality
  }

  getNetworkStats(): NetworkStats | null {
    return this.networkStats
  }

  getVideoConstraints(quality: 'low' | 'medium' | 'high'): MediaTrackConstraints {
    const profile = this.getQualityProfile(quality)
    return {
      width: { ideal: profile.videoWidth },
      height: { ideal: profile.videoHeight },
      frameRate: { ideal: profile.frameRate },
    }
  }

  getEncoderSettings(quality: 'low' | 'medium' | 'high'): EncoderSettings {
    const profile = this.getQualityProfile(quality)
    return {
      video: {
        bitrate: profile.videoBitrate * 1000, // Convert to bps
        width: profile.videoWidth,
        height: profile.videoHeight,
        frameRate: profile.frameRate,
      },
      audio: {
        bitrate: profile.audioBitrate * 1000,
      },
    }
  }
}

export const qualityAdaptationService = new QualityAdaptationService()
export default qualityAdaptationService
