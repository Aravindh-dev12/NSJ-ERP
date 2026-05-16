# Estimate Form - Item Name Dropdown

## Overview
The Item Name field in the Estimate Voucher form has been updated from a free-text input to a dropdown with predefined jewelry item options.

## Changes Made

### Before
```tsx
<Input
  id="itemName"
  placeholder="Enter item name or it will auto-fill if available"
  value={itemName}
  onChange={(e) => setItemName(e.target.value)}
  required
/>
```

### After
```tsx
<select
  id="itemName"
  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
  value={itemName}
  onChange={(e) => setItemName(e.target.value)}
  required
>
  <option value="">Select jewelry item</option>
  <option value="Ring">Ring</option>
  <option value="Earring">Earring</option>
  <option value="Necklace">Necklace</option>
  <option value="Bracelet">Bracelet</option>
  <option value="Bangle">Bangle</option>
  <option value="Pendant">Pendant</option>
  <option value="Anklet">Anklet</option>
</select>
```

## Jewelry Item Options

The dropdown includes the following jewelry items:

1. **Ring** - Finger rings
2. **Earring** - Ear jewelry
3. **Necklace** - Neck jewelry
4. **Bracelet** - Wrist jewelry
5. **Bangle** - Rigid wrist jewelry
6. **Pendant** - Hanging jewelry piece
7. **Anklet** - Ankle jewelry

## Visual Representation

### Form Field
```
┌─────────────────────────────────────────────────────────┐
│ Item Name / Description *                               │
│ (Auto-filled from account)                              │
├─────────────────────────────────────────────────────────┤
│ Select jewelry item                              ▼     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Ring                                                │ │
│ │ Earring                                             │ │
│ │ Necklace                                            │ │
│ │ Bracelet                                            │ │
│ │ Bangle                                              │ │
│ │ Pendant                                             │ │
│ │ Anklet                                              │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
Select the type of jewelry item for this estimate
```

## Benefits

### For Users
✅ **Standardized Names** - Consistent item naming across estimates
✅ **Faster Entry** - Select instead of typing
✅ **No Typos** - Dropdown prevents spelling errors
✅ **Clear Options** - See all available jewelry types
✅ **Professional** - Standardized terminology

### For Business
✅ **Data Consistency** - All estimates use same item names
✅ **Better Reporting** - Easy to filter/group by item type
✅ **Analytics** - Track which items are most popular
✅ **Inventory** - Align with inventory categories
✅ **Professional** - Consistent documentation

## Auto-Fill Behavior

The dropdown still supports auto-fill from account:

```
User selects account
         ↓
System checks sub-account for item name
         ↓
If item name matches dropdown option:
  → Auto-select that option
         ↓
If item name doesn't match:
  → Leave dropdown at "Select jewelry item"
         ↓
User manually selects from dropdown
```

## Example Usage

### Creating New Estimate
```
1. Select Customer Account: "John Doe"
2. Item Name auto-fills: "Ring" (from sub-account)
3. Or manually select: "Necklace"
4. Continue with line items...
```

### Estimate with Different Items
```
Customer: Jane Smith
Item: Earring (selected from dropdown)

Line Items:
- Gold (Compulsory)
- Craftsmanship Fee (Compulsory)
- Diamond (variable)
- Gemstone (variable)
```

## PDF Output

The selected item name appears in the PDF:

```
┌─────────────────────────────────────────────────────────┐
│ ESTIMATE VOUCHER                                        │
├─────────────────────────────────────────────────────────┤
│ Customer: John Doe                                      │
│ Item: Ring                    ← From dropdown           │
│ Date: December 15, 2025                                 │
├─────────────────────────────────────────────────────────┤
│ Line Items:                                             │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

## Validation

### Required Field
```
If user tries to save without selecting item:
❌ Error: "Please fill in account, item name, and date"
```

### Valid Selection
```
User must select one of the dropdown options
✅ Cannot submit with "Select jewelry item" (empty value)
```

## Future Enhancements

### Potential Additions
1. **Custom Option** - Add "Other" with text input
2. **Sub-categories** - Ring → Engagement Ring, Wedding Ring, etc.
3. **Images** - Show jewelry type images in dropdown
4. **Search** - Searchable dropdown for many options
5. **Recent Items** - Show recently used items first
6. **Favorites** - Mark frequently used items

### Backend Integration
1. **Master Table** - Store jewelry types in database
2. **Admin Management** - Add/edit jewelry types via admin
3. **Multi-language** - Support different languages
4. **Custom Fields** - Additional fields per jewelry type

## Testing Checklist

### Dropdown Functionality
- [ ] Dropdown displays all 7 jewelry options
- [ ] Can select each option
- [ ] Selected value saves correctly
- [ ] Required validation works
- [ ] Auto-fill from account works
- [ ] Dropdown styling matches form design

### Form Submission
- [ ] Can create estimate with Ring
- [ ] Can create estimate with Earring
- [ ] Can create estimate with Necklace
- [ ] Can create estimate with Bracelet
- [ ] Can create estimate with Bangle
- [ ] Can create estimate with Pendant
- [ ] Can create estimate with Anklet

### PDF Generation
- [ ] Selected item appears in PDF
- [ ] Item name formatted correctly
- [ ] PDF layout not broken

### Edit Mode
- [ ] Existing estimate loads with correct item
- [ ] Can change item in edit mode
- [ ] Updated item saves correctly

## Summary

The Item Name field has been updated to a dropdown with 7 jewelry item options:

✅ **Ring** - Finger jewelry
✅ **Earring** - Ear jewelry
✅ **Necklace** - Neck jewelry
✅ **Bracelet** - Wrist jewelry
✅ **Bangle** - Rigid wrist jewelry
✅ **Pendant** - Hanging jewelry
✅ **Anklet** - Ankle jewelry

This provides standardized, consistent item naming across all estimates while maintaining the auto-fill functionality from customer accounts.

---

**File Modified:** `EstimateVoucherForm.tsx`
**Field Changed:** Item Name (Input → Dropdown)
**Options Added:** 7 jewelry types
**Status:** ✅ Complete and Ready to Use
