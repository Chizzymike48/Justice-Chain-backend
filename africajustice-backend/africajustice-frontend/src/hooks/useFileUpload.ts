import { useState, useCallback, useRef } from 'react'
import { evidenceUploadService } from '../services/evidenceUploadService'

export type UploadStatus = 'idle' | 'validating' | 'getting-presigned-url' | 'uploading' | 'scanning' | 'registering' | 'completed' | 'error'

export interface UploadState {
  progress: number
  status: UploadStatus
  error: string | null
  file: File | null
}

export interface UseFileUploadReturn {
  state: UploadState
  upload: (file: File, caseId: string, sourceNote?: string) => Promise<{ evidenceId: string }>
  cancel: () => void
  reset: () => void
}

/**
 * Custom React Hook for File Upload
 * Manages upload progress, status, and errors
 */
export const useFileUpload = (): UseFileUploadReturn => {
  const [state, setState] = useState<UploadState>({
    progress: 0,
    status: 'idle',
    error: null,
    file: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  const updateState = useCallback((partial: Partial<UploadState>) => {
    setState((prev) => ({ ...prev, ...partial }))
  }, [])

  const reset = useCallback(() => {
    setState({
      progress: 0,
      status: 'idle',
      error: null,
      file: null,
    })
  }, [])

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    reset()
  }, [reset])

  const upload = useCallback(
    async (
      file: File,
      caseId: string,
      sourceNote?: string
    ): Promise<{ evidenceId: string }> => {
      try {
        // Reset state
        reset()

        // Validate file
        updateState({ file, status: 'validating' })
        const validation = evidenceUploadService.validateFile(file)

        if (!validation.valid) {
          updateState({
            error: validation.error || 'File validation failed',
            status: 'error',
          })
          throw new Error(validation.error)
        }

        // Upload file
        const result = await evidenceUploadService.smartUpload(file, {
          caseId,
          sourceNote,
          onProgress: (progress) => {
            updateState({ progress, status: 'uploading' })
          },
          onStatusChange: (status) => {
            updateState({ status: status as UploadStatus })
          },
        })

        // Success
        updateState({
          progress: 100,
          status: 'completed',
          error: null,
        })

        return { evidenceId: result.evidenceId }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed'
        updateState({
          error: errorMessage,
          status: 'error',
        })
        throw err
      }
    },
    [reset, updateState]
  )

  return {
    state,
    upload,
    cancel,
    reset,
  }
}

export default useFileUpload
