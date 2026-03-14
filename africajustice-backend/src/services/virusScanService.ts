import axios from 'axios'

export interface ScanResult {
  clean: boolean
  threat?: string
  scanTime: number
  engine: string
}

/**
 * Virus Scan Service
 * Scans files for viruses/malware before processing
 * Can be configured to use ClamAV, Sophos, Windows Defender, or VirusTotal API
 */
export class VirusScanService {
  private scanEngine: 'mock' | 'virustotal' | 'clamav' = 'mock'
  private virusTotalApiKey: string | undefined
  private clamavUrl: string | undefined

  constructor() {
    this.virusTotalApiKey = process.env.VIRUSTOTAL_API_KEY
    this.clamavUrl = process.env.CLAMAV_URL || 'http://localhost:3310'
    
    // Determine which scanner to use
    if (this.virusTotalApiKey) {
      this.scanEngine = 'virustotal'
    } else if (process.env.CLAMAV_ENABLED === 'true') {
      this.scanEngine = 'clamav'
    } else {
      this.scanEngine = 'mock'
    }

    console.log(`[VirusScan] Using scan engine: ${this.scanEngine}`)
  }

  /**
   * Scan file buffer for viruses
   */
  public async scanFile(fileBuffer: Buffer, fileName: string): Promise<ScanResult> {
    const startTime = Date.now()
    
    try {
      switch (this.scanEngine) {
        case 'virustotal':
          return await this.scanWithVirusTotal(fileBuffer, fileName)
        
        case 'clamav':
          return await this.scanWithClamAV(fileBuffer, fileName)
        
        case 'mock':
        default:
          return this.scanWithMock(fileBuffer, fileName, startTime)
      }
    } catch (error) {
      console.error('[VirusScan] Scan error:', error)
      // On error, log warning but allow upload to proceed (graceful degradation)
      console.warn('[VirusScan] Virus scan failed, allowing upload to proceed')
      return {
        clean: true,
        threat: undefined,
        scanTime: Date.now() - startTime,
        engine: 'error-fallback',
      }
    }
  }

  /**
   * Mock virus scanner - always returns clean (for development)
   * In production, use real scanner
   */
  private scanWithMock(
    fileBuffer: Buffer,
    fileName: string,
    startTime: number
  ): ScanResult {
    console.log(`[VirusScan] Mock scan for: ${fileName} (${fileBuffer.length} bytes)`)
    
    // Simulate scan time
    const scanTime = Date.now() - startTime + Math.random() * 100

    // Check for test virus signatures (EICAR test file)
    const content = fileBuffer.toString()
    if (content.includes('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*')) {
      return {
        clean: false,
        threat: 'EICAR.Test.File',
        scanTime: Math.round(scanTime),
        engine: 'mock',
      }
    }

    return {
      clean: true,
      threat: undefined,
      scanTime: Math.round(scanTime),
      engine: 'mock',
    }
  }

  /**
   * Scan using VirusTotal API
   * Requires VIRUSTOTAL_API_KEY environment variable
   */
  private async scanWithVirusTotal(
    fileBuffer: Buffer,
    fileName: string
  ): Promise<ScanResult> {
    if (!this.virusTotalApiKey) {
      throw new Error('VirusTotal API key not configured')
    }

    const startTime = Date.now()
    console.log(`[VirusScan] Scanning with VirusTotal: ${fileName}`)

    try {
      // VirusTotal API v3 - analyze file
      const formData = new FormData()
      const blob = new Blob([Buffer.isBuffer(fileBuffer) ? new Uint8Array(fileBuffer) : fileBuffer], { type: 'application/octet-stream' })
      formData.append('file', blob, fileName)

      const response = await axios.post('https://www.virustotal.com/api/v3/files', formData, {
        headers: {
          'x-apikey': this.virusTotalApiKey,
        },
      })

      const fileId = response.data.data.id
      console.log(`[VirusScan] VirusTotal analysis ID: ${fileId}`)

      // Check analysis results
      const analysisResponse = await axios.get(
        `https://www.virustotal.com/api/v3/files/${fileId}`,
        {
          headers: {
            'x-apikey': this.virusTotalApiKey,
          },
        }
      )

      const stats = analysisResponse.data.data.attributes.last_analysis_stats
      const detectionResults = analysisResponse.data.data.attributes.last_analysis_results || {}

      const maliciousCount = stats.malicious || 0
      const suspiciousCount = stats.suspicious || 0

      if (maliciousCount > 0) {
        const threats = Object.entries(detectionResults)
          .filter(([_, result]) => {
            const detection = result as { category?: string }
            return detection.category === 'malicious'
          })
          .map(([engine, result]) => {
            const detection = result as { result?: string }
            return `${engine}: ${detection.result || 'malicious'}`
          })
          .slice(0, 3)

        return {
          clean: false,
          threat: `${maliciousCount} engines detected malware: ${threats.join('; ')}`,
          scanTime: Date.now() - startTime,
          engine: 'virustotal',
        }
      }

      if (suspiciousCount > 0) {
        console.warn(`[VirusScan] VirusTotal: ${suspiciousCount} suspicious detections`)
      }

      return {
        clean: true,
        threat: undefined,
        scanTime: Date.now() - startTime,
        engine: 'virustotal',
      }
    } catch (error) {
      console.error('[VirusScan] VirusTotal API error:', error)
      throw new Error('VirusTotal scan failed')
    }
  }

  /**
   * Scan using ClamAV (local or remote)
   * Requires ClamAV service running
   */
  private async scanWithClamAV(
    fileBuffer: Buffer,
    fileName: string
  ): Promise<ScanResult> {
    const startTime = Date.now()
    console.log(`[VirusScan] Scanning with ClamAV: ${fileName}`)

    try {
      // Send file to ClamAV service for scanning
      const response = await axios.post(`${this.clamavUrl}/scan`, fileBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Filename': encodeURIComponent(fileName),
        },
        timeout: 30000, // 30 second timeout
      })

      if (response.data.infected) {
        return {
          clean: false,
          threat: response.data.signature || 'Unknown threat',
          scanTime: Date.now() - startTime,
          engine: 'clamav',
        }
      }

      return {
        clean: true,
        threat: undefined,
        scanTime: Date.now() - startTime,
        engine: 'clamav',
      }
    } catch (error) {
      console.error('[VirusScan] ClamAV error:', error)
      throw new Error('ClamAV scan failed')
    }
  }

  /**
   * Get current scan engine
   */
  public getScanEngine(): string {
    return this.scanEngine
  }

  /**
   * Check if scanner is available
   */
  public async isAvailable(): Promise<boolean> {
    if (this.scanEngine === 'mock') {
      return true
    }

    if (this.scanEngine === 'virustotal') {
      return !!this.virusTotalApiKey
    }

    if (this.scanEngine === 'clamav') {
      try {
        await axios.get(`${this.clamavUrl}/health`, { timeout: 5000 })
        return true
      } catch {
        console.warn('[VirusScan] ClamAV service not available')
        return false
      }
    }

    return false
  }
}

export const virusScanService = new VirusScanService()
export default virusScanService
