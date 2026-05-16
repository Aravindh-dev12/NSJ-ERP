# Navigation Reorganization - Query Items Under Order

## Changes Made

The navigation has been reorganized to group query-related items under the Order section in the Process (Voucher) menu.

## New Navigation Structure

### Before
```
Process (Voucher)
├── Order
├── Estimate
├── Pending Queries
├── Archived Queries
├── Sale
├── Receive
└── ...
```

### After
```
Process (Voucher)
├── Order
│   ├── → Query Form (New)
│   ├── → Pending Queries
│   └── → Archived Queries
├── Estimate
├── Sale
├── Receive
└── ...
```

## Visual Representation

### Sidebar on Hover

```
┌─────────────────────────────────┐
│ 📄 Process                      │
│ ┌─────────────────────────────┐ │
│ │ Order                       │ │
│ │   → Query Form          ✨  │ │ ← NEW
│ │   → Pending Queries     ✨  │ │ ← Grouped under Order
│ │   → Archived Queries    ✨  │ │ ← Grouped under Order
│ │ Estimate                    │ │
│ │ Sale                        │ │
│ │ Receive                     │ │
│ │ Receipt                     │ │
│ │ Purchase                    │ │
│ │ Pur. Return                 │ │
│ │ Sales Return                │ │
│ │ Repair                      │ │
│ │ Payment                     │ │
│ │ Journal                     │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

## Navigation Links

### Query Form
- **Label:** "→ Query Form"
- **URL:** `/vouchers/pending-queries/new`
- **Purpose:** Create new customer query
- **Icon:** Arrow (→) indicates sub-item

### Pending Queries
- **Label:** "→ Pending Queries"
- **URL:** `/vouchers/pending-queries`
- **Purpose:** View active pending queries
- **Icon:** Arrow (→) indicates sub-item

### Archived Queries
- **Label:** "→ Archived Queries"
- **URL:** `/vouchers/archived-queries`
- **Purpose:** View archived queries
- **Icon:** Arrow (→) indicates sub-item

## User Experience

### Hover Behavior
```
User hovers over "Process"
         ↓
Submenu expands
         ↓
User sees:
  - Order (main item)
  - → Query Form (sub-item)
  - → Pending Queries (sub-item)
  - → Archived Queries (sub-item)
  - Estimate
  - Sale
  - etc.
```

### Click Behavior

**Click "Order":**
```
Navigate to: /vouchers
Shows: Order list/overview page
```

**Click "→ Query Form":**
```
Navigate to: /vouchers/pending-queries/new
Shows: New Customer Query form
```

**Click "→ Pending Queries":**
```
Navigate to: /vouchers/pending-queries
Shows: List of pending queries
```

**Click "→ Archived Queries":**
```
Navigate to: /vouchers/archived-queries
Shows: List of archived queries
```

## Visual Hierarchy

The arrow (→) prefix creates a visual hierarchy:

```
Order                    ← Main item (no arrow)
  → Query Form           ← Sub-item (with arrow)
  → Pending Queries      ← Sub-item (with arrow)
  → Archived Queries     ← Sub-item (with arrow)
Estimate                 ← Main item (no arrow)
Sale                     ← Main item (no arrow)
```

## Benefits

### For Users
✅ **Logical Grouping** - Queries grouped with Orders
✅ **Clear Hierarchy** - Visual indication of sub-items
✅ **Easy Discovery** - All query options in one place
✅ **Intuitive** - Follows natural workflow (Query → Order)

### For Organization
✅ **Better Structure** - Related items grouped together
✅ **Cleaner Menu** - Less clutter at top level
✅ **Scalable** - Can add more query-related items
✅ **Professional** - Organized navigation

## Workflow Alignment

The navigation now matches the business workflow:

```
1. Query Form (Create query)
         ↓
2. Pending Queries (Track queries)
         ↓
3. Convert to Order OR Archive
         ↓
4. Archived Queries (View archived)
```

## Complete Navigation Tree

```
📊 Dashboard
📁 Accounts
   ├─ Overview
   ├─ List
   ├─ Add New
   ├─ Sub Accounts
   ├─ Sub Accounts List
   └─ A/C Group

📄 Process (Voucher)
   ├─ Order
   │  ├─ → Query Form          ← NEW
   │  ├─ → Pending Queries     ← MOVED
   │  └─ → Archived Queries    ← MOVED
   ├─ Estimate
   ├─ Sale
   ├─ Receive
   ├─ Receipt
   ├─ Purchase
   ├─ Pur. Return
   ├─ Sales Return
   ├─ Repair
   ├─ Payment
   └─ Journal

🍴 Feeding
📊 Reports
🏷️  Tagging
⚙️  Utilities
```

## Active State Highlighting

When on query pages, the navigation shows:

**On Query Form page:**
```
Process (Voucher)
├── Order
│   ├── → Query Form ✓        ← Highlighted
│   ├── → Pending Queries
│   └── → Archived Queries
```

**On Pending Queries page:**
```
Process (Voucher)
├── Order
│   ├── → Query Form
│   ├── → Pending Queries ✓   ← Highlighted
│   └── → Archived Queries
```

**On Archived Queries page:**
```
Process (Voucher)
├── Order
│   ├── → Query Form
│   ├── → Pending Queries
│   └── → Archived Queries ✓  ← Highlighted
```

## Testing Checklist

### Navigation Display
- [ ] "→ Query Form" appears under Order
- [ ] "→ Pending Queries" appears under Order
- [ ] "→ Archived Queries" appears under Order
- [ ] Arrow (→) prefix displays correctly
- [ ] Indentation shows hierarchy
- [ ] All items visible on hover

### Navigation Functionality
- [ ] Clicking "→ Query Form" goes to new query page
- [ ] Clicking "→ Pending Queries" goes to pending list
- [ ] Clicking "→ Archived Queries" goes to archived list
- [ ] Active state highlights correctly
- [ ] Back button works from each page

### Visual Design
- [ ] Arrow symbols display correctly
- [ ] Indentation is clear
- [ ] Hover states work
- [ ] Active states are visible
- [ ] Text is readable

## Summary

The navigation has been reorganized to group query-related items under Order:

✅ **Query Form** - Create new customer queries (under Order)
✅ **Pending Queries** - View active queries (under Order)
✅ **Archived Queries** - View archived queries (under Order)
✅ **Visual Hierarchy** - Arrow (→) indicates sub-items
✅ **Logical Grouping** - Queries grouped with Orders

Users can now find all query-related functionality organized under the Order section in the Process menu!

---

**File Modified:** `SidebarNav.tsx`
**Changes:** Reorganized query items under Order
**Visual Indicator:** Arrow (→) prefix for sub-items
**Status:** ✅ Complete and Ready to Use
