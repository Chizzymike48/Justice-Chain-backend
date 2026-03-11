import { Request, Response } from 'express'
import * as evidenceController from '../../src/controllers/evidenceController'
import Evidence from '../../src/models/Evidence'
import Report from '../../src/models/Report'
import { S3Service } from '../../src/services/s3Service'
import { virusScan } from '../../src/services/virusScanService'

// Mock models and services
jest.mock('../../src/models/Evidence')
jest.mock('../../src/models/Report')
jest.mock('../../src/services/s3Service')
jest.mock('../../src/services/virusScanService')

describe('Evidence Controller - Upload & Integration Tests', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let mockS3Service: jest.Mocked<S3Service>

  beforeEach(() => {
    jest.clearAllMocks()
    req = {
      query: {},
      body: {},
      user: { id: 'user-123', role: 'reporter' },
      file: {
        originalname: 'evidence.pdf',
        buffer: Buffer.from('fake file content'),
        mimetype: 'application/pdf',
        size: 1024,
      },
      files: [],
    }
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    }

    mockS3Service = new S3Service() as jest.Mocked<S3Service>
  })

  describe('uploadEvidenceController', () => {
    it('should upload evidence file successfully', async () => {
      const mockEvidenceData = {
        _id: 'evidence-123',
        reportId: 'report-456',
        fileName: 'evidence.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        s3Key: 'evidence/12345-uuid.pdf',
        uploadedBy: 'user-123',
        uploadedAt: new Date(),
        status: 'pending',
      }

      ;(virusScan as jest.Mock).mockResolvedValue({ clean: true })
      ;(mockS3Service.uploadFile as jest.Mock).mockResolvedValue({
        key: 'evidence/12345-uuid.pdf',
        url: 'https://bucket.s3.amazonaws.com/evidence/12345-uuid.pdf',
        bucket: 'test-bucket',
      })
      ;(Evidence.create as jest.Mock).mockResolvedValue(mockEvidenceData)

      await evidenceController.uploadEvidenceController(
        req as Request,
        res as Response
      )

      expect(virusScan).toHaveBeenCalledWith(req.file.buffer)
      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(
        req.file.buffer,
        req.file.originalname,
        expect.any(Object)
      )
      expect(Evidence.create).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          evidence: mockEvidenceData,
        })
      )
    })

    it('should reject infected files', async () => {
      (virusScan as jest.Mock).mockResolvedValue({ clean: false, threat: 'Trojan.Generic' })

      await evidenceController.uploadEvidenceController(
        req as Request,
        res as Response
      )

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('virus'),
        })
      )
    })

    it('should validate file size before upload', async () => {
      req.file.size = 600 * 1024 * 1024 // 600MB - exceeds limit
      const maxSize = 500 * 1024 * 1024

      await evidenceController.uploadEvidenceController(
        req as Request,
        res as Response
      )

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('File size exceeds'),
        })
      )
    })

    it('should handle S3 upload failures gracefully', async () => {
      const uploadError = new Error('S3 upload failed')
      ;(virusScan as jest.Mock).mockResolvedValue({ clean: true })
      ;(mockS3Service.uploadFile as jest.Mock).mockRejectedValue(uploadError)

      await evidenceController.uploadEvidenceController(
        req as Request,
        res as Response
      )

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to upload file',
        })
      )
    })

    it('should associate evidence with report', async () => {
      req.body.reportId = 'report-456'
      const mockEvidenceData = {
        _id: 'evidence-123',
        reportId: 'report-456',
        fileName: 'evidence.pdf',
      }

      ;(virusScan as jest.Mock).mockResolvedValue({ clean: true })
      ;(mockS3Service.uploadFile as jest.Mock).mockResolvedValue({
        key: 'evidence/12345-uuid.pdf',
        url: 'https://bucket.s3.amazonaws.com/evidence/12345-uuid.pdf',
      })
      ;(Evidence.create as jest.Mock).mockResolvedValue(mockEvidenceData)
      ;(Report.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

      await evidenceController.uploadEvidenceController(
        req as Request,
        res as Response
      )

      expect(Report.findByIdAndUpdate).toHaveBeenCalledWith(
        'report-456',
        expect.objectContaining({
          $push: { evidence: 'evidence-123' },
        })
      )
    })
  })

  describe('batchUploadEvidenceController', () => {
    it('should upload multiple files', async () => {
      req.files = [
        {
          originalname: 'file1.pdf',
          buffer: Buffer.from('content1'),
          mimetype: 'application/pdf',
          size: 1024,
        },
        {
          originalname: 'file2.pdf',
          buffer: Buffer.from('content2'),
          mimetype: 'application/pdf',
          size: 2048,
        },
      ] as any

      ;(virusScan as jest.Mock).mockResolvedValue({ clean: true })
      ;(mockS3Service.uploadFile as jest.Mock).mockResolvedValue({
        key: 'evidence/uuid.pdf',
        url: 'https://bucket.s3.amazonaws.com/evidence/uuid.pdf',
      })
      ;(Evidence.create as jest.Mock)
        .mockResolvedValueOnce({ _id: 'ev-1', fileName: 'file1.pdf' })
        .mockResolvedValueOnce({ _id: 'ev-2', fileName: 'file2.pdf' })

      await evidenceController.batchUploadEvidenceController(
        req as Request,
        res as Response
      )

      expect(virusScan).toHaveBeenCalledTimes(2)
      expect(mockS3Service.uploadFile).toHaveBeenCalledTimes(2)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          uploadedCount: 2,
        })
      )
    })

    it('should handle mixed success/failure in batch upload', async () => {
      req.files = [
        {
          originalname: 'safe.pdf',
          buffer: Buffer.from('content'),
          mimetype: 'application/pdf',
          size: 1024,
        },
        {
          originalname: 'infected.pdf',
          buffer: Buffer.from('malware'),
          mimetype: 'application/pdf',
          size: 1024,
        },
      ] as any

      ;(virusScan as jest.Mock)
        .mockResolvedValueOnce({ clean: true })
        .mockResolvedValueOnce({ clean: false, threat: 'Trojan' })

      await evidenceController.batchUploadEvidenceController(
        req as Request,
        res as Response
      )

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          uploadedCount: 1,
          failedCount: 1,
          failed: expect.arrayContaining([
            expect.objectContaining({
              fileName: 'infected.pdf',
              reason: expect.stringContaining('virus'),
            }),
          ]),
        })
      )
    })
  })

  describe('generatePresignedUploadUrlController', () => {
    it('should generate presigned URL for direct browser upload', async () => {
      req.body.fileName = 'document.pdf'
      req.body.fileType = 'application/pdf'

      ;(mockS3Service.generatePresignedUrl as jest.Mock).mockResolvedValue({
        url: 'https://bucket.s3.amazonaws.com/',
        fields: {
          key: 'evidence/12345-uuid.pdf',
          'Content-Type': 'application/pdf',
        },
        key: 'evidence/12345-uuid.pdf',
      })

      await evidenceController.generatePresignedUploadUrlController(
        req as Request,
        res as Response
      )

      expect(mockS3Service.generatePresignedUrl).toHaveBeenCalledWith(
        'document.pdf',
        expect.any(Object)
      )
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          presignedUrl: expect.any(String),
          key: expect.any(String),
        })
      )
    })

    it('should validate file type for presigned URL', async () => {
      req.body.fileName = 'script.exe'
      req.body.fileType = 'application/x-executable'

      await evidenceController.generatePresignedUploadUrlController(
        req as Request,
        res as Response
      )

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('File type not allowed'),
        })
      )
    })
  })

  describe('getEvidenceDownloadUrlController', () => {
    it('should generate signed download URL for evidence', async () => {
      const mockEvidenceData = {
        _id: 'evidence-123',
        s3Key: 'evidence/12345-uuid.pdf',
        uploadedBy: 'user-123',
      }

      ;(Evidence.findById as jest.Mock).mockResolvedValue(mockEvidenceData)
      ;(mockS3Service.getSignedDownloadUrl as jest.Mock).mockResolvedValue(
        'https://bucket.s3.amazonaws.com/evidence/12345-uuid.pdf?...'
      )

      req.params = { id: 'evidence-123' }

      await evidenceController.getEvidenceDownloadUrlController(
        req as Request,
        res as Response
      )

      expect(evidence.findById).toHaveBeenCalledWith('evidence-123')
      expect(mockS3Service.getSignedDownloadUrl).toHaveBeenCalledWith(
        'evidence/12345-uuid.pdf'
      )
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          downloadUrl: expect.any(String),
        })
      )
    })

    it('should return 404 for non-existent evidence', async () => {
      (Evidence.findById as jest.Mock).mockResolvedValue(null)
      req.params = { id: 'invalid-id' }

      await evidenceController.getEvidenceDownloadUrlController(
        req as Request,
        res as Response
      )

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Evidence not found',
        })
      )
    })
  })

  describe('deleteEvidenceController', () => {
    it('should delete evidence and remove from S3', async () => {
      const mockEvidenceData = {
        _id: 'evidence-123',
        s3Key: 'evidence/12345-uuid.pdf',
      }

      ;(Evidence.findById as jest.Mock).mockResolvedValue(mockEvidenceData)
      ;(mockS3Service.deleteFile as jest.Mock).mockResolvedValue({})
      ;(Evidence.findByIdAndDelete as jest.Mock).mockResolvedValue(mockEvidenceData)

      req.params = { id: 'evidence-123' }

      await evidenceController.deleteEvidenceController(
        req as Request,
        res as Response
      )

      expect(mockS3Service.deleteFile).toHaveBeenCalledWith('evidence/12345-uuid.pdf')
      expect(Evidence.findByIdAndDelete).toHaveBeenCalledWith('evidence-123')
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Evidence deleted successfully',
        })
      )
    })

    it('should handle S3 deletion errors gracefully', async () => {
      const mockEvidenceData = {
        _id: 'evidence-123',
        s3Key: 'evidence/12345-uuid.pdf',
      }

      ;(Evidence.findById as jest.Mock).mockResolvedValue(mockEvidenceData)
      ;(mockS3Service.deleteFile as jest.Mock).mockRejectedValue(
        new Error('S3 deletion failed')
      )

      req.params = { id: 'evidence-123' }

      await evidenceController.deleteEvidenceController(
        req as Request,
        res as Response
      )

      // Should still delete from DB even if S3 fails
      expect(Evidence.findByIdAndDelete).toHaveBeenCalled()
    })
  })

  describe('getEvidenceByReportController', () => {
    it('should retrieve all evidence for a report', async () => {
      const mockEvidence = [
        { _id: 'ev-1', fileName: 'file1.pdf', status: 'approved' },
        { _id: 'ev-2', fileName: 'file2.pdf', status: 'pending' },
      ]

      ;(Evidence.find as jest.Mock).mockResolvedValue(mockEvidence)

      req.params = { reportId: 'report-456' }

      await evidenceController.getEvidenceByReportController(
        req as Request,
        res as Response
      )

      expect(Evidence.find).toHaveBeenCalledWith({ reportId: 'report-456' })
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          evidence: mockEvidence,
          total: 2,
        })
      )
    })
  })
})
