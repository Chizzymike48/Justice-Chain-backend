import api from './api'

export interface ViewerAnalytic {
  streamId: string
  userId?: string
  action: 'joined' | 'left' | 'paused' | 'resumed' | 'quality_changed' | 'shared' | 'bookmarked'
  timestamp: Date
  duration?: number
  quality?: string
  device?: string
}

export interface StreamAnalytics {
  streamId: string
  totalViewers: number
  peakViewers: number
  averageDuration: number
  totalWatchTime: number
  deviceBreakdown: Record<string, number>
  qualityBreakdown: Record<string, number>
}

class StreamAnalyticsService {
  private analytics: ViewerAnalytic[] = []

  recordEvent(event: ViewerAnalytic): void {
    this.analytics.push(event)

    // Auto-save to backend every 10 events or every 30 seconds
    if (this.analytics.length >= 10 || this.shouldFlush()) {
      this.flush()
    }
  }

  async recordViewerJoined(streamId: string, userId?: string): Promise<void> {
    this.recordEvent({
      streamId,
      userId,
      action: 'joined',
      timestamp: new Date(),
      device: this.detectDevice(),
    })
  }

  async recordViewerLeft(streamId: string, userId?: string, duration?: number): Promise<void> {
    this.recordEvent({
      streamId,
      userId,
      action: 'left',
      timestamp: new Date(),
      duration,
    })
  }

  async recordQualityChange(streamId: string, quality: string): Promise<void> {
    this.recordEvent({
      streamId,
      action: 'quality_changed',
      timestamp: new Date(),
      quality,
    })
  }

  async recordStreamShare(streamId: string, userId?: string): Promise<void> {
    this.recordEvent({
      streamId,
      userId,
      action: 'shared',
      timestamp: new Date(),
    })
  }

  async recordBookmark(streamId: string, userId?: string): Promise<void> {
    this.recordEvent({
      streamId,
      userId,
      action: 'bookmarked',
      timestamp: new Date(),
    })
  }

  private detectDevice(): string {
    const ua = navigator.userAgent
    if (/mobile/i.test(ua)) return 'mobile'
    if (/tablet/i.test(ua)) return 'tablet'
    return 'desktop'
  }

  private shouldFlush(): boolean {
    // Implementation would check time elapsed
    return false
  }

  async flush(): Promise<void> {
    if (this.analytics.length === 0) return

    try {
      await api.post('/analytics/stream-events', {
        events: this.analytics,
      })
      this.analytics = []
    } catch (error) {
      console.error('Failed to save analytics:', error)
    }
  }

  async getStreamAnalytics(streamId: string): Promise<StreamAnalytics> {
    try {
      const response = await api.get(`/analytics/stream/${streamId}`)
      return response.data.data
    } catch (error) {
      console.error('Failed to get stream analytics:', error)
      throw error
    }
  }

  async getTopStreams(limit = 10): Promise<Record<string, unknown>[]> {
    try {
      const response = await api.get(`/analytics/top-streams?limit=${limit}`)
      return response.data.data
    } catch (error) {
      console.error('Failed to get top streams:', error)
      throw error
    }
  }
}

export const streamAnalyticsService = new StreamAnalyticsService()
export default streamAnalyticsService
