# Estimate Voucher Line Items Enhancements

## Overview
Enhanced the Estimate Voucher form with improved line item management, including raw material dropdowns, automatic unit selection, and compulsory line items.

## Features Implemented

### 1. Raw Material Dropdown in Particulars Column
- Added dropdown functionality directly in the "Particulars" column
- Options available:
  - Diamond
  - Gemstone
- Automatically sets the appropriate unit based on selection
- No separate "Item Description" column needed

### 2. Automatic Unit Selection
- **Diamond** → Automatically sets unit to **Carats (CT)**
- **Gemstone** → Automatically sets unit to **Carats (CT)**
- **Gold** → Automatically sets unit to **Grams (GM)**
- Units are displayed as read-only fields (auto-populated)

### 3. Permanent Compulsory Line Items
Two line items are now **always present** and **cannot be removed**:

#### Gold (Compulsory)
- Always included in every estimate
- Unit: Grams (GM)
- Cannot be deleted
- Must have weight and rate filled in

#### Craftsmanship Fee (Compulsory)
- Always included in every estimate
- No specific unit required
- Cannot be deleted
- Must have amount filled in

### 4. Unit Conversion Logic
Conversion formulas implemented:
- **1 gram = 5 carats**
- **1 carat = 0.20 grams**

Helper functions available:
```typescript
convertGramsToCarats(grams: number): number
convertCaratsToGrams(carats: number): number
```

### 5. Validation Rules
- Gold and Craftsmanship Fee cannot be left blank
- Gold and Craftsmanship Fee cannot be deleted
- Each line item must have correct unit based on raw material
- Weight × Rate = Amount (automatic calculation)
- Compulsory items must have weight and rate values

### 6. UI/UX Improvements
- Compulsory line items highlighted with amber background
- "Required" label shown instead of "Delete" button for compulsory items
- Dropdown for selecting raw materials integrated into Particulars column
- Compulsory items show as read-only gray boxes with "(Compulsory)" label
- Clear conversion information displayed above the table
- Helpful tooltips and guidance text
- Streamlined table with one less column (no separate Item Description)

## Database Changes

### New Fields in `EstimateLineItem` Model
```python
is_compulsory = models.BooleanField(default=False)
raw_material = models.CharField(
    max_length=20,
    choices=[
        ("Diamond", "Diamond"),
        ("Gemstone", "Gemstone"),
        ("Gold", "Gold"),
        ("Craftsmanship", "Craftsmanship Fee"),
    ],
    blank=True,
    null=True,
)
```

### Migration
- Migration file: `0023_add_raw_material_fields_to_estimate_line_items.py`
- Status: ✅ Applied successfully

## Frontend Changes

### Updated Components
- `EstimateVoucherForm.tsx` - Main form component with all enhancements

### New Interface Fields
```typescript
interface LineItem {
  // ... existing fields
  isCompulsory?: boolean;
  rawMaterial?: 'Diamond' | 'Gemstone' | 'Gold' | 'Craftsmanship' | '';
}
```

## Usage

### Creating a New Estimate
1. Form automatically includes Gold and Craftsmanship Fee line items
2. Fill in required fields for compulsory items
3. Click "+ Add Line Item" to add variable raw materials
4. Select raw material from dropdown (Diamond or Gemstone)
5. Unit is automatically set based on selection
6. Enter weight and rate - amount calculates automatically

### Editing an Existing Estimate
- Compulsory items (Gold and Craftsmanship Fee) remain protected
- Variable line items can be added or removed as needed
- All validation rules apply

## Testing Checklist
- [x] Compulsory line items appear on new estimate creation
- [x] Gold and Craftsmanship Fee cannot be deleted
- [x] Raw material dropdown works correctly
- [x] Units auto-set based on raw material selection
- [x] Validation prevents blank compulsory items
- [x] Amount calculation works with weight × rate
- [x] Database migration applied successfully
- [ ] PDF export includes all line items correctly
- [ ] Edit mode preserves compulsory items

## Notes
- The conversion functions are available but not automatically applied - they're helper utilities for manual conversions if needed
- Compulsory items are initialized when creating a new estimate
- When editing an existing estimate, the form loads with existing line items
