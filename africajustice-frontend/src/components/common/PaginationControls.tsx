import { FC } from 'react'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

/**
 * PaginationControls - Displays navigation controls for paginated lists
 * Shows previous/next buttons and current page info
 */
const PaginationControls: FC<PaginationControlsProps> = ({ currentPage, totalPages, onPageChange, isLoading = false }) => {
  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        marginTop: '1rem',
      }}
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrevious || isLoading}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: canGoPrevious ? '#1f1f1f' : '#ccc',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: canGoPrevious ? 'pointer' : 'not-allowed',
          opacity: canGoPrevious ? 1 : 0.6,
        }}
      >
        ← Previous
      </button>

      <span style={{ fontSize: '0.9rem', color: '#666' }}>
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext || isLoading}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: canGoNext ? '#1f1f1f' : '#ccc',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: canGoNext ? 'pointer' : 'not-allowed',
          opacity: canGoNext ? 1 : 0.6,
        }}
      >
        Next →
      </button>
    </div>
  )
}

export default PaginationControls
