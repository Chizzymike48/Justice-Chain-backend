import { S3Service, UploadOptions, PresignedUrlOptions } from '../../src/services/s3Service'
import S3 from 'aws-sdk/clients/s3'

// Mock AWS S3
jest.mock('aws-sdk/clients/s3')

describe('S3Service', () => {
  let s3Service: S3Service
  let mockS3Instance: jest.Mocked<S3>

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.AWS_S3_BUCKET = 'test-bucket'
    process.env.AWS_REGION = 'us-east-1'
    process.env.AWS_ACCESS_KEY_ID = 'test-key-id'
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key'

    mockS3Instance = new S3() as jest.Mocked<S3>
    s3Service = new S3Service()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('generatePresignedUrl', () => {
    it('should generate presigned URL for file upload', async () => {
      const mockPresignedData = {
        url: 'https://test-bucket.s3.amazonaws.com/',
        fields: {
          key: 'evidence/12345-uuid.pdf',
          'Content-Type': 'application/pdf',
        },
      }

      mockS3Instance.createPresignedPost = jest.fn(
        (params, callback) => {
          callback(null, mockPresignedData)
        }
      )

      const result = await s3Service.generatePresignedUrl('test-file.pdf')

      expect(result).toEqual({
        url: mockPresignedData.url,
        fields: mockPresignedData.fields,
        key: mockPresignedData.fields.key,
      })
    })

    it('should handle presigned URL generation errors', async () => {
      const mockError = new Error('S3 error')

      mockS3Instance.createPresignedPost = jest.fn(
        (params, callback) => {
          callback(mockError, null)
        }
      )

      await expect(s3Service.generatePresignedUrl('test-file.pdf')).rejects.toThrow(
        'Failed to generate presigned URL'
      )
    })

    it('should use custom options for presigned URL', async () => {
      const options: PresignedUrlOptions = {
        bucket: 'custom-bucket',
        expirySeconds: 7200,
        contentType: 'image/png',
      }

      const mockPresignedData = {
        url: 'https://custom-bucket.s3.amazonaws.com/',
        fields: {
          key: 'evidence/12345-uuid.png',
          'Content-Type': 'image/png',
        },
      }

      mockS3Instance.createPresignedPost = jest.fn(
        (params, callback) => {
          callback(null, mockPresignedData)
        }
      )

      const result = await s3Service.generatePresignedUrl('test-file.png', options)

      expect(result.url).toBe(mockPresignedData.url)
      expect(result.fields['Content-Type']).toBe('image/png')
    })
  })

  describe('uploadFile', () => {
    it('should upload file buffer to S3', async () => {
      const fileBuffer = Buffer.from('test file content')
      const fileName = 'test-document.pdf'
      const mockETag = '"abc123"'

      mockS3Instance.upload = jest.fn().mockReturnValue({
        promise: () =>
          Promise.resolve({
            Bucket: 'test-bucket',
            Key: 'evidence/test-document.pdf',
            ETag: mockETag,
          }),
      })

      const result = await s3Service.uploadFile(fileBuffer, fileName)

      expect(result).toHaveProperty('url')
      expect(result).toHaveProperty('bucket', 'test-bucket')
      expect(mockS3Instance.upload).toHaveBeenCalled()
    })

    it('should handle upload errors gracefully', async () => {
      const fileBuffer = Buffer.from('test file content')
      const fileName = 'test-document.pdf'
      const uploadError = new Error('Upload failed')

      mockS3Instance.upload = jest.fn().mockReturnValue({
        promise: () => Promise.reject(uploadError),
      })

      await expect(s3Service.uploadFile(fileBuffer, fileName)).rejects.toThrow('Upload failed')
    })

    it('should upload with custom options', async () => {
      const fileBuffer = Buffer.from('test file content')
      const fileName = 'test-document.pdf'
      const options: UploadOptions = {
        bucket: 'custom-bucket',
        prefix: 'reports',
        contentType: 'application/pdf',
        acl: 'private',
      }

      mockS3Instance.upload = jest.fn().mockReturnValue({
        promise: () =>
          Promise.resolve({
            Bucket: 'custom-bucket',
            Key: 'reports/test-document.pdf',
            ETag: '"xyz789"',
          }),
      })

      const result = await s3Service.uploadFile(fileBuffer, fileName, options)

      expect(result.bucket).toBe('custom-bucket')
      expect(mockS3Instance.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'custom-bucket',
          ACL: 'private',
        }),
        expect.any(Function)
      )
    })
  })

  describe('deleteFile', () => {
    it('should delete file from S3', async () => {
      const fileKey = 'evidence/12345-uuid.pdf'

      mockS3Instance.deleteObject = jest.fn().mockReturnValue({
        promise: () => Promise.resolve({}),
      })

      await s3Service.deleteFile(fileKey)

      expect(mockS3Instance.deleteObject).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Key: fileKey,
        })
      )
    })

    it('should handle deletion errors', async () => {
      const fileKey = 'evidence/12345-uuid.pdf'
      const deleteError = new Error('Deletion failed')

      mockS3Instance.deleteObject = jest.fn().mockReturnValue({
        promise: () => Promise.reject(deleteError),
      })

      await expect(s3Service.deleteFile(fileKey)).rejects.toThrow('Deletion failed')
    })
  })

  describe('generateSignedDownloadUrl', () => {
    it('should generate signed download URL', async () => {
      const fileKey = 'evidence/12345-uuid.pdf'
      const mockSignedUrl = 'https://test-bucket.s3.amazonaws.com/evidence/12345-uuid.pdf?...'

      mockS3Instance.getSignedUrl = jest.fn((operation, params, callback) => {
        callback(null, mockSignedUrl)
      })

      const result = await s3Service.generateSignedDownloadUrl(fileKey)

      expect(result).toBe(mockSignedUrl)
      expect(mockS3Instance.getSignedUrl).toHaveBeenCalledWith(
        'getObject',
        expect.objectContaining({
          Bucket: 'test-bucket',
          Key: fileKey,
        }),
        expect.any(Function)
      )
    })

    it('should handle signed URL generation errors', async () => {
      const fileKey = 'evidence/12345-uuid.pdf'
      const signError = new Error('Signing failed')

      mockS3Instance.getSignedUrl = jest.fn((operation, params, callback) => {
        callback(signError, null)
      })

      await expect(s3Service.generateSignedDownloadUrl(fileKey)).rejects.toThrow('Signing failed')
    })

    it('should use custom expiry for signed URL', async () => {
      const fileKey = 'evidence/12345-uuid.pdf'
      const expirySeconds = 7200
      const mockSignedUrl = 'https://test-bucket.s3.amazonaws.com/evidence/...'

      mockS3Instance.getSignedUrl = jest.fn((operation, params, callback) => {
        callback(null, mockSignedUrl)
      })

      await s3Service.generateSignedDownloadUrl(fileKey, expirySeconds)

      expect(mockS3Instance.getSignedUrl).toHaveBeenCalledWith(
        'getObject',
        expect.objectContaining({
          Expires: expirySeconds,
        }),
        expect.any(Function)
      )
    })
  })

  describe('listFiles', () => {
    it('should list files in S3 bucket with prefix', async () => {
      const prefix = 'evidence/'
      const mockFiles = {
        Contents: [
          { Key: 'evidence/file1.pdf', Size: 1024 },
          { Key: 'evidence/file2.pdf', Size: 2048 },
        ],
      }

      mockS3Instance.listObjectsV2 = jest.fn().mockReturnValue({
        promise: () => Promise.resolve(mockFiles),
      })

      const result = await s3Service.listFiles(prefix)

      expect(result).toHaveLength(2)
      expect(result[0].key).toBe('evidence/file1.pdf')
      expect(mockS3Instance.listObjectsV2).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Prefix: prefix,
        })
      )
    })

    it('should handle list operations errors', async () => {
      const prefix = 'evidence/'
      const listError = new Error('List failed')

      mockS3Instance.listObjectsV2 = jest.fn().mockReturnValue({
        promise: () => Promise.reject(listError),
      })

      await expect(s3Service.listFiles(prefix)).rejects.toThrow('List failed')
    })
  })

  describe('fileExists', () => {
    it('should check if file exists in S3', async () => {
      const fileKey = 'evidence/12345-uuid.pdf'

      mockS3Instance.headObject = jest.fn().mockReturnValue({
        promise: () => Promise.resolve({ ContentLength: 1024 }),
      })

      const exists = await s3Service.fileExists(fileKey)

      expect(exists).toBe(true)
      expect(mockS3Instance.headObject).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Key: fileKey,
        })
      )
    })

    it('should return false for non-existent files', async () => {
      const fileKey = 'evidence/nonexistent.pdf'
      const notFoundError = new Error('NotFound') as NodeJS.ErrnoException
      notFoundError.code = 'NotFound'

      mockS3Instance.headObject = jest.fn().mockReturnValue({
        promise: () => Promise.reject(notFoundError),
      })

      const exists = await s3Service.fileExists(fileKey)

      expect(exists).toBe(false)
    })
  })
})
