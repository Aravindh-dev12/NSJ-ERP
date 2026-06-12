# Subaccount and Custom Item Name Feature

## Overview

Added two new optional fields to the Query model:

1. **Subaccount** - Text input field for specifying a subaccount
2. **Custom Item Name** - Allows users to enter custom item names when "Other" is selected

## Changes Made

### 1. Backend Changes

#### Database Model (`issues/models.py`)

Added two new fields to the Query model:

```python
subaccount = models.CharField(max_length=255, blank=True, null=True)
item_name_custom = models.CharField(max_length=255, blank=True, null=True)
```

#### Migration

Created migration: `0004_add_subaccount_and_custom_item_name.py`

- Adds `subaccount` field (nullable, optional)
- Adds `item_name_custom` field (nullable, optional)

#### Serializer (`issues/serializers.py`)

Updated QuerySerializer to include new fields:

```python
fields = [
    "id",
    "account",
    "subaccount",  # NEW
    "item_name",
    "item_name_custom",  # NEW
    "gold_carat",
    # ... other fields
]
```

### 2. Frontend Changes

#### Type Definition (`lib/backend.ts`)

Updated QueryResponse type:

```typescript
export type QueryResponse = {
  id: string;
  account?: { ... } | null;
  subaccount?: string | null;  // NEW
  item_name?: { ... } | null;
  item_name_custom?: string | null;  // NEW
  // ... other fields
};
```

#### Query Form (`components/vouchers/QueryForm.tsx`)

**Schema Update:**

```typescript
const queryFormSchema = z.object({
  // ... existing fields
  subaccount: z.string().optional(), // NEW
  itemNameOther: z.string().optional(), // For custom item name
});
```

**Form UI Changes:**

1. Added Subaccount field in Account Information section
2. Custom item name field appears when "Other" is selected from Item Name dropdown

**Submission Logic:**

```typescript
const payload = {
  // ... existing fields
  subaccount: values.subaccount || undefined,
  item_name_custom:
    values.itemNameId === "other" ? values.itemNameOther : undefined,
};
```

#### Pending Queries List (`components/queries/PendingQueriesList.tsx`)

Updated item name display to show custom names:

```typescript
{
  query.item_name?.name || query.item_name_custom || "—";
}
```

#### Query Detail Page (`app/vouchers/pending-queries/[id]/QueryDetailClient.tsx`)

1. Shows subaccount field if present
2. Displays custom item name if no standard item name exists

#### Convert Page (`app/vouchers/pending-queries/[id]/convert/ConvertClient.tsx`)

Updated to display custom item names in query summary

## User Experience

### Creating a Query

**Subaccount Field:**

- Located in "Account Information" section
- Optional text input
- Placeholder: "Optional subaccount name"
- Help text: "Optional: Specify a subaccount if applicable"

**Custom Item Name:**

1. User selects "Other (please specify)" from Item Name dropdown
2. New field appears: "Specify Item Name \*"
3. User enters custom item name (e.g., "Brooch", "Anklet", "Custom Ring Design")
4. Custom name is saved to `item_name_custom` field

### Viewing Queries

**Pending Queries List:**

- Item column shows either:
  - Standard item name (from ItemNameMaster)
  - Custom item name (if "Other" was selected)
  - "—" if neither exists

**Query Detail Page:**

- Account Information section shows subaccount if present
- Item Details section shows custom item name if no standard item exists

**Convert to Order Page:**

- Query Summary shows custom item name in the Item field

## Database Schema

### Query Table

```sql
-- New columns added
subaccount VARCHAR(255) NULL
item_name_custom VARCHAR(255) NULL

-- Existing columns
id UUID PRIMARY KEY
account_id UUID FOREIGN KEY
item_name_id UUID FOREIGN KEY (nullable)
gold_carat VARCHAR(50)
gender VARCHAR(50)
size VARCHAR(255)
location VARCHAR(255)
delivery_type VARCHAR(100)
query_in_date DATE
expiry_date DATE
reference_image VARCHAR(100)
status VARCHAR(20)
created_by_id UUID
created_at TIMESTAMP
updated_at TIMESTAMP
```

## API Changes

### Query List/Detail Response

```json
{
  "id": "uuid",
  "account": {
    "id": "uuid",
    "account_name": "Customer Name",
    "name": "Customer Name"
  },
  "subaccount": "Subaccount Name", // NEW - optional
  "item_name": {
    "id": "uuid",
    "name": "Ring"
  },
  "item_name_custom": "Custom Brooch Design", // NEW - optional
  "gold_carat": "22K",
  "gender": "Woman",
  "size": "6 inches"
  // ... other fields
}
```

### Query Create Request

```json
{
  "account": { "id": "uuid" },
  "subaccount": "Subaccount Name", // NEW - optional
  "item_name": { "id": "uuid" }, // Optional if item_name_custom is provided
  "item_name_custom": "Custom Item", // NEW - optional
  "gold_carat": "22K",
  "size": "6 inches"
  // ... other fields
}
```

## Validation Rules

### Subaccount

- Optional field
- Max length: 255 characters
- No special validation

### Custom Item Name

- Optional field
- Max length: 255 characters
- Only saved when "Other" is selected from Item Name dropdown
- Takes precedence over standard item name in display

## Display Priority

When displaying item names, the system follows this priority:

1. Standard item name (from ItemNameMaster) if selected
2. Custom item name (if "Other" was selected)
3. "—" (dash) if neither exists

## Migration Instructions

### Backend

```bash
cd nsj-backend/nsj-backend
python manage.py migrate issues
```

### Frontend

No migration needed - changes are backward compatible

## Testing Checklist

- [ ] Create query with subaccount field filled
- [ ] Create query without subaccount field (should work)
- [ ] Create query with standard item name
- [ ] Create query with "Other" and custom item name
- [ ] View pending queries list - custom item names display correctly
- [ ] View query detail - subaccount displays when present
- [ ] View query detail - custom item name displays correctly
- [ ] Convert query with custom item name - displays in summary
- [ ] Edit query - subaccount field is editable
- [ ] API returns subaccount and item_name_custom fields

## Backward Compatibility

✅ **Fully backward compatible**

- Existing queries without these fields will continue to work
- Fields are nullable and optional
- Display logic handles missing values gracefully
- No breaking changes to API

## Future Enhancements

1. **Subaccount Dropdown**: Convert subaccount to a dropdown with predefined options
2. **Custom Item Validation**: Add validation rules for custom item names
3. **Item Name Search**: Allow searching by custom item names
4. **Subaccount Filtering**: Add filter for subaccount in pending queries list
5. **Item Name Suggestions**: Auto-suggest custom item names based on history

## Related Files

### Backend

- `nsj-backend/nsj-backend/issues/models.py` - Query model
- `nsj-backend/nsj-backend/issues/serializers.py` - QuerySerializer
- `nsj-backend/nsj-backend/issues/migrations/0004_add_subaccount_and_custom_item_name.py` - Migration

### Frontend

- `nsj-frontend/nsj-frontend/lib/backend.ts` - QueryResponse type
- `nsj-frontend/nsj-frontend/components/vouchers/QueryForm.tsx` - Query creation form
- `nsj-frontend/nsj-frontend/components/queries/PendingQueriesList.tsx` - List view
- `nsj-frontend/nsj-frontend/app/vouchers/pending-queries/[id]/QueryDetailClient.tsx` - Detail view
- `nsj-frontend/nsj-frontend/app/vouchers/pending-queries/[id]/convert/ConvertClient.tsx` - Convert view
