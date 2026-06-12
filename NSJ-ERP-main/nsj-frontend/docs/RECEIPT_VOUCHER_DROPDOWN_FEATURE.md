# Receipt Voucher Dropdown Feature

## Overview

Added functionality to fetch and select existing receipt vouchers when converting a query to an order. This provides proof of payment by linking the query to an actual receipt voucher from the system.

## Changes Made

### 1. Backend API Integration (`lib/backend.ts`)

#### Added Receipt Type

```typescript
export type ReceiptResponse = {
  id: string;
  type?: "Cr" | "Dr" | null;
  party_name?: {
    id: string;
    account_name: string;
    name: string;
  } | null;
  balance?: number | null;
  dr?: number | null;
  cr?: number | null;
  narration?: string | null;
  date?: string | null;
  created_at: string;
  updated_at: string;
};
```

#### Exported Receipt Functions

- `receiptOverview()` - Get receipt overview/summary
- `receiptList(params)` - Fetch paginated list of receipts
- `receiptDetail(id)` - Get single receipt details
- `receiptCreate(payload)` - Create new receipt
- `receiptUpdate(id, payload)` - Update existing receipt
- `receiptDelete(id)` - Delete receipt

### 2. Convert Query Component (`app/vouchers/pending-queries/[id]/convert/ConvertClient.tsx`)

#### New State Variables

- `receipts` - Array of available receipt vouchers
- `loadingReceipts` - Loading state for receipt fetch
- `selectedReceiptId` - Currently selected receipt from dropdown

#### New useEffect Hooks

**Fetch Receipts:**

```typescript
useEffect(() => {
  const loadReceipts = async () => {
    setLoadingReceipts(true);
    try {
      const data = await receiptList({ page_size: 100 });
      setReceipts(data.results || []);
    } catch (err) {
      // Error handling with toast notification
    } finally {
      setLoadingReceipts(false);
    }
  };
  void loadReceipts();
}, [toast]);
```

**Auto-fill Form Fields:**

```typescript
useEffect(() => {
  if (selectedReceiptId) {
    const selectedReceipt = receipts.find((r) => r.id === selectedReceiptId);
    if (selectedReceipt) {
      setAdvanceAmount(
        selectedReceipt.cr?.toString() || selectedReceipt.dr?.toString() || ""
      );
      setPaymentDate(
        selectedReceipt.date || new Date().toISOString().split("T")[0]
      );
      setRemarks(selectedReceipt.narration || "");
      setReceiptVoucherNo(selectedReceipt.id);
    }
  }
}, [selectedReceiptId, receipts]);
```

#### Updated UI Components

**Receipt Dropdown:**

- Displays all available receipt vouchers
- Shows party name, type (Cr/Dr), amount, and date
- Auto-fills form fields when a receipt is selected
- Fallback to manual entry if needed

**Form Layout:**

```
┌─────────────────────────────────────────────────────────┐
│ Select Receipt Voucher *                                │
│ [Dropdown with existing receipts]                       │
│ Select from existing receipt vouchers or enter manually │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Receipt Voucher ID                                      │
│ [Auto-filled from selection or manual entry]            │
│ Auto-filled from selected receipt / Or enter manually   │
└─────────────────────────────────────────────────────────┘
```

#### Updated Validation

- Accepts either selected receipt OR manual entry
- Validates that at least one is provided before conversion
- Uses selected receipt ID if available, otherwise uses manual entry

## User Experience Flow

### 1. Navigate to Convert Page

User clicks "Convert" button on a pending query

### 2. View Query Summary

System displays query details (account, item, gold carat, size, etc.)

### 3. Select Receipt Voucher

**Option A: Select from Dropdown**

- User selects an existing receipt voucher from dropdown
- Form fields auto-fill with receipt data:
  - Advance Amount (from Cr/Dr amount)
  - Payment Date (from receipt date)
  - Remarks (from narration)
  - Receipt Voucher ID (receipt ID)

**Option B: Manual Entry**

- User enters receipt voucher ID manually
- User fills in other fields manually

### 4. Review and Convert

- User reviews all information
- Clicks "Convert to Order" button
- System creates order linked to the receipt voucher
- Redirects to pending queries list

## API Endpoints Used

### Receipt Endpoints

- `GET /api/receipt/list/` - Fetch receipt vouchers
- Query params: `page_size=100` (fetch up to 100 receipts)

### Query Endpoints

- `GET /api/payments/queries/{id}/` - Fetch query details
- `POST /api/payments/queries/{id}/convert_to_order/` - Convert query to order
  - Payload: `{ receipt_voucher_id: string }`

## Error Handling

### Receipt Loading Errors

- Non-blocking: User can still enter receipt ID manually
- Toast notification informs user of the issue
- Console logs error for debugging

### Conversion Errors

- Displays error message in toast notification
- Keeps user on conversion page to retry
- Shows specific error message from backend

## Benefits

1. **Proof of Payment**: Links orders to actual receipt vouchers
2. **Data Accuracy**: Auto-fills payment details from existing receipts
3. **User Convenience**: Dropdown selection faster than manual entry
4. **Audit Trail**: Clear connection between query, receipt, and order
5. **Flexibility**: Supports both dropdown selection and manual entry

## Testing Checklist

- [ ] Receipt vouchers load correctly in dropdown
- [ ] Selecting a receipt auto-fills form fields
- [ ] Manual entry works when no receipt is selected
- [ ] Validation prevents conversion without receipt
- [ ] Conversion creates order with correct receipt link
- [ ] Error handling works for failed receipt fetch
- [ ] Error handling works for failed conversion
- [ ] Loading states display correctly
- [ ] Dropdown shows correct receipt information
- [ ] Auto-filled fields are accurate

## Future Enhancements

1. **Filter Receipts by Account**: Only show receipts for the query's account
2. **Search Functionality**: Add search/filter in receipt dropdown
3. **Receipt Preview**: Show full receipt details on hover/click
4. **Recent Receipts**: Prioritize recently created receipts
5. **Amount Validation**: Warn if receipt amount doesn't match expected advance
6. **Receipt Status**: Show if receipt is already linked to another order

## Related Files

- `nsj-frontend/nsj-frontend/lib/backend.ts` - API functions and types
- `nsj-frontend/nsj-frontend/lib/constants.ts` - API endpoint definitions
- `nsj-frontend/nsj-frontend/app/vouchers/pending-queries/[id]/convert/ConvertClient.tsx` - Main component
- `nsj-backend/nsj-backend/vouchers/models.py` - Receipt model definition
- `nsj-backend/nsj-backend/vouchers/urls.py` - Receipt API endpoints

## Backend Receipt Model

```python
class Receipt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE)
    type = models.CharField(max_length=2, choices=[("Cr", "Cr"), ("Dr", "Dr")])
    party_name = models.ForeignKey("accounts.Account", on_delete=models.SET_NULL)
    balance = models.DecimalField(max_digits=14, decimal_places=2)
    dr = models.DecimalField(max_digits=14, decimal_places=2)
    cr = models.DecimalField(max_digits=14, decimal_places=2)
    narration = models.TextField()
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```
