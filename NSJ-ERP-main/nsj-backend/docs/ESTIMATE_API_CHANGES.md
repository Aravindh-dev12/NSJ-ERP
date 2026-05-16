# Estimate Voucher API Changes

## Overview
This document describes the API changes made to support raw material dropdowns and compulsory line items in the Estimate Voucher system.

## Database Schema Changes

### EstimateLineItem Model - New Fields

```python
class EstimateLineItem(models.Model):
    # ... existing fields ...
    
    # New fields
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

## API Request/Response Format

### Create Estimate (POST /api/estimates/)

**Request Body:**
```json
{
  "account_id": "uuid-string",
  "item_name": "Custom Ring",
  "date": "2025-12-15",
  "line_items": [
    {
      "particulars": "Gold",
      "shape": "",
      "colour": "",
      "clarity": "",
      "pc": null,
      "weight": 10.500,
      "unit": "GM",
      "rate": 6500.00,
      "amount": 68250.00,
      "order": 0,
      "is_compulsory": true,
      "raw_material": "Gold"
    },
    {
      "particulars": "Craftsmanship Fee",
      "shape": "",
      "colour": "",
      "clarity": "",
      "pc": null,
      "weight": 1.000,
      "unit": "",
      "rate": 5000.00,
      "amount": 5000.00,
      "order": 1,
      "is_compulsory": true,
      "raw_material": "Craftsmanship"
    },
    {
      "particulars": "Diamond",
      "shape": "Round",
      "colour": "D",
      "clarity": "VVS1",
      "pc": 5,
      "weight": 2.500,
      "unit": "CT",
      "rate": 15000.00,
      "amount": 37500.00,
      "order": 2,
      "is_compulsory": false,
      "raw_material": "Diamond"
    }
  ],
  "total_taxable_value": 110750.00,
  "gst_amount": 3322.50,
  "grand_total": 114072.50
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-string",
  "company": "company-uuid",
  "account": {
    "id": "account-uuid",
    "account_name": "John Doe",
    "name": "John Doe"
  },
  "item_name": "Custom Ring",
  "date": "2025-12-15",
  "line_items": [
    {
      "id": "line-item-uuid-1",
      "particulars": "Gold",
      "shape": "",
      "colour": "",
      "clarity": "",
      "pc": null,
      "weight": "10.500",
      "unit": "GM",
      "rate": "6500.00",
      "amount": "68250.00",
      "order": 0,
      "is_compulsory": true,
      "raw_material": "Gold"
    },
    {
      "id": "line-item-uuid-2",
      "particulars": "Craftsmanship Fee",
      "shape": "",
      "colour": "",
      "clarity": "",
      "pc": null,
      "weight": "1.000",
      "unit": "",
      "rate": "5000.00",
      "amount": "5000.00",
      "order": 1,
      "is_compulsory": true,
      "raw_material": "Craftsmanship"
    },
    {
      "id": "line-item-uuid-3",
      "particulars": "Diamond",
      "shape": "Round",
      "colour": "D",
      "clarity": "VVS1",
      "pc": 5,
      "weight": "2.500",
      "unit": "CT",
      "rate": "15000.00",
      "amount": "37500.00",
      "order": 2,
      "is_compulsory": false,
      "raw_material": "Diamond"
    }
  ],
  "total_taxable_value": "110750.00",
  "gst_amount": "3322.50",
  "grand_total": "114072.50",
  "created_at": "2025-12-15T10:30:00Z",
  "updated_at": "2025-12-15T10:30:00Z",
  "created_by": "user-uuid",
  "updated_by": null
}
```

### Update Estimate (PUT /api/estimates/{id}/)

**Request Body:** Same format as Create

**Response (200 OK):** Same format as Create response

### Get Estimate (GET /api/estimates/{id}/)

**Response (200 OK):** Same format as Create response

### List Estimates (GET /api/estimates/)

**Query Parameters:**
- `page` (optional): Page number
- `page_size` (optional): Items per page
- `account_id` (optional): Filter by account UUID

**Response (200 OK):**
```json
{
  "count": 10,
  "next": "http://api/estimates/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid-string",
      "account": {
        "id": "account-uuid",
        "account_name": "John Doe",
        "name": "John Doe"
      },
      "item_name": "Custom Ring",
      "date": "2025-12-15",
      "line_items": [...],
      "total_taxable_value": "110750.00",
      "gst_amount": "3322.50",
      "grand_total": "114072.50",
      "created_at": "2025-12-15T10:30:00Z",
      "updated_at": "2025-12-15T10:30:00Z"
    }
  ]
}
```

## Field Descriptions

### Line Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `particulars` | string | Yes | Item description/name |
| `shape` | string | No | Shape of the item (e.g., "Round", "Oval") |
| `colour` | string | No | Color of the item (e.g., "D", "Green") |
| `clarity` | string | No | Clarity grade (e.g., "VVS1", "VS") |
| `pc` | integer | No | Piece count |
| `weight` | decimal | No | Weight of the item |
| `unit` | string | No | Unit of measurement ("CT" or "GM") |
| `rate` | decimal | No | Rate per unit |
| `amount` | decimal | Yes | Total amount (weight × rate) |
| `order` | integer | Yes | Display order (0-indexed) |
| `is_compulsory` | boolean | No | Whether this is a compulsory line item (default: false) |
| `raw_material` | string | No | Raw material type ("Diamond", "Gemstone", "Gold", "Craftsmanship") |

## Validation Rules

### Backend Validation

1. **At least one line item required**
   ```json
   {
     "line_items": ["At least one line item is required"]
   }
   ```

2. **Particulars required if weight and rate provided**
   ```json
   {
     "line_items": [
       {
         "particulars": ["Particulars field is required for line items with weight and rate"]
       }
     ]
   }
   ```

3. **Compulsory items validation** (Frontend enforced)
   - Gold must be present
   - Craftsmanship Fee must be present
   - Compulsory items cannot have blank values

## Migration

**Migration File:** `0023_add_raw_material_fields_to_estimate_line_items.py`

**Operations:**
- Add `is_compulsory` field (BooleanField, default=False)
- Add `raw_material` field (CharField, max_length=20, nullable)

**To Apply:**
```bash
python manage.py migrate vouchers
```

## Backward Compatibility

✅ **Fully backward compatible**
- New fields are optional (nullable/default values)
- Existing estimates will continue to work
- Old API clients can ignore new fields
- New fields will be `null` or `false` for existing records

## Frontend Integration

### TypeScript Interface
```typescript
interface LineItem {
  id: string;
  particulars: string;
  shape: string;
  colour: string;
  clarity: string;
  pc: number | null;
  weight: number | null;
  unit: 'CT' | 'GM' | '';
  rate: number | null;
  amount: number;
  isCompulsory?: boolean;
  rawMaterial?: 'Diamond' | 'Gemstone' | 'Gold' | 'Craftsmanship' | '';
}
```

### API Call Example
```typescript
import { estimateCreate } from '@/lib/backend';

const payload = {
  account_id: accountId,
  item_name: itemName,
  date: date,
  line_items: lineItems.map((item, index) => ({
    particulars: item.particulars,
    shape: item.shape || "",
    colour: item.colour || "",
    clarity: item.clarity || "",
    pc: item.pc,
    weight: item.weight,
    unit: item.unit || "",
    rate: item.rate,
    amount: item.amount,
    order: index,
    is_compulsory: item.isCompulsory || false,
    raw_material: item.rawMaterial || "",
  })),
  total_taxable_value: totalTaxableValue,
  gst_amount: gstAmount,
  grand_total: grandTotal,
};

const savedEstimate = await estimateCreate(payload);
```

## Testing

### Test Cases

1. **Create estimate with compulsory items**
   - Verify Gold and Craftsmanship Fee are saved with `is_compulsory: true`
   - Verify `raw_material` field is correctly stored

2. **Create estimate with variable items**
   - Add Diamond line item with `raw_material: "Diamond"`
   - Verify unit is "CT"
   - Verify `is_compulsory: false`

3. **Update estimate**
   - Modify existing line items
   - Add new line items
   - Verify compulsory items remain protected

4. **Retrieve estimate**
   - Verify all fields are returned correctly
   - Verify `is_compulsory` and `raw_material` fields are present

## Notes

- The `is_compulsory` field is primarily for frontend UI logic
- The `raw_material` field helps track the type of material for reporting
- Unit conversion logic is handled on the frontend
- Backend stores the actual values as entered (no automatic conversion)
