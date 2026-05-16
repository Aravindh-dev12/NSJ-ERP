# Archived Queries Pages - Navigation Guide

## Pages Created

### 1. Archived Queries List Page
**URL:** `/vouchers/archived-queries`
**File:** `nsj-frontend/nsj-frontend/app/vouchers/archived-queries/page.tsx`

**Features:**
- Lists all archived queries
- Search functionality
- Pagination
- Three action buttons per query:
  - **View** - View full query details
  - **📄 PDF** - Download PDF
  - **↩️ Reopen** - Move back to pending

**Screenshot:**
```
┌────────────────────────────────────────────────────────────────┐
│ Archived Queries                                               │
│ View and manage archived customer queries                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Search: [_____________________]                                │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Account │ Item │ Archived │ Status │ Actions             │  │
│ ├──────────────────────────────────────────────────────────┤  │
│ │ John    │ Ring │ Dec 15   │ 📦     │ [View] [📄] [↩️]   │  │
│ │ Jane    │ Neck │ Dec 14   │ 📦     │ [View] [📄] [↩️]   │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Showing 2 of 10 archived queries                               │
│ [Previous] [Next]                                              │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 2. Archived Query Detail Page
**URL:** `/vouchers/archived-queries/[id]`
**File:** `nsj-frontend/nsj-frontend/app/vouchers/archived-queries/[id]/ArchivedQueryDetailClient.tsx`

**Features:**
- View complete query details
- Download PDF button
- Reopen query button
- Read-only view (no editing)
- Shows archived date

**Screenshot:**
```
┌────────────────────────────────────────────────────────────────┐
│ Archived Query Details                                         │
│ Query ID: abc12345...                                    [Back]│
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 📦 Archived Query                                              │
│ This query was archived on Dec 15, 2025.                       │
│ You can download the PDF or reopen it if needed.              │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Query Information                                        │  │
│ │ Created on Dec 10, 2025                    📦 Archived   │  │
│ ├──────────────────────────────────────────────────────────┤  │
│ │ Account Information                                      │  │
│ │ Account Name: John Doe                                   │  │
│ │ Location: Mumbai                                         │  │
│ │                                                          │  │
│ │ Item Details                                             │  │
│ │ Item Name: Diamond Ring                                  │  │
│ │ Gold Carat: 24K                                          │  │
│ │ Size: 7                                                  │  │
│ │                                                          │  │
│ │ Timeline                                                 │  │
│ │ Query Date: Dec 10, 2025                                 │  │
│ │ Expiry Date: Dec 20, 2025                                │  │
│ │ Archived Date: Dec 15, 2025                              │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Actions                                                  │  │
│ │ Download the PDF or reopen this query                    │  │
│ ├──────────────────────────────────────────────────────────┤  │
│ │ [📄 Download PDF]                                        │  │
│ │ [↩️ Reopen Query]                                        │  │
│ │ [Back to Archived Queries]                               │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Navigation Structure

### Main Menu
```
Vouchers
├── New Query
├── Pending Queries (/vouchers/pending-queries)
│   ├── View Query (/vouchers/pending-queries/[id])
│   └── Convert to Order (/vouchers/pending-queries/[id]/convert)
├── Archived Queries (/vouchers/archived-queries) ← NEW
│   └── View Archived Query (/vouchers/archived-queries/[id]) ← NEW
└── Orders
```

### User Flow

#### Viewing Archived Queries
```
1. Click "Archived Queries" in menu
   ↓
2. See list of all archived queries
   ↓
3. Click "View" on any query
   ↓
4. See full query details
   ↓
5. Options:
   - Download PDF
   - Reopen query
   - Go back to list
```

#### Reopening an Archived Query
```
1. View archived query details
   ↓
2. Click "↩️ Reopen Query"
   ↓
3. Confirm action
   ↓
4. Query moved to pending queries
   ↓
5. Redirected to pending queries list
```

#### Downloading PDF from Archive
```
1. View archived query details
   ↓
2. Click "📄 Download PDF"
   ↓
3. PDF generated and downloaded
   ↓
4. Success notification shown
```

## URL Routes

| Route | Purpose | Component |
|-------|---------|-----------|
| `/vouchers/archived-queries` | List all archived queries | ArchivedQueriesList |
| `/vouchers/archived-queries/[id]` | View archived query details | ArchivedQueryDetailClient |

## Components Used

### ArchivedQueriesList
**Location:** `nsj-frontend/nsj-frontend/components/queries/ArchivedQueriesList.tsx`

**Props:** None

**Features:**
- Fetches archived queries from API
- Search and filter
- Pagination
- Action buttons (View, PDF, Reopen)

### ArchivedQueryDetailClient
**Location:** `nsj-frontend/nsj-frontend/app/vouchers/archived-queries/[id]/ArchivedQueryDetailClient.tsx`

**Props:** None (uses URL params)

**Features:**
- Fetches single archived query
- Displays all query information
- Download PDF button
- Reopen query button

## API Endpoints Used

### List Archived Queries
```typescript
GET /payments/queries/?status=archived&page=1&page_size=10
```

### Get Archived Query Details
```typescript
GET /payments/queries/{id}/
```

### Reopen Archived Query
```typescript
POST /payments/queries/{id}/reopen/
```

## State Management

### ArchivedQueriesList State
```typescript
- queries: Query[] - List of archived queries
- loading: boolean - Loading state
- searchTerm: string - Search filter
- page: number - Current page
- meta: { count, next, previous } - Pagination info
```

### ArchivedQueryDetailClient State
```typescript
- query: QueryResponse | null - Query details
- loading: boolean - Loading state
- reopening: boolean - Reopen in progress
- downloadingPDF: boolean - PDF download in progress
```

## Styling

### Status Badge
```tsx
<span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
  📦 Archived
</span>
```

### Archived Banner
```tsx
<div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
  <span className="text-gray-600 font-semibold">📦 Archived Query</span>
  <span className="text-gray-700">
    This query was archived on {date}...
  </span>
</div>
```

### Action Buttons
```tsx
// Download PDF Button
<Button className="w-full bg-blue-600 hover:bg-blue-700">
  📄 Download PDF
</Button>

// Reopen Button
<Button variant="outline" className="w-full text-green-600 border-green-600">
  ↩️ Reopen Query
</Button>
```

## Testing Checklist

### Archived Queries List Page
- [ ] Page loads without errors
- [ ] Archived queries display correctly
- [ ] Search functionality works
- [ ] Pagination works
- [ ] View button navigates to detail page
- [ ] PDF button downloads PDF
- [ ] Reopen button moves query to pending
- [ ] Empty state shows when no queries

### Archived Query Detail Page
- [ ] Page loads with query details
- [ ] All information displays correctly
- [ ] Archived banner shows
- [ ] Download PDF button works
- [ ] Reopen button works
- [ ] Back button navigates correctly
- [ ] 404 handling for invalid query ID

### Navigation
- [ ] Can navigate from menu to archived queries
- [ ] Can navigate from list to detail
- [ ] Can navigate back from detail to list
- [ ] Breadcrumbs work correctly

## Permissions

### Required Permissions
- View archived queries
- Download PDFs
- Reopen queries (may require admin)

### Access Control
```typescript
// Check if user can view archived queries
if (!user.hasPermission('view_archived_queries')) {
  return <Unauthorized />;
}

// Check if user can reopen queries
if (!user.hasPermission('reopen_queries')) {
  // Hide reopen button
}
```

## Future Enhancements

### Potential Features
1. **Bulk Actions** - Select multiple queries for bulk operations
2. **Export to Excel** - Export archived queries list
3. **Advanced Filters** - Filter by date range, customer, etc.
4. **Archive Reason** - Show why query was archived
5. **Email PDF** - Email PDF to customer
6. **Delete Permanently** - Admin option to delete old archives
7. **Archive Notes** - Add notes when archiving
8. **Archive History** - Show archive/reopen history

## Summary

The archived queries pages provide:

✅ **Complete List View** - See all archived queries
✅ **Detailed View** - View full query information
✅ **PDF Download** - Download query PDFs anytime
✅ **Reopen Capability** - Move queries back to pending
✅ **Search & Filter** - Find archived queries easily
✅ **Clean UI** - Professional and intuitive interface
✅ **Responsive Design** - Works on all devices

---

**Pages Created:** 2 (List + Detail)
**Components Created:** 2 (ArchivedQueriesList + ArchivedQueryDetailClient)
**Routes:** `/vouchers/archived-queries` and `/vouchers/archived-queries/[id]`
**Status:** ✅ Complete and Ready for Testing
