import axios, { AxiosProgressEvent } from 'axios'
import { API_BASE_URL } from './api'

export interface PresignedUrlResponse {
  success: boolean
  data: {
    uploadUrl: string
    formFields: Record<string, string>
    s3Key: string
    expiresIn: number
  }
}

export interface UploadOptions {
  caseId: string
  sourceNote?: string
  onProgress?: (progress: number) => void
  onStatusChange?: (status: string) => void
}

export interface UploadResult {
  evidenceId: string
  fileName: string
  s3Url: string
  fileSize: number
  uploadTime: number
}

/**
 * Evidence Upload Service
 * Handles both direct S3 uploads and server-side uploads with progress tracking
 */
class EvidenceUploadService {
  private apiUrl = API_BASE_URL

  /**
   * Get presigned URL for direct S3 upload
   * More efficient for large files (no server bandwidth usage)
   */
  async getPresignedUrl(fileName: string, contentType: string): Promise<{
    uploadUrl: string
    formFields: Record<string, string>
    s3Key: string
  }> {
    try {
      const response = await axios.post<PresignedUrlResponse>(
        `${this.apiUrl}/evidence/presigned-url`,
        { fileName, contentType },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      )

      if (!response.data.success) {
        throw new Error('Failed to get presigned URL')
      }

      return response.data.data
    } catch (error) {
      console.error('[Evidence] Get presigned URL error:', error)
      throw error
    }
  }

  /**
   * Upload file directly to S3 using presigned URL
   * Client uploads directly to AWS S3, reducing server load
   */
  async uploadToS3(
    file: File,
    presignedUrl: string,
    formFields: Record<string, string>,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      const formData = new FormData()

      // Add form fields in specific order for S3 presigned POST
      Object.entries(formFields).forEach(([key, value]) => {
        formData.append(key, value)
      })

      // Add file last
      formData.append('file', file)

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onProgress?.(Math.min(percentCompleted, 99)) // Cap at 99% until completed
          }
        },
      }

      const response = await axios.post(presignedUrl, formData, config)

      if (response.status !== 204) {
        throw new Error(`Upload failed with status ${response.status}`)
      }

      onProgress?.(100)
      console.log('[Evidence] File uploaded to S3 successfully')
    } catch (error) {
      console.error('[Evidence] S3 upload error:', error)
      throw new Error('Failed to upload file to S3')
    }
  }

  /**
   * Upload file through server (for smaller files or when S3 direct upload not needed)
   * Server handles virus scan and indexing
   */
  async uploadThroughServer(
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('caseId', options.caseId)
      if (options.sourceNote) {
        formData.append('sourceNote', options.sourceNote)
      }

      options.onStatusChange?.('uploading')

      const response = await axios.post(
        `${this.apiUrl}/evidence/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
              options.onProgress?.(percentCompleted)
            }
          },
        }
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Upload failed')
      }

      options.onStatusChange?.('completed')

      return {
        evidenceId: response.data.data._id || response.data.data.id,
        fileName: response.data.data.fileName,
        s3Url: response.data.data.s3Url,
        fileSize: response.data.data.fileSize,
        uploadTime: response.data.uploadTime || 0,
      }
    } catch (error) {
      console.error('[Evidence] Server upload error:', error)
      options.onStatusChange?.('error')
      throw error
    }
  }

  /**
   * Smart upload - decides between S3 direct and server-side upload
   * Large files (>50MB) use S3 direct, smaller files use server-side
   */
  async smartUpload(
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> {
    const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024 // 50MB

    try {
      // For large files, use S3 direct upload
      if (file.size > LARGE_FILE_THRESHOLD) {
        console.log('[Evidence] Large file detected, using S3 direct upload')
        options.onStatusChange?.('getting-presigned-url')

        const presignedData = await this.getPresignedUrl(
          file.name,
          file.type
        )

        options.onStatusChange?.('uploading')

        await this.uploadToS3(
          file,
          presignedData.uploadUrl,
          presignedData.formFields,
          (progress) => {
            // Map S3 progress 0-90% on the overall progress bar
            options.onProgress?.(Math.round(progress * 0.9))
          }
        )

        // Now register with backend
        options.onStatusChange?.('registering')

        const response = await axios.post(
          `${this.apiUrl}/evidence/register-s3-upload`,
          {
            s3Key: presignedData.s3Key,
            caseId: options.caseId,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            sourceNote: options.sourceNote,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
          }
        )

        options.onProgress?.(100)
        options.onStatusChange?.('completed')

        return {
          evidenceId: response.data.data._id || response.data.data.id,
          fileName: response.data.data.fileName,
          s3Url: response.data.data.s3Url,
          fileSize: response.data.data.fileSize,
          uploadTime: 0,
        }
      }

      // For smaller files, upload through server
      return await this.uploadThroughServer(file, options)
    } catch (error) {
      console.error('[Evidence] Smart upload error:', error)
      throw error
    }
  }

  /**
   * Get download URL for evidence file
   */
  async getDownloadUrl(evidenceId: string): Promise<string> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/evidence/${evidenceId}/download`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      )

      if (!response.data.success) {
        throw new Error('Failed to get download URL')
      }

      return response.data.data.downloadUrl
    } catch (error) {
      console.error('[Evidence] Get download URL error:', error)
      throw error
    }
  }

  /**
   * Delete evidence
   */
  async deleteEvidence(evidenceId: string): Promise<void> {
    try {
      const response = await axios.delete(
        `${this.apiUrl}/evidence/${evidenceId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      )

      if (!response.data.success) {
        throw new Error('Failed to delete evidence')
      }

      console.log('[Evidence] Deleted:', evidenceId)
    } catch (error) {
      console.error('[Evidence] Delete error:', error)
      throw error
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB

    const ALLOWED_TYPES = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      }
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `File type not allowed. Supported types: ${ALLOWED_TYPES.join(', ')}`,
      }
    }

    return { valid: true }
  }

  /**
   * Get human-readable file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  /**
   * Get upload speed (bytes/second)
   */
  calculateUploadSpeed(uploadedBytes: number, elapsedMs: number): number {
    return (uploadedBytes / elapsedMs) * 1000
  }

  /**
   * Estimate time remaining (seconds)
   */
  estimateTimeRemaining(
    uploadedBytes: number,
    totalBytes: number,
    uploadSpeed: number
  ): number {
    if (uploadSpeed === 0) return 0
    const remainingBytes = totalBytes - uploadedBytes
    return Math.round(remainingBytes / uploadSpeed)
  }
}

export const evidenceUploadService = new EvidenceUploadService()
export default evidenceUploadService
