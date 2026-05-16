# Auto-Archive Expired Queries - Implementation Guide

## Overview
Queries that expired yesterday are automatically archived when users view the Pending Queries page. This ensures the pending list stays clean and relevant without requiring manual intervention.

## How It Works

### Trigger
Auto-archive runs when:
- User opens the Pending Queries page
- Page refreshes or reloads
- User navigates back to the page

### Logic
```
1. Load all pending queries
2. Check each query's expiry date
3. If expiry date = yesterday's date:
   - Generate PDF
   - Archive the query
   - Remove from pending list
4. Show notification of archived count
```

### Date Comparison
```typescript
Today: December 16, 2025
Yesterday: December 15, 2025

Query with expiry date = December 15, 2025
→ Will be auto-archived ✅

Query with expiry date = December 14, 2025
→ Already expired, but not yesterday (won't auto-archive)

Query with expiry date = December 16, 2025
→ Expires today (won't auto-archive yet)
```

## Implementation Details

### Date Check Function
```typescript
const isExpiryYesterday = (expiryDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  
  return expiry.getTime() === yesterday.getTime();
}
```

### Auto-Archive Process
```typescript
1. Filter queries: expiry date = yesterday
2. For each query:
   a. Generate PDF
   b. Call archive API
   c. Track success/failure
3. Remove archived queries from list
4. Show notification
```

## User Experience

### Scenario 1: Normal Day
```
User opens Pending Queries page
↓
System checks: No queries expired yesterday
↓
Page loads normally
↓
No notification shown
```

### Scenario 2: Queries Expired Yesterday
```
User opens Pending Queries page
↓
System finds: 3 queries expired yesterday
↓
Auto-archive process starts:
  - Generate PDFs (silent)
  - Archive queries
  - Remove from list
↓
Notification shown:
"Expired Queries Auto-Archived
3 queries that expired yesterday have been automatically archived."
↓
User sees clean pending list
```

### Scenario 3: Query Expires Today
```
Query Date: Dec 10, 2025
Expiry Date: Dec 16, 2025
Today: Dec 16, 2025

Status: Expires today (shown in amber)
Action: NOT auto-archived yet
Reason: Will be archived tomorrow (Dec 17)
```

## Visual Indicators

### Before Auto-Archive
```
┌────────────────────────────────────────────────────────────┐
│ Pending Queries                                            │
├────────────────────────────────────────────────────────────┤
│ Account │ Item │ Expiry Date │ Status                     │
├────────────────────────────────────────────────────────────┤
│ John    │ Ring │ Dec 15, 2025│ 🔴 Expired                 │
│ Jane    │ Neck │ Dec 16, 2025│ 🟡 Expires today           │
│ Bob     │ Brac │ Dec 18, 2025│ 🟢 Active                  │
└────────────────────────────────────────────────────────────┘

Today: December 16, 2025
John's query expired yesterday → Will be auto-archived
```

### After Auto-Archive
```
┌────────────────────────────────────────────────────────────┐
│ Pending Queries                                            │
├────────────────────────────────────────────────────────────┤
│ ✅ Expired Queries Auto-Archived                          │
│ 1 query that expired yesterday has been automatically     │
│ archived.                                                  │
├────────────────────────────────────────────────────────────┤
│ Account │ Item │ Expiry Date │ Status                     │
├────────────────────────────────────────────────────────────┤
│ Jane    │ Neck │ Dec 16, 2025│ 🟡 Expires today           │
│ Bob     │ Brac │ Dec 18, 2025│ 🟢 Active                  │
└────────────────────────────────────────────────────────────┘

John's query has been moved to Archived Queries
```

## Timeline Example

### Day-by-Day Scenario

**December 10, 2025 (Query Created)**
```
Query Date: Dec 10
Expiry Date: Dec 15
Status: Active (5 days remaining)
```

**December 14, 2025 (Day Before Expiry)**
```
Query Date: Dec 10
Expiry Date: Dec 15
Status: Expires tomorrow (1 day remaining)
```

**December 15, 2025 (Expiry Day)**
```
Query Date: Dec 10
Expiry Date: Dec 15
Status: Expires today
Action: Still visible in pending list
```

**December 16, 2025 (Day After Expiry)**
```
Query Date: Dec 10
Expiry Date: Dec 15 (yesterday)
Status: Expired yesterday
Action: AUTO-ARCHIVED when user opens page
Result: Moved to Archived Queries
```

**December 17, 2025 (Two Days After Expiry)**
```
Query Date: Dec 10
Expiry Date: Dec 15 (2 days ago)
Status: Already archived
Action: None (already in archive)
```

## Why Only Yesterday?

### Rationale
1. **Grace Period** - Gives users one day to see expired queries
2. **Prevents Immediate Loss** - Query visible on expiry day
3. **Predictable** - Users know queries archived next day
4. **Clean List** - Old expired queries don't accumulate

### Alternative Approaches (Not Used)

**Immediate Archive (Expiry Day)**
```
❌ Too aggressive
❌ No grace period
❌ User might miss the query
```

**Archive All Expired**
```
❌ Archives queries from weeks ago
❌ No control over timing
❌ Unpredictable behavior
```

**Manual Only**
```
❌ Requires user action
❌ List gets cluttered
❌ More work for users
```

## Benefits

### For Users
✅ **Automatic Cleanup** - No manual archiving needed
✅ **Grace Period** - One day to see expired queries
✅ **Clean List** - Only relevant queries shown
✅ **PDF Preserved** - All queries have PDFs generated
✅ **Predictable** - Know when queries will be archived

### For Business
✅ **Data Preservation** - All queries archived, not deleted
✅ **Audit Trail** - Complete record maintained
✅ **Efficiency** - Reduces manual work
✅ **Organization** - Pending list stays manageable
✅ **Professional** - Automated workflow

## Error Handling

### PDF Generation Fails
```
If PDF generation fails:
- Log error
- Continue with archive
- Query still archived
- User can download PDF later from archive
```

### Archive API Fails
```
If archive API fails:
- Log error
- Query remains in pending
- Will retry next time page loads
- No data loss
```

### Partial Success
```
If 3 queries to archive, 2 succeed, 1 fails:
- Show notification: "2 queries archived"
- Failed query remains in pending
- Will retry next time
```

## Testing Scenarios

### Test Case 1: Query Expired Yesterday
```
Setup:
- Create query with expiry = yesterday
- Open pending queries page

Expected:
- Query auto-archived
- Notification shown
- Query removed from list
- Query appears in archived list
```

### Test Case 2: Query Expires Today
```
Setup:
- Create query with expiry = today
- Open pending queries page

Expected:
- Query NOT archived
- No notification
- Query remains in pending list
- Shows "Expires today" badge
```

### Test Case 3: Multiple Expired Yesterday
```
Setup:
- Create 5 queries with expiry = yesterday
- Open pending queries page

Expected:
- All 5 queries archived
- Notification: "5 queries archived"
- All removed from pending list
- All appear in archived list
```

### Test Case 4: No Expired Queries
```
Setup:
- All queries have future expiry dates
- Open pending queries page

Expected:
- No auto-archive
- No notification
- All queries remain in list
```

## Performance Considerations

### Optimization
- Archives run in background (async)
- Page loads immediately
- User can interact while archiving
- Notification shows when complete

### Throttling
- Only runs on page load
- Doesn't run continuously
- No performance impact on other pages

### Scalability
- Handles multiple queries efficiently
- Parallel PDF generation
- Parallel archive API calls
- Progress tracked per query

## Monitoring

### Logs
```
Console logs for debugging:
- "Auto-archiving X queries that expired yesterday"
- "Successfully archived query: {id}"
- "Failed to archive query: {id} - {error}"
```

### Metrics to Track
- Number of queries auto-archived per day
- Success rate of auto-archive
- PDF generation success rate
- Time taken for auto-archive process

## Future Enhancements

### Potential Improvements
1. **Configurable Grace Period** - Admin sets days before archive
2. **Scheduled Job** - Backend cron job instead of frontend
3. **Email Notifications** - Notify users before auto-archive
4. **Archive Preview** - Show queries to be archived
5. **Undo Option** - Reopen recently auto-archived queries
6. **Batch Processing** - Archive in batches for performance
7. **Archive Report** - Daily summary of archived queries

## Summary

The auto-archive feature provides:

✅ **Automatic** - Archives queries that expired yesterday
✅ **Smart** - Only archives after grace period
✅ **Safe** - Generates PDFs before archiving
✅ **Transparent** - Shows notification of archived count
✅ **Efficient** - Runs in background without blocking
✅ **Reliable** - Handles errors gracefully

Users benefit from a clean, organized pending queries list without manual intervention!

---

**Trigger:** Page load of Pending Queries
**Condition:** Expiry date = yesterday
**Action:** Generate PDF + Archive + Notify
**Status:** ✅ Implemented and Ready
