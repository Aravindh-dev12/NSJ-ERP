# Receipt Voucher "Unknown Party" Fix

## Problem

When converting a query to an order, the receipt voucher dropdown was showing "Unknown Party" instead of the actual account/party name.

## Root Cause

The `ReceiptSerializer` was returning the party name in a field called `name`, but the frontend (`ConvertClient.tsx`) was looking for `account_name`:

**Backend (serializers.py):**
```python
return {"id": str(acct_id), "name": name}
```

**Frontend (ConvertClient.tsx line 107):**
```typescript
{receipt.party_name?.account_name || "Unknown Party"}
```

## Solution

Updated the `ReceiptSerializer._present_account_obj()` method to return both `name` and `account_name` fields for frontend compatibility:

```python
def _present_account_obj(self, acct):
    if acct is None:
        return None
    try:
        acct_id = getattr(acct, "id", None) or acct
        name = (
            getattr(acct, "account_name", None)
            or getattr(acct, "name", None)
            or getattr(acct, "display_name", None)
        )
        # Return both 'name' and 'account_name' for frontend compatibility
        return {
            "id": str(acct_id), 
            "name": name,
            "account_name": name  # Added for compatibility
        }
    except Exception:
        return {"id": str(acct), "name": None, "account_name": None}
```

## Files Modified

- `nsj-backend/nsj-backend/vouchers/serializers.py` - Updated `ReceiptSerializer._present_account_obj()` method

## Testing

1. **Restart Django server** to apply the changes
2. Navigate to Pending Queries
3. Click "Convert to Order" on any query
4. Check the "Select Receipt Voucher" dropdown
5. Verify that party names are now displayed correctly instead of "Unknown Party"

## Expected Result

**Before:**
```
Unknown Party - Cr: ₹2000.00 -10/12/2025
Unknown Party - Dr: ₹6.00 -10/12/2025
```

**After:**
```
abc - Cr: ₹2000.00 -10/12/2025
aryan - Dr: ₹6.00 -10/12/2025
```

## Additional Notes

- The fix maintains backward compatibility by returning both field names
- No frontend changes required
- The `select_related("party_name")` in the view was already correct
- The serializer's `get_party_name()` method was already correct

---

**Fixed Date**: December 10, 2025  
**Status**: ✅ Complete
