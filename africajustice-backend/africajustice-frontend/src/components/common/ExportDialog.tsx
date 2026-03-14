import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { addBreadcrumb } from '@/utils/sentry'
import {
  exportReportAsPDF,
  exportReportsAsPDF,
  exportReportsAsCSV,
  exportEvidenceAsCSV,
  exportVerificationsAsCSV,
  exportComprehensiveDataAsCSV,
  exportAnalyticsAsPDF,
  exportAnalyticsAsCSV,
} from '@/services/exportService'

interface ExportDialogProps {
  open: boolean
  onClose: () => void
  type: 'report' | 'reports' | 'analytics' | 'bulk'
  reportId?: string
  reportIds?: string[]
}

type ExportFormat = 'pdf' | 'csv'
type ExportDataType = 'reports' | 'evidence' | 'verifications' | 'comprehensive' | 'analytics'

export default function ExportDialog({
  open,
  onClose,
  type,
  reportId,
  reportIds = [],
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [dataType, setDataType] = useState<ExportDataType>('reports')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [includeEvidence, setIncludeEvidence] = useState(true)
  const [includeVerifications, setIncludeVerifications] = useState(true)

  const handleExport = async () => {
    try {
      setLoading(true)
      setError(null)

      addBreadcrumb(`Starting export: ${type}/${format}`, 'export', 'info')

      if (type === 'report' && reportId) {
        if (format === 'pdf') {
          await exportReportAsPDF(reportId)
        }
      } else if (type === 'reports' || type === 'bulk') {
        if (format === 'pdf') {
          await exportReportsAsPDF({ reportIds })
        } else if (format === 'csv') {
          if (dataType === 'comprehensive') {
            await exportComprehensiveDataAsCSV({ reportIds, startDate: startDate || undefined, endDate: endDate || undefined })
          } else if (dataType === 'evidence') {
            await exportEvidenceAsCSV(undefined, { startDate: startDate || undefined, endDate: endDate || undefined })
          } else if (dataType === 'verifications') {
            await exportVerificationsAsCSV(undefined, { startDate: startDate || undefined, endDate: endDate || undefined })
          } else {
            await exportReportsAsCSV({ reportIds, startDate: startDate || undefined, endDate: endDate || undefined })
          }
        }
      } else if (type === 'analytics') {
        if (format === 'pdf') {
          await exportAnalyticsAsPDF({ startDate: startDate || undefined, endDate: endDate || undefined })
        } else if (format === 'csv') {
          await exportAnalyticsAsCSV({ startDate: startDate || undefined, endDate: endDate || undefined })
        }
      }

      addBreadcrumb('Export completed successfully', 'export', 'info')
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed'
      setError(message)
      addBreadcrumb(`Export error: ${message}`, 'export', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Data</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Export Format Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Format
          </Typography>
          <RadioGroup value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
            <FormControlLabel value="pdf" control={<Radio />} label="PDF" disabled={type !== 'report' && type !== 'reports'} />
            <FormControlLabel value="csv" control={<Radio />} label="CSV" />
          </RadioGroup>
        </Box>

        {/* Data Type Selection (for CSV exports) */}
        {format === 'csv' && (type === 'bulk' || type === 'reports') && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Data Type
            </Typography>
            <RadioGroup
              value={dataType}
              onChange={(e) => setDataType(e.target.value as ExportDataType)}
            >
              <FormControlLabel
                value="reports"
                control={<Radio />}
                label="Reports Only"
              />
              <FormControlLabel
                value="evidence"
                control={<Radio />}
                label="Evidence Only"
              />
              <FormControlLabel
                value="verifications"
                control={<Radio />}
                label="Verifications Only"
              />
              <FormControlLabel
                value="comprehensive"
                control={<Radio />}
                label="All Data (Comprehensive)"
              />
            </RadioGroup>
          </Box>
        )}

        {/* Date Range Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Date Range (Optional)
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(date) => setStartDate(date)}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(date) => setEndDate(date)}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
            />
          </Box>
        </Box>

        {/* Options */}
        {(type === 'bulk' || type === 'reports') && format === 'csv' && dataType === 'comprehensive' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Include
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeEvidence}
                  onChange={(e) => setIncludeEvidence(e.target.checked)}
                />
              }
              label="Evidence"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeVerifications}
                  onChange={(e) => setIncludeVerifications(e.target.checked)}
                />
              }
              label="Verifications"
            />
          </Box>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          Your export will start downloading automatically.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
