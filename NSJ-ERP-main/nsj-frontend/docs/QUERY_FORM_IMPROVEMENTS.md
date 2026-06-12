# Query Form UI Improvements

## Overview

Completely redesigned the customer query form with modern UX patterns including progressive disclosure, auto-calculating dates, and PDF export functionality.

## Key Improvements

### 1. Progressive Disclosure (Step-by-Step Form) ✨

**Problem:** Users had to scroll through a long form and could miss required fields.

**Solution:** Implemented a 4-step wizard with visual progress indicator:

- **Step 1:** Account Information (Account, Subaccount, Location)
- **Step 2:** Item Details (Item Name, Gold Carat, Size, Gender)
- **Step 3:** Timeline & Delivery (Query Date, Expiry, Delivery Type)
- **Step 4:** Additional Details (Reference Image)

**Benefits:**

- Users focus on one section at a time
- No scrolling required
- Clear validation at each step
- Can't proceed without filling required fields
- Visual progress indicator shows completion status

### 2. Auto-Calculating Expiry Dates 📅

**Problem:** Users had to manually calculate expiry dates or count days.

**Solution:** Bidirectional auto-calculation:

- Enter "Expiry in Days" (e.g., 7, 14, 30) → Expiry Date auto-calculates
- Select "Expiry Date" → Days until expiry auto-calculates
- Both fields stay in sync with Query Date

**Example:**

```
Query Date: Dec 9, 2025
Expiry Days: 7
→ Expiry Date: Dec 16, 2025 (auto-calculated)
```

### 3. PDF Export / Print Functionality 🖨️

**Problem:** No way to immediately share query details with customers.

**Solution:** After saving, users get a modal with options:

- **Print / Export PDF** - Opens print-friendly formatted document
- **View Pending Queries** - Go to queries list
- **Create Another Query** - Reset form for new entry

**PDF Features:**

- Professional formatting with jewelry-themed styling
- All query details organized in sections
- Includes account, item, and delivery information
- Print-ready layout
- Mobile-friendly (can share from phone)

### 4. Modern Visual Design 🎨

**Changes:**

- Cleaner, more spacious layout
- Gold/amber color scheme (jewelry theme)
- Progress indicator with checkmarks
- Better typography and spacing
- Emoji icons for visual appeal
- Improved button styling

### 5. Better Validation & User Guidance ✓

**Improvements:**

- Step-by-step validation (can't skip ahead)
- Clear error messages
- Inline help text for each field
- Required fields marked with \*
- Validation happens before moving to next step

## Technical Implementation

### New Component

**File:** `components/vouchers/QueryFormImproved.tsx`

**Key Features:**

- React state management for multi-step form
- Auto-calculation logic for dates
- PDF generation using window.print()
- Progressive disclosure with step validation
- File upload with preview

### New Route

**File:** `app/vouchers/pending-queries/new/page.tsx`

- Dedicated route for creating new queries
- Uses the improved form component

### Date Calculation Logic

```typescript
// Auto-calculate expiry date from days
useEffect(() => {
  if (expiryDays && queryInDate) {
    const days = parseInt(expiryDays);
    if (!isNaN(days) && days > 0) {
      const queryDate = new Date(queryInDate);
      queryDate.setDate(queryDate.getDate() + days);
      setExpiryDate(queryDate.toISOString().split("T")[0]);
    }
  }
}, [expiryDays, queryInDate]);

// Auto-calculate days from expiry date
useEffect(() => {
  if (expiryDate && queryInDate && !expiryDays) {
    const query = new Date(queryInDate);
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - query.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      setExpiryDays(diffDays.toString());
    }
  }
}, [expiryDate, queryInDate]);
```

### PDF Generation

```typescript
function generateQueryPDF(data: any) {
  const printWindow = window.open("", "_blank");
  // Generates formatted HTML with:
  // - Professional header
  // - Organized sections
  // - Print and Close buttons
  // - Jewelry-themed styling
}
```

## User Flow

### Creating a Query

1. **Navigate to New Query**
   - Click "Add New" from Pending Queries page
   - Or go to `/vouchers/pending-queries/new`

2. **Step 1: Account Information**
   - Select customer account (required)
   - Optionally add subaccount
   - Optionally add delivery location
   - Click "Next →"

3. **Step 2: Item Details**
   - Select item name or choose "Other" (required)
   - If "Other", specify custom item name
   - Select gold carat (required)
   - Enter size (required)
   - Optionally select gender
   - Click "Next →"

4. **Step 3: Timeline & Delivery**
   - Query date pre-filled with today
   - Enter expiry days OR select expiry date
   - Dates auto-calculate
   - Optionally select delivery type
   - Click "Next →"

5. **Step 4: Additional Details**
   - Optionally upload reference image
   - Preview image before saving
   - Click "💾 Save Query"

6. **Success Modal**
   - Choose to print/export PDF
   - View pending queries
   - Or create another query

### Navigation

- **Previous** button to go back to previous step
- **Next** button to proceed (validates current step)
- **Cancel** button to exit form
- Progress indicator shows current step

## Validation Rules

### Step 1 Validation

- Account must be selected
- Cannot proceed without account

### Step 2 Validation

- Item name must be selected
- If "Other" selected, custom name required
- Gold carat must be selected
- Size must be entered

### Step 3 Validation

- Query date must be selected
- Expiry date/days are optional

### Step 4 Validation

- All fields optional
- File type validation (JPG/PNG/PDF only)

## Mobile Optimization

### Responsive Design

- Single column layout on mobile
- Touch-friendly buttons
- Large tap targets
- Optimized spacing

### Mobile-Specific Features

- PDF can be shared directly from phone
- Print dialog works on mobile browsers
- Form saves progress (via browser state)
- Easy navigation between steps

## Comparison: Old vs New

| Feature            | Old Form         | New Form        |
| ------------------ | ---------------- | --------------- |
| Layout             | Single long form | 4-step wizard   |
| Validation         | On submit        | Per step        |
| Expiry Calculation | Manual           | Auto-calculate  |
| PDF Export         | None             | Built-in        |
| Progress Indicator | None             | Visual stepper  |
| Mobile UX          | Scrolling        | Step-by-step    |
| Error Handling     | Scroll to error  | Inline per step |
| Visual Design      | Basic            | Modern themed   |

## Benefits

### For Users

- ✅ Faster data entry
- ✅ Fewer errors
- ✅ No scrolling needed
- ✅ Clear progress indication
- ✅ Immediate PDF sharing
- ✅ Better mobile experience

### For Business

- ✅ Professional customer-facing documents
- ✅ Reduced data entry errors
- ✅ Faster query creation
- ✅ Better customer communication
- ✅ Mobile-friendly for field sales

## Future Enhancements

1. **Save Draft**: Auto-save form progress
2. **Templates**: Save common query configurations
3. **Bulk Import**: Import multiple queries from Excel
4. **Email PDF**: Send PDF directly to customer email
5. **WhatsApp Share**: Share PDF via WhatsApp
6. **QR Code**: Generate QR code for query tracking
7. **Signature**: Add customer signature to PDF
8. **Multi-language**: Support for regional languages

## Testing Checklist

- [ ] Step 1: Account selection works
- [ ] Step 2: Item details validation works
- [ ] Step 3: Date auto-calculation works
- [ ] Step 4: File upload and preview works
- [ ] Cannot skip steps without filling required fields
- [ ] Previous button navigates back correctly
- [ ] PDF generation works and formats correctly
- [ ] PDF prints correctly
- [ ] Success modal shows all options
- [ ] Form resets when creating another query
- [ ] Mobile responsive on all steps
- [ ] File type validation works
- [ ] Custom item name field appears when "Other" selected
- [ ] Expiry days → date calculation works
- [ ] Expiry date → days calculation works

## Files Modified/Created

### New Files

- `components/vouchers/QueryFormImproved.tsx` - New improved form component
- `app/vouchers/pending-queries/new/page.tsx` - New query creation page
- `QUERY_FORM_IMPROVEMENTS.md` - This documentation

### Existing Files (Not Modified)

- `components/vouchers/QueryForm.tsx` - Original form (kept for reference)
- `components/queries/PendingQueriesList.tsx` - List component

## Usage

### Access the New Form

```
URL: /vouchers/pending-queries/new
```

### Import in Code

```typescript
import { QueryFormImproved } from "@/components/vouchers/QueryFormImproved";

export default function Page() {
  return <QueryFormImproved />;
}
```

## Notes

- Original QueryForm.tsx is preserved for backward compatibility
- New form uses same backend API endpoints
- PDF generation works in all modern browsers
- Mobile browsers may show native print dialog
- Form state is not persisted (refresh loses data)
- File uploads are handled same as original form

## Support

For issues or questions:

1. Check browser console for errors
2. Verify all required fields are filled
3. Ensure popup blocker allows PDF window
4. Test in different browsers if PDF doesn't generate
