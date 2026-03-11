import axios from 'axios'
import { evidenceUploadService } from '../../src/services/evidenceUploadService'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('Evidence Upload Service - Frontend Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('uploadFile', () => {
    it('should upload file with progress tracking', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const progressCallback = jest.fn()

      mockedAxios.post.mockResolvedValue({
        data: {
          success: true,
          evidence: {
            _id: 'evidence-123',
            fileName: 'test.pdf',
            s3Key: 'evidence/uuid.pdf',
            status: 'pending',
          },
        },
      })

      const result = await evidenceUploadService.uploadFile(file, 'report-456', progressCallback)

      expect(result._id).toBe('evidence-123')
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/evidence/upload'),
        expect.any(FormData),
        expect.objectContaining({
          onUploadProgress: expect.any(Function),
        })
      )
    })

    it('should track upload progress', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const progressCallback = jest.fn()

      let capturedProgressHandler: ((event: any) => void) | null = null

      mockedAxios.post.mockImplementation((url, data, config) => {
        capturedProgressHandler = config?.onUploadProgress
        return Promise.resolve({
          data: {
            success: true,
            evidence: { _id: 'evidence-123' },
          },
        })
      })

      await evidenceUploadService.uploadFile(file, 'report-456', progressCallback)

      // Simulate progress event
      if (capturedProgressHandler) {
        capturedProgressHandler({ loaded: 50, total: 100 })
      }

      expect(progressCallback).toHaveBeenCalledWith(50)
    })

    it('should validate file size before upload', async () => {
      const largeFile = new File(
        [new ArrayBuffer(600 * 1024 * 1024)], // 600MB
        'large.pdf',
        { type: 'application/pdf' }
      )

      await expect(
        evidenceUploadService.uploadFile(largeFile, 'report-456')
      ).rejects.toThrow('File size exceeds')
    })

    it('should validate file type', async () => {
      const invalidFile = new File(['content'], 'script.exe', {
        type: 'application/x-executable',
      })

      await expect(
        evidenceUploadService.uploadFile(invalidFile, 'report-456')
      ).rejects.toThrow('File type not allowed')
    })

    it('should handle upload errors gracefully', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      mockedAxios.post.mockRejectedValue(new Error('Upload failed'))

      await expect(
        evidenceUploadService.uploadFile(file, 'report-456')
      ).rejects.toThrow('Upload failed')
    })
  })

  describe('generatePresignedUrl', () => {
    it('should generate presigned URL for direct S3 upload', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          success: true,
          presignedUrl: 'https://bucket.s3.amazonaws.com/',
          key: 'evidence/uuid.pdf',
          fields: {
            key: 'evidence/uuid.pdf',
            'Content-Type': 'application/pdf',
          },
        },
      })

      const result = await evidenceUploadService.generatePresignedUrl(
        'test.pdf',
        'application/pdf'
      )

      expect(result.presignedUrl).toBeDefined()
      expect(result.key).toBe('evidence/uuid.pdf')
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/evidence/presigned-url'),
        expect.any(Object)
      )
    })

    it('should handle presigned URL generation errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Generation failed'))

      await expect(
        evidenceUploadService.generatePresignedUrl('test.pdf', 'application/pdf')
      ).rejects.toThrow()
    })
  })

  describe('uploadToPresignedUrl', () => {
    it('should upload file directly to S3 using presigned URL', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const presignedUrl = 'https://bucket.s3.amazonaws.com/'
      const fields = { key: 'evidence/uuid.pdf', 'Content-Type': 'application/pdf' }

      mockedAxios.post.mockResolvedValue({
        status: 204, // S3 returns 204 No Content on success
      })

      await evidenceUploadService.uploadToPresignedUrl(file, presignedUrl, fields)

      expect(mockedAxios.post).toHaveBeenCalledWith(
        presignedUrl,
        expect.any(FormData),
        expect.any(Object)
      )
    })

    it('should handle S3 direct upload errors', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      mockedAxios.post.mockRejectedValue(new Error('S3 upload failed'))

      await expect(
        evidenceUploadService.uploadToPresignedUrl(
          file,
          'https://invalid.s3.amazonaws.com/',
          {}
        )
      ).rejects.toThrow()
    })
  })

  describe('getDownloadUrl', () => {
    it('should get signed download URL for evidence', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          success: true,
          downloadUrl:
            'https://bucket.s3.amazonaws.com/evidence/uuid.pdf?signature=...',
        },
      })

      const url = await evidenceUploadService.getDownloadUrl('evidence-123')

      expect(url).toContain('s3.amazonaws.com')
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/evidence/evidence-123/download-url')
      )
    })
  })

  describe('deleteEvidence', () => {
    it('should delete evidence file', async () => {
      mockedAxios.delete.mockResolvedValue({
        data: {
          success: true,
          message: 'Evidence deleted',
        },
      })

      const result = await evidenceUploadService.deleteEvidence('evidence-123')

      expect(result.success).toBe(true)
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/api/evidence/evidence-123')
      )
    })

    it('should handle deletion errors', async () => {
      mockedAxios.delete.mockRejectedValue(new Error('Deletion failed'))

      await expect(evidenceUploadService.deleteEvidence('evidence-123')).rejects.toThrow()
    })
  })

  describe('batchUpload', () => {
    it('should upload multiple files', async () => {
      const files = [
        new File(['content1'], 'file1.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'file2.pdf', { type: 'application/pdf' }),
      ]
      const progressCallback = jest.fn()

      mockedAxios.post.mockResolvedValue({
        data: {
          success: true,
          uploadedCount: 2,
          evidence: [
            { _id: 'ev-1', fileName: 'file1.pdf' },
            { _id: 'ev-2', fileName: 'file2.pdf' },
          ],
        },
      })

      const result = await evidenceUploadService.batchUpload(
        files,
        'report-456',
        progressCallback
      )

      expect(result.uploadedCount).toBe(2)
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/evidence/batch-upload'),
        expect.any(FormData),
        expect.any(Object)
      )
    })

    it('should handle mixed success/failure in batch upload', async () => {
      const files = [
        new File(['safe'], 'safe.pdf', { type: 'application/pdf' }),
        new File(['malware'], 'infected.pdf', { type: 'application/pdf' }),
      ]

      mockedAxios.post.mockResolvedValue({
        data: {
          success: false,
          uploadedCount: 1,
          failedCount: 1,
          failed: [
            {
              fileName: 'infected.pdf',
              reason: 'Virus detected: Trojan.Generic',
            },
          ],
        },
      })

      const result = await evidenceUploadService.batchUpload(files, 'report-456')

      expect(result.uploadedCount).toBe(1)
      expect(result.failedCount).toBe(1)
    })
  })

  describe('getFileMetadata', () => {
    it('should retrieve evidence file metadata', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          success: true,
          evidence: {
            _id: 'evidence-123',
            fileName: 'document.pdf',
            fileSize: 102400,
            fileType: 'application/pdf',
            status: 'approved',
            uploadedAt: '2024-03-06T10:00:00Z',
            uploadedBy: 'user-123',
          },
        },
      })

      const metadata = await evidenceUploadService.getFileMetadata('evidence-123')

      expect(metadata._id).toBe('evidence-123')
      expect(metadata.fileSize).toBe(102400)
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/evidence/evidence-123')
      )
    })
  })

  describe('validateAllowedFileTypes', () => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']

    it('should validate allowed file types', () => {
      expect(
        evidenceUploadService.validateAllowedFileTypes('test.pdf', allowedTypes)
      ).toBe(true)
    })

    it('should reject disallowed file types', () => {
      expect(
        evidenceUploadService.validateAllowedFileTypes('script.exe', allowedTypes)
      ).toBe(false)
    })
  })

  describe('formatFileSize', () => {
    it('should format file size in human readable format', () => {
      expect(evidenceUploadService.formatFileSize(1024)).toBe('1 KB')
      expect(evidenceUploadService.formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(evidenceUploadService.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })
  })

  describe('Error Recovery', () => {
    it('should retry failed upload', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      mockedAxios.post
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: {
            success: true,
            evidence: { _id: 'evidence-123' },
          },
        })

      // First attempt fails, retry succeeds
      let result
      try {
        result = await evidenceUploadService.uploadFile(file, 'report-456')
      } catch (e) {
        // First call failed
        result = await evidenceUploadService.uploadFile(file, 'report-456')
      }

      expect(result._id).toBe('evidence-123')
    })
  })

  describe('Concurrent Uploads', () => {
    it('should handle concurrent file uploads', async () => {
      const files = Array.from({ length: 5 }, (_, i) =>
        new File([`content${i}`], `file${i}.pdf`, { type: 'application/pdf' })
      )

      mockedAxios.post.mockResolvedValue({
        data: {
          success: true,
          evidence: { _id: 'evidence-123' },
        },
      })

      const uploads = files.map(file =>
        evidenceUploadService.uploadFile(file, 'report-456')
      )

      const results = await Promise.all(uploads)

      expect(results).toHaveLength(5)
      expect(mockedAxios.post).toHaveBeenCalledTimes(5)
    })
  })
})
