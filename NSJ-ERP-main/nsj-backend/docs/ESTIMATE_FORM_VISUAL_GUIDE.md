# Estimate Voucher Form - Visual Guide

## Updated Line Items Table Structure

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Line Items                                                                          [+ Add Line Item]        │
│ Gold and Craftsmanship Fee are compulsory. Units auto-set: Diamond/Gemstone → Carats, Gold → Grams         │
│ Conversion: 1 gram = 5 carats | 1 carat = 0.20 grams                                                       │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                              │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Particulars        │ Shape │ Colour │ Clarity │ PC │ Weight │ Unit │ Rate │ Amount │ Action            ││
│ ├────────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ [Gold (Compulsory)]│       │        │         │    │        │ GM   │      │        │ Required          ││ ← Amber background
│ ├────────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ [Craftsmanship Fee]│       │        │         │    │        │      │      │        │ Required          ││ ← Amber background
│ │ (Compulsory)       │       │        │         │    │        │      │      │        │                   ││
│ ├────────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ [Select...▼]       │       │        │         │    │        │      │      │        │ Delete            ││ ← Variable item
│ │  - Diamond         │       │        │         │    │        │      │      │        │                   ││
│ │  - Gemstone        │       │        │         │    │        │      │      │        │                   ││
│ └────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Example: Filled Form

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Line Items                                                                          [+ Add Line Item]        │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                              │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Particulars           │ Shape │ Colour │ Clarity │ PC │ Weight │ Unit │ Rate    │ Amount  │ Action    ││
│ ├────────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ Gold (Compulsory)     │       │        │         │    │ 10.500 │ GM   │ 6500.00 │68250.00 │ Required  ││
│ ├────────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ Craftsmanship Fee     │       │        │         │    │  1.000 │      │ 5000.00 │ 5000.00 │ Required  ││
│ │ (Compulsory)          │       │        │         │    │        │      │         │         │           ││
│ ├────────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ Diamond               │ Round │   D    │   VVS1  │ 5  │  2.500 │ CT   │15000.00 │37500.00 │ Delete    ││
│ ├────────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ Gemstone              │ Oval  │ Green  │   VS    │ 3  │  1.200 │ CT   │ 8000.00 │ 9600.00 │ Delete    ││
│ └────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                              │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Summary                                                                                                  │ │
│ │                                                                                                          │ │
│ │ Total Taxable Value:                                                                    ₹ 120,350.00    │ │
│ │ GST @ 3%:                                                                               ₹   3,610.50    │ │
│ │ ─────────────────────────────────────────────────────────────────────────────────────────────────────  │ │
│ │ Grand Total:                                                                            ₹ 123,960.50    │ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Key Features Illustrated

### 1. Compulsory Line Items (Amber Background)
- **Gold**: Always present, cannot be deleted
  - Particulars: Shows "Gold (Compulsory)" (read-only, gray background)
  - Unit: "GM" (auto-set, read-only)
  - Action: Shows "Required" instead of "Delete" button

- **Craftsmanship Fee**: Always present, cannot be deleted
  - Particulars: Shows "Craftsmanship Fee (Compulsory)" (read-only, gray background)
  - Unit: Empty (no specific unit)
  - Action: Shows "Required" instead of "Delete" button

### 2. Variable Line Items (White Background)
- **Particulars**: Dropdown with options
  - Select...
  - Diamond
  - Gemstone
  
- When "Diamond" is selected:
  - Particulars field shows "Diamond"
  - Unit: Auto-sets to "CT" (Carats)
  
- When "Gemstone" is selected:
  - Particulars field shows "Gemstone"
  - Unit: Auto-sets to "CT" (Carats)

### 3. Automatic Calculations
- **Amount** = Weight × Rate (calculated automatically)
- **Total Taxable Value** = Sum of all line item amounts
- **GST @ 3%** = Total Taxable Value × 0.03
- **Grand Total** = Total Taxable Value + GST

### 4. Unit Conversion Reference
Displayed above the table:
```
Conversion: 1 gram = 5 carats | 1 carat = 0.20 grams
```

## Validation Rules

### Compulsory Items
✅ Must be present in every estimate
✅ Cannot be deleted
✅ Weight and Rate must be filled
✅ Particulars cannot be blank

### Variable Items
✅ Can be added/removed freely
✅ Must select raw material from dropdown
✅ Unit auto-sets based on raw material
✅ Weight × Rate = Amount (auto-calculated)

### Form Submission
✅ At least one line item required (compulsory items satisfy this)
✅ All compulsory items must have valid data
✅ Numeric fields must contain valid positive numbers
✅ Correct unit must match raw material type

## User Workflow

### Creating a New Estimate
1. Form opens with Gold and Craftsmanship Fee already added
2. Fill in weight and rate for Gold
3. Fill in weight/amount for Craftsmanship Fee
4. Click "+ Add Line Item" to add diamonds or gemstones
5. Select raw material from dropdown
6. Unit auto-sets (CT for Diamond/Gemstone)
7. Enter weight and rate
8. Amount calculates automatically
9. Review totals in Summary section
10. Click "Save Estimate" to save and generate PDF

### Editing an Existing Estimate
1. Form loads with all existing line items
2. Gold and Craftsmanship Fee remain protected (cannot delete)
3. Modify values as needed
4. Add or remove variable line items
5. Click "Save Estimate" to update

## Error Messages

### Compulsory Item Validation
```
❌ Gold is a compulsory line item and must be included
❌ Craftsmanship Fee is a compulsory line item and must be included
❌ This compulsory field cannot be left blank
❌ Weight is required for compulsory items
❌ Rate is required for compulsory items
```

### Deletion Attempt
```
❌ Cannot delete
   Gold and Craftsmanship Fee are compulsory line items and cannot be removed.
```

### Unit Validation
```
❌ Unit must be Carats (CT) for diamonds and gemstones
❌ Unit must be Grams (GM) for gold
```
