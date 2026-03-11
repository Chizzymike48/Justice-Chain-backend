import S3 from 'aws-sdk/clients/s3'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
})

export interface UploadOptions {
  bucket?: string
  prefix?: string
  contentType?: string
  acl?: 'public-read' | 'private'
}

export interface UploadResult {
  key: string
  url: string
  bucket: string
  eTag?: string
}

export interface PresignedUrlOptions {
  bucket?: string
  expirySeconds?: number
  contentType?: string
}

/**
 * S3 Service - Handle all AWS S3 operations for file uploads
 */
export class S3Service {
  private bucket: string = process.env.AWS_S3_BUCKET || 'justicechain'
  private region: string = process.env.AWS_REGION || 'us-east-1'

  /**
   * Generate presigned URL for direct browser upload
   * Client uploads directly to S3 without going through backend
   */
  public async generatePresignedUrl(
    fileName: string,
    options: PresignedUrlOptions = {}
  ): Promise<{
    url: string
    fields: Record<string, string>
    key: string
  }> {
    try {
      const bucket = options.bucket || this.bucket
      const fileExt = path.extname(fileName)
      const fileNameWithoutExt = path.basename(fileName, fileExt)
      
      // Generate unique key
      const key = `evidence/${Date.now()}-${uuidv4()}${fileExt}`

      // Generate presigned POST (multipart form upload)
      const params = {
        Bucket: bucket,
        Fields: {
          key,
          'Content-Type': options.contentType || 'application/octet-stream',
        },
        Expires: options.expirySeconds || 3600, // 1 hour default
      }

      return new Promise((resolve, reject) => {
        s3.createPresignedPost(params, (err, data) => {
          if (err) {
            console.error('[S3] Presigned URL generation error:', err)
            return reject(new Error('Failed to generate presigned URL'))
          }
          
          resolve({
            url: data.url,
            fields: data.fields,
            key,
          })
        })
      })
    } catch (error) {
      console.error('[S3] Generate presigned URL error:', error)
      throw error
    }
  }

  /**
   * Upload file buffer to S3
   * Used for server-side uploads of processed files
   */
  public async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const bucket = options.bucket || this.bucket
      const prefix = options.prefix || 'evidence'
      const fileExt = path.extname(fileName)
      
      // Generate unique key
      const key = `${prefix}/${Date.now()}-${uuidv4()}${fileExt}`

      const params = {
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: options.contentType || 'application/octet-stream',
        ACL: options.acl || 'private' as 'private' | 'public-read',
        Metadata: {
          'Original-Filename': fileName,
          'Upload-Timestamp': new Date().toISOString(),
        },
      }

      return new Promise((resolve, reject) => {
        s3.upload(params, (err: any, data: any) => {
          if (err) {
            console.error('[S3] Upload error:', err)
            return reject(new Error('Failed to upload file to S3'))
          }

          console.log('[S3] File uploaded successfully:', key)
          resolve({
            key,
            url: `https://${bucket}.s3.${this.region}.amazonaws.com/${key}`,
            bucket,
            eTag: data.ETag,
          })
        })
      })
    } catch (error) {
      console.error('[S3] Upload file error:', error)
      throw error
    }
  }

  /**
   * Generate signed download URL for private files
   */
  public async generateSignedDownloadUrl(
    key: string,
    expirySeconds: number = 3600
  ): Promise<string> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        Expires: expirySeconds,
      }

      return new Promise((resolve, reject) => {
        s3.getSignedUrl('getObject', params, (err, url) => {
          if (err) {
            console.error('[S3] Signed URL generation error:', err)
            return reject(new Error('Failed to generate signed URL'))
          }
          resolve(url)
        })
      })
    } catch (error) {
      console.error('[S3] Generate signed URL error:', error)
      throw error
    }
  }

  /**
   * Delete file from S3
   */
  public async deleteFile(key: string): Promise<void> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
      }

      return new Promise((resolve, reject) => {
        s3.deleteObject(params, (err) => {
          if (err) {
            console.error('[S3] Delete error:', err)
            return reject(new Error('Failed to delete file from S3'))
          }

          console.log('[S3] File deleted successfully:', key)
          resolve()
        })
      })
    } catch (error) {
      console.error('[S3] Delete file error:', error)
      throw error
    }
  }

  /**
   * Check if file exists in S3
   */
  public async fileExists(key: string): Promise<boolean> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
      }

      return new Promise((resolve, reject) => {
        s3.headObject(params, (err) => {
          if (err) {
            if (err.code === 'NotFound') {
              return resolve(false)
            }
            return reject(err)
          }
          resolve(true)
        })
      })
    } catch (error) {
      console.error('[S3] File exists check error:', error)
      throw error
    }
  }

  /**
   * Get file metadata from S3
   */
  public async getFileMetadata(key: string): Promise<{
    size: number
    lastModified: Date
    contentType: string
  }> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
      }

      return new Promise((resolve, reject) => {
        s3.headObject(params, (err, data) => {
          if (err) {
            console.error('[S3] Metadata error:', err)
            return reject(new Error('Failed to get file metadata'))
          }

          resolve({
            size: data.ContentLength || 0,
            lastModified: data.LastModified || new Date(),
            contentType: data.ContentType || 'application/octet-stream',
          })
        })
      })
    } catch (error) {
      console.error('[S3] Get metadata error:', error)
      throw error
    }
  }

  /**
   * List files with given prefix
   */
  public async listFiles(prefix: string = 'evidence'): Promise<Array<{
    key: string
    size: number
    lastModified: Date
  }>> {
    try {
      const params = {
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: 1000,
      }

      return new Promise((resolve, reject) => {
        s3.listObjectsV2(params, (err, data) => {
          if (err) {
            console.error('[S3] List files error:', err)
            return reject(new Error('Failed to list files'))
          }

          const files = (data.Contents || []).map((obj) => ({
            key: obj.Key || '',
            size: obj.Size || 0,
            lastModified: obj.LastModified || new Date(),
          }))

          resolve(files)
        })
      })
    } catch (error) {
      console.error('[S3] List files error:', error)
      throw error
    }
  }

  /**
   * Get S3 bucket info
   */
  public getBucketInfo(): {
    bucket: string
    region: string
    publicUrl: (key: string) => string
  } {
    return {
      bucket: this.bucket,
      region: this.region,
      publicUrl: (key: string) => `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
    }
  }
}

export const s3Service = new S3Service()
export default s3Service
