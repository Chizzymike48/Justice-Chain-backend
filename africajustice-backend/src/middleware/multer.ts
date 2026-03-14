import multer from 'multer'
import { Request, Response, NextFunction } from 'express'

// Memory storage for processing (S3 upload happens afterward)
const storage = multer.memoryStorage()

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
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

// File size limit: 500MB for evidence files
const FILE_SIZE_LIMIT = 500 * 1024 * 1024

// File filter function
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile?: boolean) => void
): void => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`))
  }

  cb(null, true)
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMIT,
    files: 1,
  },
})

/**
 * Validate uploaded file
 */
export const validateUploadedFile = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'No file uploaded',
    })
    return
  }

  if (req.file.size > FILE_SIZE_LIMIT) {
    res.status(413).json({
      success: false,
      message: `File too large. Maximum size: ${FILE_SIZE_LIMIT / (1024 * 1024)}MB`,
    })
    return
  }

  next()
}

export default upload
