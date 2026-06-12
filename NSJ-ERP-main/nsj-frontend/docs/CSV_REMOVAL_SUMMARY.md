# CSV Data Removal Summary

## ✅ Completed: Dummy Data Commented Out

All CSV dummy data usage has been commented out and replaced with placeholder UI until backend integration is complete.

## Files Modified

### 1. **`components/useSalesData.ts`**

- ✅ Commented out Papa Parse CSV loading logic
- ✅ Returns empty array until backend integration
- ✅ Added TODO comment for backend replacement

### 2. **`lib/csvFilterData.ts`**

- ✅ Commented out CSV parsing for filter population
- ✅ Returns empty filter arrays
- ✅ Added TODO comment for backend API call

### 3. **Chart Components** (All updated with placeholder UI)

- ✅ `components/DashboardKPIs.tsx` - Shows "--" with "Upload data to view metrics"
- ✅ `components/RevenueOverTimeChart.tsx` - Shows "Upload data to view chart"
- ✅ `components/TopCustomersBySalesChart.tsx` - Shows placeholder message
- ✅ `components/BacklogDistributionChart.tsx` - Shows placeholder message
- ✅ `components/ProductCategoryChart.tsx` - Shows placeholder message
- ✅ `components/SalesPersonRevenueChart.tsx` - Shows placeholder message
- ✅ `components/IndiaStatesSalesHeatmap.tsx` - Shows "Upload data to view map"
- ✅ `components/DashboardRecentOrders.tsx` - Shows "Upload data to view orders"

## UI Changes

### Before (with dummy CSV data):

- Dashboard showed charts and metrics populated from `/Raw data dump-June to August sales.csv`
- All visualizations displayed historical data

### After (placeholder mode):

- All KPI cards show `--` with italic text: "Upload data to view metrics"
- All charts show: "Upload data to view chart"
- Recent orders table shows: "Upload data to view orders"
- Clean, consistent placeholder state across the entire dashboard

## What Users Will See

When users visit the dashboard now:

1. **Empty state** - All charts and metrics show placeholders
2. **Clear call-to-action** - "Upload data" message guides users
3. **Import button** - Green "Import Data" button at top-right is the primary action

## Next Steps for Backend Integration

### 1. **Authentication** (In Progress)

- Fix backend signup endpoint (currently returning 500 error)
- OR get valid test credentials from backend team
- Test login at http://localhost:3000/api-test

### 2. **Upload Flow** (Ready to Test)

Once logged in:

- Click "Import Data" button
- Upload Excel/CSV file with sales records
- Backend receives file at `POST /sales-records/upload`
- Backend should process and store data

### 3. **Replace Placeholders with API Calls**

#### KPIs (`DashboardKPIs.tsx`)

```typescript
// Replace with:
const { data: metrics } = await backend.getSalesAggregates();
// Then use: metrics.totalRevenue, metrics.avgMargin, etc.
```

#### Charts

```typescript
// Replace useSalesData() with:
const { data: salesData } = await backend.listSalesRecords();
// Then process salesData for each chart
```

#### Recent Orders Table

```typescript
// Replace with:
const { data: orders } = await backend.listSalesRecords({
  page: 1,
  page_size: 20,
});
```

### 4. **API Endpoints Needed**

Based on the dashboard requirements, you'll need these backend endpoints:

```typescript
// Already exists:
backend.uploadSalesRecords(file); // ✅ POST /sales-records/upload (correct endpoint!)
backend.listSalesRecords(params); // ✅ GET /sales-records
backend.getSalesAggregates() - // ✅ GET /sales-records/aggregates
  // May need to add:
  GET / sales -
  records / by -
  month - // For revenue trend chart
  GET / sales -
  records / by -
  customer - // For top customers chart
  GET / sales -
  records / by -
  category - // For product category chart
  GET / sales -
  records / by -
  state - // For heatmap
  GET / sales -
  records / by -
  person; // For salesperson chart
```

Or use the existing endpoints with query parameters to filter/aggregate data on the backend.

## Testing

### Type Check: ✅ Passing

```bash
pnpm typecheck  # No errors
```

### Visual Check

1. Visit http://localhost:3000/dashboard (requires login)
2. Should see all placeholder messages
3. Should see "Import Data" button prominently
4. UI should be clean with no error states

## Rollback Instructions

If you need to re-enable CSV data temporarily:

1. **Uncomment in `useSalesData.ts`**:
   - Remove the `/* */` comments around the useEffect block

2. **Uncomment in `csvFilterData.ts`**:
   - Remove the `/* */` comments around the fetch/parse logic
   - Remove the empty return statement

3. **Remove placeholder checks in components**:
   - Remove the `if (data.length === 0) { return ... }` blocks

## Files Not Modified

These files still reference CSV but are not currently used:

- ❌ `components/dashboard-graphs.tsx` - Not imported anywhere, can be deleted
- ❌ `lib/csvPreview.ts` - Utility not currently used

## Documentation Updated

- ✅ Created this summary document
- ✅ Updated TODO list with backend integration tasks
- ✅ All modified files have TODO comments marking where backend calls should go
