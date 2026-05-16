# Business Days Implementation for Query Expiry

## Overview
The Query Form now correctly calculates expiry dates by skipping Sundays and Indian public/bank holidays, ensuring accurate business day calculations.

## Problem Statement
**Before:** The expiry date calculation simply added calendar days to the query date, incorrectly including Sundays and holidays.

**After:** The system now adds only business days, automatically skipping:
- All Sundays
- Indian public/bank holidays

## Implementation

### New Utility Module: `businessDays.ts`

Location: `nsj-frontend/nsj-frontend/lib/businessDays.ts`

#### Key Functions

1. **`addBusinessDays(startDate, businessDays)`**
   - Adds a specified number of business days to a date
   - Automatically skips Sundays and holidays
   - Returns the calculated expiry date

2. **`countBusinessDays(startDate, endDate)`**
   - Counts business days between two dates
   - Used when user manually selects an expiry date
   - Returns the number of business days

3. **`isBusinessDay(date)`**
   - Checks if a date is a business day
   - Returns false for Sundays and holidays

4. **`getHolidayName(date)`**
   - Returns the holiday name if the date is a holiday
   - Returns null if it's not a holiday

### Indian Holidays Database

The system includes a comprehensive list of Indian public/bank holidays for 2025-2026:

**2025 Holidays:**
- Republic Day (Jan 26)
- Holi (Mar 14)
- Id-ul-Fitr (Mar 31)
- Mahavir Jayanti (Apr 10)
- Ambedkar Jayanti (Apr 14)
- Good Friday (Apr 18)
- May Day (May 1)
- Buddha Purnima (May 12)
- Id-ul-Zuha (Jun 7)
- Muharram (Jul 6)
- Independence Day (Aug 15)
- Parsi New Year (Aug 16)
- Janmashtami (Aug 27)
- Milad-un-Nabi (Sep 5)
- Gandhi Jayanti (Oct 2)
- Dussehra (Oct 2)
- Diwali (Oct 21-22)
- Guru Nanak Jayanti (Nov 5)
- Christmas (Dec 25)

**2026 Holidays:**
- **Second Saturdays (12 days):** Jan 10, Feb 14, Mar 14, Apr 11, May 9, Jun 13, Jul 11, Aug 8, Sep 12, Oct 10, Nov 14, Dec 12
- **Fourth Saturdays (12 days):** Jan 24, Feb 28, Mar 28, Apr 25, May 23, Jun 27, Jul 25, Aug 22, Sep 26, Oct 24, Nov 28, Dec 26
- Republic Day (Jan 26)
- Maha Shivaratri (Feb 15)
- Holi (Mar 3)
- Idul Fitr (Mar 21)
- Ram Navami (Mar 27)
- Mahavir Jayanti (Mar 31)
- Good Friday (Apr 3)
- Dr Ambedkar Jayanti (Apr 14)
- Buddha Purnima (May 1)
- Bakrid / Eid al Adha (May 27)
- Muharram (Jun 26)
- Independence Day (Aug 15)
- Parsi New Year (Aug 16)
- Eid e Milad (Aug 25)
- Ganesh Chaturthi (Sep 15)
- Gandhi Jayanti (Oct 2)
- Vijaya Dashami (Oct 21)
- Diwali (Nov 8-9)
- Guru Nanak Jayanti (Nov 24)
- Christmas Day (Dec 25)

### Updated Query Form Logic

#### Before (Incorrect):
```typescript
// Simply added calendar days
const queryDate = new Date(queryInDate);
queryDate.setDate(queryDate.getDate() + days);
setExpiryDate(queryDate.toISOString().split("T")[0]);
```

#### After (Correct):
```typescript
// Adds business days, skipping Sundays and holidays
const queryDate = new Date(queryInDate);
const expiryDateCalculated = addBusinessDays(queryDate, days);
setExpiryDate(formatDateForInput(expiryDateCalculated));
```

## User Experience Improvements

### 1. Clear Labeling
- Field label changed from "Expiry in Days" to "Expiry in Days (Business Days)"
- Help text: "Enter business days (excludes Sundays & holidays)"

### 2. Visual Feedback
When an expiry date is calculated, the form shows:
- Full date with day of week (e.g., "Monday, December 30, 2025")
- Number of business days from query date
- Warning if expiry falls on a Sunday or holiday

### 3. Holiday Warnings
```
⚠️ Note: This date falls on Diwali (Deepavali)
⚠️ Note: This date falls on a Sunday
```

## Examples

### Example 1: 7 Business Days from Dec 15, 2025 (Monday)

**Input:**
- Query Date: Dec 15, 2025 (Monday)
- Expiry in Days: 7

**Calculation:**
- Dec 16 (Tue) - Day 1
- Dec 17 (Wed) - Day 2
- Dec 18 (Thu) - Day 3
- Dec 19 (Fri) - Day 4
- Dec 20 (Sat) - Skip (weekend)
- Dec 21 (Sun) - Skip (Sunday)
- Dec 22 (Mon) - Day 5
- Dec 23 (Tue) - Day 6
- Dec 24 (Wed) - Day 7

**Result:** Dec 24, 2025 (Wednesday)

### Example 2: 7 Business Days from Oct 15, 2025 (Wednesday)

**Input:**
- Query Date: Oct 15, 2025 (Wednesday)
- Expiry in Days: 7

**Calculation:**
- Oct 16 (Thu) - Day 1
- Oct 17 (Fri) - Day 2
- Oct 18 (Sat) - Skip (weekend)
- Oct 19 (Sun) - Skip (Sunday)
- Oct 20 (Mon) - Day 3
- Oct 21 (Tue) - Skip (Diwali holiday)
- Oct 22 (Wed) - Skip (Diwali Day 2 holiday)
- Oct 23 (Thu) - Day 4
- Oct 24 (Fri) - Day 5
- Oct 25 (Sat) - Skip (weekend)
- Oct 26 (Sun) - Skip (Sunday)
- Oct 27 (Mon) - Day 6
- Oct 28 (Tue) - Day 7

**Result:** Oct 28, 2025 (Tuesday)

**UI Shows:** "⚠️ Note: Calculation skipped Diwali holidays"

## Bidirectional Calculation

### Days → Date
User enters: "7 business days"
System calculates: Expiry date (skipping Sundays/holidays)

### Date → Days
User selects: Expiry date manually
System calculates: Number of business days between query and expiry

## Maintenance

### Updating Holiday List

The holiday list needs to be updated annually. To add holidays:

1. Open `nsj-frontend/nsj-frontend/lib/businessDays.ts`
2. Update the `INDIAN_HOLIDAYS_2025_2026` object
3. Add new year's holidays in format: `"YYYY-MM-DD": "Holiday Name"`

Example:
```typescript
export const INDIAN_HOLIDAYS_2025_2026: Record<string, string> = {
  // ... existing holidays
  "2027-01-26": "Republic Day",
  "2027-03-25": "Holi",
  // ... more 2027 holidays
};
```

### Regional Variations

If different regions observe different holidays, you can:
1. Create region-specific holiday lists
2. Add a region selector to the form
3. Pass the region to the business days calculator

## Testing

### Test Cases

1. **Sunday Skip Test**
   - Query Date: Friday
   - Days: 1
   - Expected: Monday (skips weekend)

2. **Holiday Skip Test**
   - Query Date: Oct 20, 2025
   - Days: 1
   - Expected: Oct 23, 2025 (skips Diwali on Oct 21-22)

3. **Multiple Holidays Test**
   - Query Date: Dec 20, 2025
   - Days: 5
   - Expected: Dec 30, 2025 (skips Christmas on Dec 25 and Sundays)

4. **Reverse Calculation Test**
   - Query Date: Dec 15, 2025
   - Expiry Date: Dec 24, 2025
   - Expected: 7 business days

### Manual Testing Checklist

- [ ] Enter 7 days, verify expiry skips Sundays
- [ ] Enter 7 days during Diwali period, verify holidays skipped
- [ ] Manually select expiry date, verify business days calculated correctly
- [ ] Verify warning shows when expiry falls on Sunday
- [ ] Verify warning shows when expiry falls on holiday
- [ ] Test with query date on Friday (should skip weekend)
- [ ] Test with query date before major holiday
- [ ] Verify bidirectional calculation (days ↔ date)

## Benefits

✅ **Accurate Calculations** - No more incorrect expiry dates
✅ **Business-Friendly** - Aligns with actual working days
✅ **Holiday-Aware** - Respects Indian public holidays
✅ **User-Friendly** - Clear warnings and helpful information
✅ **Maintainable** - Easy to update holiday list annually
✅ **Bidirectional** - Works both ways (days → date, date → days)

## Future Enhancements

1. **Regional Holidays** - Support state-specific holidays
2. **Custom Holidays** - Allow admin to add company-specific holidays
3. **Holiday Calendar View** - Show upcoming holidays in a calendar
4. **Working Hours** - Consider half-day holidays
5. **International Support** - Support holidays for other countries
