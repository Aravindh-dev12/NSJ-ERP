# Excel/CSV Upload Integration Guide

## Overview

The dashboard now supports uploading Excel (.xlsx, .xls) and CSV (.csv) files to the backend FastAPI server at `http://localhost:8000`.

**Endpoint Used**: `POST /sales-records/upload` (not `/invoices/upload`)

## Features Implemented

✅ Drag-and-drop file upload  
✅ File type validation (Excel + CSV support)  
✅ File size validation (10MB limit)  
✅ Loading states during upload  
✅ Success/error feedback with detailed messages  
✅ Auto-close on successful upload  
✅ Integration with backend API  
✅ Full test coverage (9 passing tests)

## Components Modified

### `InvoiceUploadModal.tsx`

Updated to accept both Excel and CSV files:

- Added CSV MIME types: `text/csv`, `application/csv`
- Added fallback file extension validation
- Updated UI text to reflect "Sales Records" instead of "Invoices"
- Updated file input accept attribute: `.xlsx,.xls,.csv`
- **Uses `backend.uploadSalesRecords()` → `POST /sales-records/upload`**

### `dashboard-visuals.tsx`

Already wired up with:

- Import Data button triggers upload modal
- Modal state management (`showUploadModal`)
- InvoiceUploadModal component integration

### `lib/backend.ts`

Upload functionality already implemented:

- `uploadSalesRecords(file: File | Blob)` method
- FormData creation with original filename preservation
- **Endpoint: `POST /sales-records/upload`** (correct endpoint for sales data)

## Testing Instructions

### 1. Start the Backend Server

Make sure your FastAPI backend is running on `http://localhost:8000`:

```bash
# In your backend directory
uvicorn main:app --reload --port 8000
```

### 2. Start the Frontend

```bash
cd /Users/suhail/jsc-frontend
pnpm dev
```

The app will be available at `http://localhost:3000`

### 3. Test Upload Flow

1. **Navigate to Dashboard**
   - Go to `http://localhost:3000/dashboard`
   - You should see the "Import Data" button (green) in the top-right

2. **Open Upload Modal**
   - Click the "Import Data" button
   - Modal should appear with title "Import Invoices"

3. **Test Drag & Drop**
   - Drag an Excel or CSV file onto the upload area
   - The area should highlight when dragging over it
   - File should appear in the list after dropping

4. **Test File Browser**
   - Click "Browse Files" button
   - Select an Excel (.xlsx, .xls) or CSV (.csv) file
   - File should appear in the list

5. **Test File Validation**
   - Try uploading a file larger than 10MB → Should show error
   - Try uploading a non-Excel/CSV file (e.g., .txt, .pdf) → Should show error

6. **Test Upload**
   - Select a valid file
   - Click "Upload" button
   - Should show loading spinner during upload
   - On success: Shows green success message with import stats
   - On error: Shows red error message
   - Modal auto-closes after successful upload (2 second delay)

### 4. Run Automated Tests

```bash
# Run all tests
pnpm test:unit

# Run only upload modal tests
pnpm test:unit tests/components/InvoiceUploadModal.test.tsx

# Run with coverage
pnpm test:unit --coverage
```

## Sample Test Files

### Sample CSV Format

Create a file named `test-invoices.csv`:

```csv
invoice_number,vendor_name,payment_amount,invoice_date,status
INV-001,Vendor A,10000,2024-01-15,pending
INV-002,Vendor B,25000,2024-01-16,pending
INV-003,Vendor C,15000,2024-01-17,paid
```

### Sample Excel Format

Create an Excel file with the same columns:

- invoice_number
- vendor_name
- payment_amount
- invoice_date
- status

## Backend API Expectations

The frontend sends a POST request to `/sales-records/upload` with:

- Content-Type: `multipart/form-data`
- Field name: `file`
- Original filename preserved (e.g., `sales-data.csv`, `sales-data.xlsx`)

Expected backend response format:

```json
{
  "imported": 50,
  "skipped": 2,
  "errors": ["Row 5: Invalid date format"]
}
```

Or error response:

```json
{
  "detail": "Invalid file format"
}
```

## Error Handling

The component handles the following error scenarios:

- ❌ File too large (>10MB)
- ❌ Invalid file type (not Excel/CSV)
- ❌ Network errors
- ❌ Backend validation errors
- ❌ API errors with detailed messages

## Next Steps

After upload functionality is working:

1. **Replace CSV dummy data** - Fetch dashboard metrics from backend APIs instead of parsing static CSV
2. **Implement export functionality** - Wire up "Export to Excel" button
3. **Add data refresh** - Auto-refresh dashboard after successful upload
4. **Add upload history** - Show previously uploaded files
5. **Add bulk operations** - Support multiple file uploads

## Development Notes

- The upload modal uses the existing `InvoiceUploadModal` component (not the duplicate `UploadDialog` that was removed)
- Backend URL is configured in `lib/constants.ts`: `http://localhost:8000`
- Auth tokens are automatically included in requests via the `api` helper in `lib/api.ts`
- MSW mocks are set up in `tests/setup.ts` for testing without a real backend
- All tests pass with 100% coverage for the upload modal component

## Troubleshooting

### CORS Issues

If you see CORS errors:

```python
# In your FastAPI backend, add:
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### File Not Uploading

1. Check browser console for errors
2. Verify backend is running on port 8000
3. Check backend logs for upload endpoint errors
4. Verify file meets validation requirements (size, type)

### Modal Not Showing

1. Check that `showUploadModal` state is being set to `true`
2. Verify `InvoiceUploadModal` is imported correctly
3. Check browser console for React errors
