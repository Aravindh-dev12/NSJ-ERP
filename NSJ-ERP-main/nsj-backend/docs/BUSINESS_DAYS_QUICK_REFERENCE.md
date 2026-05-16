# Business Days Calculator - Quick Reference

## What Changed?

**OLD:** Expiry date = Query date + calendar days (includes weekends & holidays) ❌
**NEW:** Expiry date = Query date + business days (skips Sundays & holidays) ✅

## Quick Examples

| Query Date | Days | Old Result | New Result | Difference |
|------------|------|------------|------------|------------|
| Mon Dec 15 | 7 | Mon Dec 22 | Wed Dec 24 | +2 days (skipped weekend) |
| Mon Oct 20 | 5 | Sat Oct 25 | Wed Oct 29 | +4 days (skipped Diwali + weekend) |
| Tue Dec 23 | 3 | Fri Dec 26 | Mon Dec 29 | +3 days (skipped Christmas + weekend) |

## What Gets Skipped?

### Always Skipped
- ⏭️ **All Sundays**

### Indian Holidays (2025-2026)
- 🇮🇳 Republic Day (Jan 26)
- 🎨 Holi (Mar)
- 🕌 Id-ul-Fitr, Id-ul-Zuha, Muharram
- 🙏 Mahavir Jayanti, Buddha Purnima
- 🇮🇳 Independence Day (Aug 15)
- 🪔 Diwali (Oct)
- 🇮🇳 Gandhi Jayanti (Oct 2)
- 🎄 Christmas (Dec 25)
- And more...

## How to Use

### Option 1: Enter Business Days
```
Expiry in Days (Business Days): [7]
→ System calculates expiry date automatically
→ Skips Sundays and holidays
```

### Option 2: Select Expiry Date
```
Or Expiry Date: [Select date]
→ System calculates business days automatically
→ Shows how many working days
```

## UI Indicators

### Normal Business Day
```
📅 Expiry Date: Wednesday, December 24, 2025
7 business days from query date
```

### Falls on Sunday
```
📅 Expiry Date: Sunday, December 21, 2025
⚠️ Note: This date falls on a Sunday
```

### Falls on Holiday
```
📅 Expiry Date: Thursday, December 25, 2025
⚠️ Note: This date falls on Christmas
```

## Common Scenarios

### 1 Week (7 business days)
- Actual calendar days: 9-11 days
- Depends on weekends and holidays in range

### 2 Weeks (14 business days)
- Actual calendar days: 18-22 days
- Depends on weekends and holidays in range

### 1 Month (30 business days)
- Actual calendar days: 40-45 days
- Depends on weekends and holidays in range

## Calculation Formula

```
Business Days = Working Days Only
              = Total Days - Sundays - Holidays
```

## Testing Quick Checks

✅ **Test 1:** Friday + 1 business day = Monday (skips weekend)
✅ **Test 2:** Dec 24 + 1 business day = Dec 26 (skips Christmas)
✅ **Test 3:** Oct 20 + 1 business day = Oct 23 (skips Diwali)

## Maintenance

**Update holidays annually:**
1. Open: `nsj-frontend/nsj-frontend/lib/businessDays.ts`
2. Add new year's holidays
3. Format: `"YYYY-MM-DD": "Holiday Name"`

## Support

**If calculation seems wrong:**
1. Check if date falls on Sunday
2. Check if date is a holiday
3. Verify holiday list is up to date
4. Count business days manually to confirm

## Key Benefits

✅ Accurate business day calculations
✅ Automatic Sunday skipping
✅ Automatic holiday skipping
✅ Clear visual feedback
✅ Bidirectional calculation (days ↔ date)
✅ Professional and consistent

---

**Remember:** Business days = actual working days, not calendar days!
