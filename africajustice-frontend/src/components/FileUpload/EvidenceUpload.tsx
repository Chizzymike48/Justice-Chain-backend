import React, { useRef, useState } from 'react'
import { Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { useFileUpload } from '../../hooks/useFileUpload'
import { evidenceUploadService } from '../../services/evidenceUploadService'
import './EvidenceUpload.css'

export interface EvidenceUploadProps {
  caseId: string
  onUploadSuccess?: (evidenceId: string) => void
  onUploadError?: (error: string) => void
  disabled?: boolean
  maxSize?: number // bytes
}

/**
 * Evidence Upload Component
 * Provides drag-drop file upload with progress tracking and virus scanning feedback
 */
export const EvidenceUploadComponent: React.FC<EvidenceUploadProps> = ({
  caseId,
  onUploadSuccess,
  onUploadError,
  disabled = false,
  maxSize = 500 * 1024 * 1024, // 500MB default
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [sourceNote, setSourceNote] = useState('')
  const { state, upload, reset } = useFileUpload()

  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    try {
      const result = await upload(file, caseId, sourceNote)
      onUploadSuccess?.(result.evidenceId)
      setSourceNote('')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      onUploadError?.(errorMessage)
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && state.status === 'idle') {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (!disabled && state.status === 'idle') {
      const files = e.dataTransfer.files
      handleFileChange(files)
    }
  }

  const handleClick = () => {
    if (!disabled && state.status === 'idle') {
      fileInputRef.current?.click()
    }
  }

  const getStatusMessage = (): string => {
    switch (state.status) {
      case 'validating':
        return 'Validating file...'
      case 'getting-presigned-url':
        return 'Preparing upload...'
      case 'uploading':
        return `Uploading: ${state.progress}%`
      case 'scanning':
        return 'Scanning for viruses...'
      case 'registering':
        return 'Registering file...'
      case 'completed':
        return 'Upload completed!'
      case 'error':
        return `Error: ${state.error}`
      default:
        return 'Select a file to upload'
    }
  }

  const getStatusColor = (): string => {
    switch (state.status) {
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'idle':
        return isDragging ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-dashed'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const isLoading = state.status !== 'idle' && state.status !== 'completed' && state.status !== 'error'

  return (
    <div className="evidence-upload-container">
      <div className="upload-form">
        {/* Upload Zone */}
        <div
          className={`upload-zone border-2 rounded-lg transition-all ${getStatusColor()}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={handleClick}
          aria-label="Upload zone"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => handleFileChange(e.target.files)}
            disabled={disabled || isLoading}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.mp3,.wav,.txt,.doc,.docx,.xls,.xlsx"
          />

          {state.status === 'idle' && (
            <div className="upload-idle-content">
              <Upload className={`upload-icon ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
              <h3 className="upload-title">
                {isDragging ? 'Drop file here' : 'Drag & drop your evidence file'}
              </h3>
              <p className="upload-subtitle">or click to browse</p>
              <p className="upload-info text-xs text-gray-500">
                Maximum size: {evidenceUploadService.formatFileSize(maxSize)}
              </p>
            </div>
          )}

          {state.status === 'completed' && (
            <div className="upload-completed-content">
              <CheckCircle className="upload-icon text-green-500" />
              <h3 className="upload-title text-green-700">Upload successful!</h3>
              <p className="upload-subtitle text-green-600">
                {state.file?.name} uploaded successfully
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  reset()
                }}
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
              >
                Upload Another File
              </button>
            </div>
          )}

          {state.status === 'error' && (
            <div className="upload-error-content">
              <AlertCircle className="upload-icon text-red-500" />
              <h3 className="upload-title text-red-700">Upload failed</h3>
              <p className="upload-subtitle text-red-600">{state.error}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  reset()
                }}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {isLoading && (
            <div className="upload-progress-content">
              <Loader className="upload-icon text-blue-500 animate-spin" />
              <h3 className="upload-title">{getStatusMessage()}</h3>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${state.progress}%` }}
                />
              </div>
              <p className="progress-text">{state.progress}%</p>
            </div>
          )}
        </div>

        {/* Source Note Field */}
        {state.status === 'idle' && (
          <div className="mt-4">
            <label htmlFor="sourceNote" className="block text-sm font-medium text-gray-700 mb-2">
              Source Note (Optional)
            </label>
            <textarea
              id="sourceNote"
              value={sourceNote}
              onChange={(e) => setSourceNote(e.target.value)}
              placeholder="Add any notes about the source of this evidence..."
              rows={3}
              maxLength={500}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">{sourceNote.length}/500</p>
          </div>
        )}

        {/* File Info Display */}
        {state.file && state.status !== 'idle' && (
          <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">File Details</h4>
            <dl className="divide-y divide-gray-200">
              <div className="flex justify-between py-2">
                <dt className="text-sm text-gray-600">Name:</dt>
                <dd className="text-sm font-medium text-gray-900">{state.file.name}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-sm text-gray-600">Size:</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {evidenceUploadService.formatFileSize(state.file.size)}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-sm text-gray-600">Type:</dt>
                <dd className="text-sm font-medium text-gray-900">{state.file.type || 'Unknown'}</dd>
              </div>
              {isLoading && (
                <div className="flex justify-between py-2">
                  <dt className="text-sm text-gray-600">Status:</dt>
                  <dd className="text-sm font-medium text-blue-600 capitalize">{state.status}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Status Messages */}
        {state.status === 'uploading' && state.file && (
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-800">
              {state.progress < 100
                ? `Uploading ${state.file.name}... ${state.progress}% complete`
                : 'Upload complete, processing file...'}
            </p>
          </div>
        )}

        {state.status === 'scanning' && (
          <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
            <p className="text-sm text-yellow-800">
              🛡️ Scanning file for viruses and malware... This may take a moment.
            </p>
          </div>
        )}

        {state.status === 'registering' && (
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-800">
              Registering file with the platform...
            </p>
          </div>
        )}

        {state.status === 'completed' && state.file && (
          <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
            <p className="text-sm text-green-800">
              ✓ {state.file.name} has been uploaded and is pending moderation.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EvidenceUploadComponent
