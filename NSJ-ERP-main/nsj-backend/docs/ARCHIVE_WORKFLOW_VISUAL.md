# Query Archive Workflow - Visual Guide

## Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         QUERY LIFECYCLE                                  │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │  New Query   │
                    │   Created    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   PENDING    │◄─────────────┐
                    │   QUERIES    │              │
                    └──────┬───────┘              │
                           │                      │
                ┌──────────┼──────────┐          │
                │          │          │          │
                ▼          ▼          ▼          │
         ┌──────────┐ ┌────────┐ ┌────────┐    │
         │ Convert  │ │Archive │ │Expired │    │
         │to Order  │ │Manually│ │Auto    │    │
         └────┬─────┘ └───┬────┘ └───┬────┘    │
              │           │          │          │
              ▼           ▼          ▼          │
         ┌─────────┐  ┌──────────────────┐     │
         │ ORDER   │  │    ARCHIVED      │     │
         │WORKFLOW │  │    QUERIES       │     │
         └─────────┘  └────────┬─────────┘     │
                               │                │
                               │ Reopen         │
                               └────────────────┘
```

## Detailed Archive Process

### Step 1: Pending Query with Actions

```
┌────────────────────────────────────────────────────────────────┐
│ Pending Queries                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Customer: John Doe                                        │  │
│ │ Item: Diamond Ring                                        │  │
│ │ Gold Carat: 24K                                           │  │
│ │ Size: 7                                                   │  │
│ │ Query Date: Dec 10, 2025                                  │  │
│ │ Expiry Date: Dec 20, 2025 (Expires in 5 days)           │  │
│ │ Status: 🟡 Pending                                        │  │
│ │                                                           │  │
│ │ Actions:                                                  │  │
│ │ ┌──────┐ ┌────────────┐ ┌─────────┐                     │  │
│ │ │ View │ │ 📦 Archive │ │ Convert │                     │  │
│ │ └──────┘ └────────────┘ └─────────┘                     │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Step 2: Archive Confirmation

```
User clicks "📦 Archive" button
         ↓
┌────────────────────────────────────────────────────────────────┐
│                    Confirm Archive                              │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Archive query for John Doe?                                   │
│                                                                 │
│  This will:                                                    │
│  • Generate a PDF with all query details                       │
│  • Download the PDF to your computer                           │
│  • Move the query to the archive                               │
│  • Remove it from the pending queries list                     │
│                                                                 │
│  You can reopen it later if needed.                            │
│                                                                 │
│  ┌────────┐  ┌─────────┐                                      │
│  │ Cancel │  │ Confirm │                                      │
│  └────────┘  └─────────┘                                      │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Step 3: PDF Generation & Archive

```
User confirms
         ↓
┌────────────────────────────────────────────────────────────────┐
│                    Processing...                                │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⏳ Generating PDF...                                          │
│  ✅ PDF Generated                                              │
│  📥 Downloading PDF...                                         │
│  ✅ PDF Downloaded                                             │
│  📦 Archiving query...                                         │
│  ✅ Query Archived                                             │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│                    Success!                                     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Query Archived                                             │
│                                                                 │
│  The query has been archived and PDF has been downloaded.      │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Downloaded: Query_JohnDoe_Dec15_2025.pdf              │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────┐                                                    │
│  │   OK   │                                                    │
│  └────────┘                                                    │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Step 4: Query Removed from Pending

```
┌────────────────────────────────────────────────────────────────┐
│ Pending Queries                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Customer: Jane Smith                                      │  │
│ │ Item: Gold Necklace                                       │  │
│ │ Status: 🟡 Pending                                        │  │
│ │ [View] [📦 Archive] [Convert]                            │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Customer: Bob Wilson                                      │  │
│ │ Item: Silver Bracelet                                     │  │
│ │ Status: 🟡 Pending                                        │  │
│ │ [View] [📦 Archive] [Convert]                            │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ℹ️ John Doe's query has been archived                         │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Step 5: Query Appears in Archive

```
┌────────────────────────────────────────────────────────────────┐
│ Archived Queries                                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Customer: John Doe                                        │  │
│ │ Item: Diamond Ring                                        │  │
│ │ Gold Carat: 24K                                           │  │
│ │ Query Date: Dec 10, 2025                                  │  │
│ │ Archived Date: Dec 15, 2025                               │  │
│ │ Status: 📦 Archived                                       │  │
│ │                                                           │  │
│ │ Actions:                                                  │  │
│ │ ┌──────┐ ┌─────────┐ ┌──────────┐                       │  │
│ │ │ View │ │ 📄 PDF  │ │ ↩️ Reopen│                       │  │
│ │ └──────┘ └─────────┘ └──────────┘                       │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Auto-Archive for Expired Queries

### Expired Query Detection

```
┌────────────────────────────────────────────────────────────────┐
│ Pending Queries                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Customer: John Doe                                        │  │
│ │ Item: Diamond Ring                                        │  │
│ │ Expiry Date: Dec 14, 2025                                 │  │
│ │ Status: 🔴 Expired                                        │  │
│ │                                                           │  │
│ │ ⚠️ This query has expired                                 │  │
│ │                                                           │  │
│ │ [View] [📦 Archive] [Convert]                            │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Automatic Archive Process

```
System runs daily check
         ↓
┌────────────────────────────────────────────────────────────────┐
│                 Auto-Archive Process                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔍 Checking for expired queries...                            │
│  ✅ Found 3 expired queries                                    │
│                                                                 │
│  📦 Archiving expired queries:                                 │
│  • John Doe - Diamond Ring (Expired Dec 14)                    │
│  • Jane Smith - Gold Necklace (Expired Dec 12)                 │
│  • Bob Wilson - Silver Bracelet (Expired Dec 10)               │
│                                                                 │
│  ✅ 3 queries archived successfully                            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Reopen Archived Query

### Step 1: View Archived Query

```
┌────────────────────────────────────────────────────────────────┐
│ Archived Queries                                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Customer: John Doe                                        │  │
│ │ Item: Diamond Ring                                        │  │
│ │ Archived: Dec 15, 2025                                    │  │
│ │ Status: 📦 Archived                                       │  │
│ │                                                           │  │
│ │ [View] [📄 PDF] [↩️ Reopen] ← Click Reopen              │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Step 2: Reopen Confirmation

```
┌────────────────────────────────────────────────────────────────┐
│                    Confirm Reopen                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Reopen query for John Doe?                                    │
│                                                                 │
│  This will move it back to pending queries.                    │
│                                                                 │
│  ┌────────┐  ┌─────────┐                                      │
│  │ Cancel │  │ Confirm │                                      │
│  └────────┘  └─────────┘                                      │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Step 3: Query Reopened

```
┌────────────────────────────────────────────────────────────────┐
│                    Success!                                     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Query Reopened                                             │
│                                                                 │
│  The query has been moved back to pending queries.             │
│                                                                 │
│  ┌────────┐                                                    │
│  │   OK   │                                                    │
│  └────────┘                                                    │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
         ↓
Query appears in Pending Queries list again
```

## PDF Download from Archive

```
User clicks "📄 PDF" button
         ↓
┌────────────────────────────────────────────────────────────────┐
│                 Generating PDF...                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⏳ Generating PDF from archived query...                      │
│  ✅ PDF Generated                                              │
│  📥 Downloading...                                             │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│                    Success!                                     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ PDF Downloaded                                             │
│                                                                 │
│  Query PDF has been downloaded successfully.                   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Downloaded: Query_JohnDoe_Dec15_2025.pdf              │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Status Indicators

### Pending Query
```
┌─────────────────────────────┐
│ Status: 🟡 Pending          │
│ Expiry: Dec 20, 2025        │
│ ✅ Active                   │
└─────────────────────────────┘
```

### Expiring Soon
```
┌─────────────────────────────┐
│ Status: 🟡 Pending          │
│ Expiry: Dec 17, 2025        │
│ ⚠️ Expires in 2 days        │
└─────────────────────────────┘
```

### Expired
```
┌─────────────────────────────┐
│ Status: 🔴 Expired          │
│ Expiry: Dec 14, 2025        │
│ ⚠️ Expired                  │
└─────────────────────────────┘
```

### Archived
```
┌─────────────────────────────┐
│ Status: 📦 Archived         │
│ Archived: Dec 15, 2025      │
│ ℹ️ In Archive               │
└─────────────────────────────┘
```

## Navigation Flow

```
Main Menu
    │
    ├── Vouchers
    │   │
    │   ├── New Query ──────────► Create new query
    │   │
    │   ├── Pending Queries ────► View active queries
    │   │   │                     [View] [Archive] [Convert]
    │   │   │
    │   │   └── Archive ─────────► Move to archive + PDF
    │   │
    │   ├── Archived Queries ───► View archived queries
    │   │   │                     [View] [PDF] [Reopen]
    │   │   │
    │   │   └── Reopen ─────────► Move back to pending
    │   │
    │   └── Orders ─────────────► View orders
    │
    └── ...
```

## Summary

The archive workflow provides:

✅ **Easy Archiving** - One-click archive with PDF generation
✅ **Auto-Archive** - Expired queries automatically archived
✅ **PDF Records** - Downloadable PDFs for all archived queries
✅ **Reopen Option** - Can restore archived queries if needed
✅ **Clean Interface** - Pending list shows only active queries
✅ **Complete Audit Trail** - All queries preserved for reference

---

**Visual Guide Version:** 1.0
**Last Updated:** December 15, 2025
