# Navigation Update - Archived Queries Link Added

## Changes Made

### Updated File
**File:** `nsj-frontend/nsj-frontend/components/SidebarNav.tsx`

### Navigation Links Added

Added two new links to the **Voucher** section of the sidebar navigation:

1. **Pending Queries** - `/vouchers/pending-queries`
2. **Archived Queries** - `/vouchers/archived-queries`

## Visual Representation

### Before
```
┌─────────────────────────────┐
│ Niti Shah Jewels            │
├─────────────────────────────┤
│ 📊 Dashboard                │
│ 📁 Accounts                 │
│ 📄 Voucher ◄────────────────┤
│    ├─ Order                 │
│    ├─ Estimate              │
│    ├─ Sale                  │
│    ├─ Receive               │
│    ├─ Receipt               │
│    ├─ Purchase              │
│    ├─ Pur. Return           │
│    ├─ Sales Return          │
│    ├─ Repair                │
│    ├─ Payment               │
│    └─ Journal               │
│ 🍴 Feeding                  │
│ 📊 Reports                  │
│ 🏷️  Tagging                 │
│ ⚙️  Utilities               │
└─────────────────────────────┘
```

### After (Updated)
```
┌─────────────────────────────┐
│ Niti Shah Jewels            │
├─────────────────────────────┤
│ 📊 Dashboard                │
│ 📁 Accounts                 │
│ 📄 Voucher ◄────────────────┤
│    ├─ Order                 │
│    ├─ Estimate              │
│    ├─ Pending Queries   ✨  │ ← NEW
│    ├─ Archived Queries  ✨  │ ← NEW
│    ├─ Sale                  │
│    ├─ Receive               │
│    ├─ Receipt               │
│    ├─ Purchase              │
│    ├─ Pur. Return           │
│    ├─ Sales Return          │
│    ├─ Repair                │
│    ├─ Payment               │
│    └─ Journal               │
│ 🍴 Feeding                  │
│ 📊 Reports                  │
│ 🏷️  Tagging                 │
│ ⚙️  Utilities               │
└─────────────────────────────┘
```

## Navigation Behavior

### Hover to Expand
When users hover over "Voucher" in the sidebar, the submenu expands to show all options including the new links:

```
User hovers over "Voucher"
         ↓
┌─────────────────────────────────────┐
│ 📄 Voucher                          │
│ ┌─────────────────────────────────┐ │
│ │ Order                           │ │
│ │ Estimate                        │ │
│ │ Pending Queries         ← NEW   │ │
│ │ Archived Queries        ← NEW   │ │
│ │ Sale                            │ │
│ │ Receive                         │ │
│ │ Receipt                         │ │
│ │ Purchase                        │ │
│ │ Pur. Return                     │ │
│ │ Sales Return                    │ │
│ │ Repair                          │ │
│ │ Payment                         │ │
│ │ Journal                         │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Click to Navigate
Clicking on either link navigates to the respective page:

**Pending Queries:**
```
Click "Pending Queries"
         ↓
Navigate to: /vouchers/pending-queries
         ↓
Shows: List of active pending queries
```

**Archived Queries:**
```
Click "Archived Queries"
         ↓
Navigate to: /vouchers/archived-queries
         ↓
Shows: List of archived queries
```

## Active State Highlighting

When on the archived queries page, the link will be highlighted:

```
Current URL: /vouchers/archived-queries

┌─────────────────────────────┐
│ 📄 Voucher                  │
│    ├─ Order                 │
│    ├─ Estimate              │
│    ├─ Pending Queries       │
│    ├─ Archived Queries  ✓   │ ← Highlighted (active)
│    ├─ Sale                  │
│    └─ ...                   │
└─────────────────────────────┘
```

## Mobile View

On mobile devices, the navigation is accessible via the top bar:

```
┌─────────────────────────────────────┐
│ 🏢 Niti Shah Jewels  [Go to Dashboard]│
└─────────────────────────────────────┘
```

Users can navigate directly to the dashboard and then access other pages from there.

## User Journey

### Accessing Archived Queries

**Desktop:**
1. Look at left sidebar
2. Hover over "Voucher" section
3. Click "Archived Queries"
4. View archived queries list

**Mobile:**
1. Tap menu icon (if available)
2. Navigate to Vouchers section
3. Tap "Archived Queries"
4. View archived queries list

### Complete Workflow

```
┌─────────────────────────────────────────────────────────┐
│                    User Workflow                         │
└─────────────────────────────────────────────────────────┘

1. Create Query
   ↓
2. View in "Pending Queries" (sidebar link)
   ↓
3. Archive Query (when not converting)
   ↓
4. View in "Archived Queries" (sidebar link)
   ↓
5. Download PDF or Reopen if needed
```

## Link Order Rationale

The links are placed after "Estimate" because:

1. **Logical Flow:** Order → Estimate → Queries (related to orders)
2. **Frequency:** Queries are checked frequently, so placed near the top
3. **Grouping:** Keeps query-related items together
4. **Visibility:** Easy to find without scrolling

## Code Changes

### Before
```typescript
subLinks: [
  { label: "Order", href: "/vouchers" },
  { label: "Estimate", href: "/vouchers/estimate" },
  { label: "Sale", href: "/vouchers/sale" },
  // ... rest of links
]
```

### After
```typescript
subLinks: [
  { label: "Order", href: "/vouchers" },
  { label: "Estimate", href: "/vouchers/estimate" },
  { label: "Pending Queries", href: "/vouchers/pending-queries" },    // NEW
  { label: "Archived Queries", href: "/vouchers/archived-queries" },  // NEW
  { label: "Sale", href: "/vouchers/sale" },
  // ... rest of links
]
```

## Testing Checklist

### Navigation Links
- [ ] "Pending Queries" link appears in Voucher submenu
- [ ] "Archived Queries" link appears in Voucher submenu
- [ ] Clicking "Pending Queries" navigates to correct page
- [ ] Clicking "Archived Queries" navigates to correct page
- [ ] Active state highlights correctly when on each page
- [ ] Hover behavior works smoothly
- [ ] Links are visible on desktop
- [ ] Links are accessible on mobile

### Visual Verification
- [ ] Links are properly aligned
- [ ] Text is readable
- [ ] Hover states work correctly
- [ ] Active states are clearly visible
- [ ] No layout issues or overlapping

### Functionality
- [ ] Navigation works from any page
- [ ] Back button works after navigation
- [ ] Browser history is correct
- [ ] Page loads correctly after navigation

## Benefits

### For Users
✅ **Easy Access** - Quick navigation to archived queries
✅ **Discoverability** - Users can easily find archived queries
✅ **Consistency** - Follows existing navigation patterns
✅ **Efficiency** - No need to remember URLs

### For Business
✅ **Better Organization** - Clear separation of pending vs archived
✅ **Improved Workflow** - Easy to switch between query states
✅ **Professional** - Complete navigation structure
✅ **User-Friendly** - Intuitive menu organization

## Summary

The navigation has been updated to include:

✅ **Pending Queries Link** - Access active queries
✅ **Archived Queries Link** - Access archived queries
✅ **Proper Placement** - Logical position in menu
✅ **Active Highlighting** - Shows current page
✅ **Hover Behavior** - Smooth expansion on hover

Users can now easily navigate to both pending and archived queries directly from the sidebar menu!

---

**File Modified:** `SidebarNav.tsx`
**Links Added:** 2 (Pending Queries + Archived Queries)
**Status:** ✅ Complete and Ready to Use
