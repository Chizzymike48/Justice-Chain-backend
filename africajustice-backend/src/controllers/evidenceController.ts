import { Response } from 'express'
import { Evidence } from '../models/Evidence'
import { AuthRequest } from '../middleware/auth'
import { s3Service } from '../services/s3Service'
import { virusScanService } from '../services/virusScanService'
import { initializeUploadEvents } from '../socket/uploadEvents'
import { getSocketServer } from '../socket/socketRegistry'

/**
 * Get presigned URL for direct S3 upload
 * Client gets a presigned URL and uploads directly to S3, reducing server bandwidth
 */
export const getPresignedUploadUrlController = async (req: AuthRequest, res: Response) => {
  try {
    const { fileName, contentType } = req.body as {
      fileName?: string
      contentType?: string
    }

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'fileName is required',
      })
    }

    // Generate presigned URL
    const presignedData = await s3Service.generatePresignedUrl(fileName, {
      contentType,
    })

    return res.json({
      success: true,
      data: {
        uploadUrl: presignedData.url,
        formFields: presignedData.fields,
        s3Key: presignedData.key,
        expiresIn: 3600, // 1 hour
      },
    })
  } catch (error) {
    console.error('[Evidence] Get presigned URL error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate presigned URL',
    })
  }
}

/**
 * Upload evidence with file (from form-data)
 * Server handles upload to S3, virus scanning, and indexing
 */
export const uploadEvidenceController = async (req: AuthRequest, res: Response) => {
  const uploadStartTime = Date.now()
  
  try {
    const { caseId, sourceNote } = req.body as {
      caseId?: string
      sourceNote?: string
    }

    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: 'caseId is required',
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      })
    }

    // Create evidence record (placeholder until S3 upload succeeds)
    const evidence = await Evidence.create({
      caseId,
      fileName: req.file.originalname,
      sourceNote: sourceNote || '',
      status: 'uploading',
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: (req.user as any)?.email || 'unknown',
      uploadProgress: 10, // Starting progress
    })

    const socketEvents = initializeUploadEvents(getSocketServer())

    // Emit upload started
    socketEvents.emitUploadStarted((req.user as any)?.id, {
      evidenceId: evidence._id.toString(),
      fileName: req.file.originalname,
      fileSize: req.file.size,
    })

    try {
      // Step 1: Virus scan
      socketEvents.emitVirusScanStarted((req.user as any)?.id, {
        evidenceId: evidence._id.toString(),
        fileName: req.file.originalname,
      })

      const scanResult = await virusScanService.scanFile(
        req.file.buffer,
        req.file.originalname
      )

      // Update with scan result
      evidence.virusScanResult = scanResult
      evidence.uploadProgress = 40

      if (!scanResult.clean) {
        // Virus detected - mark as infected and reject
        console.warn(`[Evidence] Virus detected: ${scanResult.threat}`)
        evidence.status = 'rejected'
        await evidence.save()

        socketEvents.emitVirusScanCompleted((req.user as any)?.id, {
          evidenceId: evidence._id.toString(),
          fileName: req.file.originalname,
          clean: false,
          threat: scanResult.threat,
          scanTime: scanResult.scanTime,
        })

        socketEvents.emitUploadFailed((req.user as any)?.id, {
          evidenceId: evidence._id.toString(),
          fileName: req.file.originalname,
          error: `Malware detected: ${scanResult.threat}`,
          errorCode: 'MALWARE_DETECTED',
        })

        return res.status(400).json({
          success: false,
          message: 'File failed virus scan',
          data: evidence.toJSON(),
        })
      }

      // Emit scan completed
      socketEvents.emitVirusScanCompleted((req.user as any)?.id, {
        evidenceId: evidence._id.toString(),
        fileName: req.file.originalname,
        clean: true,
        scanTime: scanResult.scanTime,
      })

      // Step 2: Upload to S3
      evidence.uploadProgress = 50
      await evidence.save()

      const s3Result = await s3Service.uploadFile(
        req.file.buffer,
        req.file.originalname,
        {
          prefix: `evidence/${caseId}`,
          contentType: req.file.mimetype,
        }
      )

      // Update evidence with S3 info
      evidence.s3Key = s3Result.key
      evidence.s3Url = s3Result.url
      evidence.uploadProgress = 95
      evidence.uploadedAt = new Date()
      await evidence.save()

      // Step 3: Update status to queued (waiting for moderation)
      evidence.status = 'queued'
      evidence.uploadProgress = 100
      await evidence.save()

      const uploadTime = Date.now() - uploadStartTime

      // Emit upload completed
      socketEvents.emitUploadCompleted((req.user as any)?.id, {
        evidenceId: evidence._id.toString(),
        fileName: req.file.originalname,
        s3Url: s3Result.url,
        fileSize: req.file.size,
        uploadTime,
      })

      // Broadcast to moderators floor
      socketEvents.emitEvidenceUploaded({
        evidenceId: evidence._id.toString(),
        caseId,
        fileName: req.file.originalname,
        uploadedBy: (req.user as any)?.email || 'unknown',
        uploadedAt: new Date(),
      })

      return res.status(201).json({
        success: true,
        data: evidence.toJSON(),
        uploadTime,
      })
    } catch (uploadError) {
      console.error('[Evidence] S3 upload error:', uploadError)

      // Mark as failed
      evidence.status = 'failed'
      evidence.uploadProgress = 0
      await evidence.save()

      socketEvents.emitUploadFailed((req.user as any)?.id, {
        evidenceId: evidence._id.toString(),
        fileName: req.file.originalname,
        error: 'Upload to S3 failed',
        errorCode: 'S3_UPLOAD_FAILED',
      })

      return res.status(500).json({
        success: false,
        message: 'Failed to upload to S3',
        data: evidence.toJSON(),
      })
    }
  } catch (error) {
    console.error('[Evidence] Upload evidence error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to upload evidence',
    })
  }
}

export const getEvidenceController = async (req: any, res: Response) => {
  try {
    const queryLimit = req.query.limit as string | undefined
    const querySkip = req.query.skip as string | undefined
    const { caseId, status } = req.query as {
      caseId?: string
      status?: string
    }

    const filters: { caseId?: string; status?: string } = {}
    if (caseId) filters.caseId = caseId
    if (status) filters.status = status

    const parsedLimit = Math.max(1, queryLimit ? parseInt(queryLimit) : 20)
    const parsedSkip = Math.max(0, querySkip ? parseInt(querySkip) : 0)
    const total = await Evidence.countDocuments(filters)
    const evidence = await Evidence.find(filters)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip(parsedSkip)

    return res.json({
      success: true,
      data: evidence.map((e) => e.toJSON()),
      pagination: {
        total,
        limit: parsedLimit,
        skip: parsedSkip,
      },
    })
  } catch (error) {
    console.error('Get evidence error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve evidence.',
    })
  }
}

export const getEvidenceByIdController = async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const evidence = await Evidence.findById(id)

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: 'Evidence not found.',
      })
    }

    return res.json({
      success: true,
      data: evidence.toJSON(),
    })
  } catch (error) {
    console.error('Get evidence error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve evidence.',
    })
  }
}

export const updateEvidenceStatusController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body as { status?: string }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'status is required.',
      })
    }

    const evidence = await Evidence.findByIdAndUpdate(id, { status }, { new: true })

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: 'Evidence not found.',
      })
    }

    return res.json({
      success: true,
      data: evidence.toJSON(),
    })
  } catch (error) {
    console.error('Update evidence error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update evidence.',
    })
  }
}

/**
 * Download evidence file (generates signed URL)
 */
export const downloadEvidenceController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const evidence = await Evidence.findById(id)
    if (!evidence || !evidence.s3Key) {
      return res.status(404).json({
        success: false,
        message: 'Evidence not found or not uploaded',
      })
    }

    // Generate signed download URL (expires in 1 hour)
    const downloadUrl = await s3Service.generateSignedDownloadUrl(
      evidence.s3Key,
      3600
    )

    return res.json({
      success: true,
      data: {
        downloadUrl,
        fileName: evidence.fileName,
        expiresIn: 3600,
      },
    })
  } catch (error) {
    console.error('[Evidence] Download error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate download link',
    })
  }
}

/**
 * Delete evidence file from S3
 */
export const deleteEvidenceController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const evidence = await Evidence.findById(id)
    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: 'Evidence not found',
      })
    }

    // Delete from S3 if exists
    if (evidence.s3Key) {
      try {
        await s3Service.deleteFile(evidence.s3Key)
        console.log(`[Evidence] Deleted from S3: ${evidence.s3Key}`)
      } catch (err) {
        console.warn(`[Evidence] Failed to delete from S3: ${evidence.s3Key}`)
      }
    }

    // Delete from database
    await Evidence.findByIdAndDelete(id)

    return res.json({
      success: true,
      message: 'Evidence deleted',
    })
  } catch (error) {
    console.error('[Evidence] Delete error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to delete evidence',
    })
  }
}
