# Data Export - Quick Reference Guide

## 🚀 Quick Start

### Backend Routes Ready ✅
All 8 export endpoints are now available at `/api/v1/export/`

### Frontend UI Ready ✅
Use `ExportDialog` component to trigger exports

### Dependencies
```bash
# Backend
npm install pdfkit json2csv

# Frontend
# Already included with @mui/x-date-pickers
```

---

## 📲 Frontend Usage

### Import and Use Dialog
```typescript
import ExportDialog from '@/components/common/ExportDialog'
import { useState } from 'react'

export function MyComponent() {
  const [exportOpen, setExportOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setExportOpen(true)}>
        Export
      </Button>
      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        type="analytics"  // or "report", "reports", "bulk"
        reportId={reportId}  // optional for single report
        reportIds={reportIds}  // optional for bulk/multiple
      />
    </>
  )
}
```

### Or Call Service Directly
```typescript
import * as exportService from '@/services/exportService'

// Export single report
exportService.exportReportAsPDF(reportId)

// Export reports as CSV
exportService.exportReportsAsCSV({
  reportIds: ['id1', 'id2'],
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
})

// Export analytics
exportService.exportAnalyticsAsPDF()
exportService.exportAnalyticsAsCSV({
  startDate: new Date('2024-01-01'),
})
```

---

## 🔗 Backend API Endpoints

### PDF Exports

**Single Report PDF**
```
GET /api/v1/export/report/:reportId/pdf
Response: PDF file (application/pdf)
```

**Multiple Reports PDF**
```
POST /api/v1/export/reports/pdf
Content-Type: application/json

{
  "reportIds": ["id1", "id2"],
  "filters": { "status": "pending" }
}
Response: PDF file (application/pdf)
```

**Analytics PDF**
```
GET /api/v1/export/analytics/pdf?startDate=2024-01-01&endDate=2024-12-31
Response: PDF file (application/pdf)
```

### CSV Exports

**Reports CSV**
```
POST /api/v1/export/reports/csv

{
  "reportIds": ["id1"],
  "filters": { "type": "corruption" },
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
Columns: id, title, type, status, description, location, reporterEmail, etc.
```

**Evidence CSV**
```
POST /api/v1/export/evidence/csv

{
  "reportId": "report-123",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
Columns: id, reportId, type, status, fileName, fileSize, etc.
```

**Verifications CSV**
```
POST /api/v1/export/verifications/csv

{
  "reportId": "report-123"
}
Columns: id, reportId, status, verifiedBy, notes, riskLevel, etc.
```

**Comprehensive CSV**
```
POST /api/v1/export/comprehensive/csv

{
  "reportIds": ["id1", "id2"],
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
Content: Reports + Evidence + Verifications all in one file
```

**Analytics CSV**
```
GET /api/v1/export/analytics/csv?startDate=2024-01-01&endDate=2024-12-31
Content: Summary statistics, reports by type/status, time series
```

---

## 📊 Export Options

### Date Range
```typescript
{
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
}
```

### Report Filters
```typescript
{
  reportIds: ['id1', 'id2'],  // Specific reports
  // OR
  filters: { 
    type: 'corruption',
    status: 'approved'
  }  // Query filters
}
```

### Dialog Props
```typescript
interface ExportDialogProps {
  open: boolean                    // Show/hide dialog
  onClose: () => void             // Close handler
  type: 'report' | 'reports' | 'analytics' | 'bulk'
  reportId?: string               // Single report ID
  reportIds?: string[]            // Multiple report IDs
}
```

---

## 🔐 Security

✅ All endpoints require authentication  
✅ No sensitive data unmasked  
✅ SQL injection protection  
✅ Sentry tracking for all exports  
✅ Rate limiting applied  

---

## 🚨 Common Errors & Solutions

### "Export failed"
- Check network connection
- Verify authentication token valid
- Check browser console for details

### PDF not downloading
- Check browser download settings
- Verify pop-ups not blocked
- Check file size (should be < 50MB)

### CSV file has strange formatting
- Try different delimiter (comma, semicolon, tab)
- Open in Excel with UTF-8 encoding
- Check for special characters

### Timeout error
- Query returning too many records
- Try smaller date range
- Filter to specific reports

---

## 📈 Usage Examples

### Export Report with Evidence
```typescript
// User clicks "Export Report" button
<Button onClick={() => setExportOpen(true)}>
  Export Report
</Button>

// Dialog opens, user selects:
// - Format: PDF
// - Gets professional formatted document
// - Includes evidence and verification records
// - Downloads as "report-{id}.pdf"
```

### Export Analytics Report
```typescript
// Admin dashboard
<Button onClick={() => setExportOpen(true)}>
  Export Analytics
</Button>

// Dialog opens with date range picker
// User selects:
// - Format: PDF or CSV
// - Date range (optional)
// - Downloads analytics report
```

### Bulk Export All 2024 Reports
```typescript
// Reports page with filtering
const handleBulkExport = async () => {
  await exportReportsAsCSV({
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
  })
}
```

---

## 📋 File Naming

All exports automatically generate descriptive filenames:

```
report-{reportId}.pdf          // Single report PDF
reports-{timestamp}.pdf         // Multiple reports PDF
reports-{timestamp}.csv         // Reports CSV
evidence-{timestamp}.csv        // Evidence CSV
verifications-{timestamp}.csv   // Verifications CSV
comprehensive-export-{ts}.csv   // Comprehensive export
analytics-{timestamp}.pdf       // Analytics PDF
analytics-{timestamp}.csv       // Analytics CSV
```

---

## ✅ Integration Checklist

- [ ] Backend routes mounted in app.ts
- [ ] Export services created
- [ ] Export controller functions working
- [ ] Frontend services connected
- [ ] ExportDialog component available
- [ ] Sentry logging active
- [ ] Tests passing
- [ ] PDF generation working
- [ ] CSV download working
- [ ] Date picking working

---

## 🔧 Troubleshooting

### Check if routes are mounted
```bash
# Backend should have these routes:
GET  /api/v1/export/report/:id/pdf
POST /api/v1/export/reports/pdf
GET  /api/v1/export/analytics/pdf
POST /api/v1/export/reports/csv
POST /api/v1/export/evidence/csv
POST /api/v1/export/verifications/csv
POST /api/v1/export/comprehensive/csv
GET  /api/v1/export/analytics/csv
```

### Check dependencies installed
```bash
npm list pdfkit json2csv @mui/x-date-pickers
```

### Test single export
```bash
# Test PDF export from CLI
curl -H "Authorization: Bearer token" \
  http://localhost:3000/api/v1/export/analytics/pdf \
  -o test.pdf
```

---

## 📞 Support

- **Docs:** See `PHASE4.D_DATA_EXPORT.md` for comprehensive guide
- **Code:** Check `src/services/exportService.ts` (frontend)
- **Backend:** Check `africajustice-backend/src/services/pdfExportService.ts`
- **Errors:** Check browser console and Sentry dashboard

---

**All export functionality is production-ready!** 🎉
