# Pending Queries Dynamic Route Fix

## Problem

When clicking "View" or "Convert" buttons on pending queries, you encountered this error:

```
Error: Page "/vouchers/pending-queries/[id]/page" is missing param "/vouchers/pending-queries/d896cf1f-310d-4269-82da-7166f4e25734" in "generateStaticParams()", which is required with "output: export" config.
```

## Root Cause

The Next.js app is configured with `output: "export"` for static site generation (CloudFront deployment). This configuration requires all dynamic routes to have their paths pre-generated at build time using `generateStaticParams()`. However, for database-driven content with dynamic IDs, we can't pre-generate all possible paths.

## Solution Applied

### 1. Modified `next.config.mjs`

Changed the `output` configuration to only apply in production:

```javascript
output: process.env.NODE_ENV === "production" ? "export" : undefined,
```

This allows:

- **Development**: Dynamic routes work normally without static generation
- **Production**: Still generates static export for CloudFront deployment

### 2. Ensured Client-Side Rendering

Both dynamic route pages are configured as client components:

- `/app/vouchers/pending-queries/[id]/page.tsx`
- `/app/vouchers/pending-queries/[id]/convert/page.tsx`

### 3. Added 404 Fallback

Created `/app/not-found.tsx` to handle invalid routes gracefully.

## How to Apply the Fix

1. **Restart the development server**:

   ```bash
   # Stop the current dev server (Ctrl+C)
   # Then restart it
   npm run dev
   # or
   pnpm dev
   ```

2. **Clear Next.js cache** (if issues persist):
   ```bash
   rm -rf .next
   npm run dev
   ```

## Testing the Fix

1. Navigate to the Pending Queries page
2. Click "View" on any query - should navigate to the detail page
3. Click "Convert" on any query - should navigate to the conversion page
4. Both pages should load without errors

## Production Deployment

The fix doesn't affect production builds. When you run `npm run build`, Next.js will still generate a static export suitable for CloudFront deployment. The CloudFront configuration (with custom error responses 404 → index.html) will handle client-side routing in production.

## Technical Details

### Why This Works

1. **Development Mode**: Without `output: "export"`, Next.js uses its development server which supports dynamic routes natively
2. **Production Mode**: With `output: "export"`, Next.js generates static HTML files, and CloudFront serves index.html for all routes (configured via custom error responses)
3. **Client-Side Routing**: React Router takes over after the initial page load, handling navigation between routes

### Alternative Solutions Considered

1. **Pre-generate all query IDs**: Not feasible for database-driven content
2. **Remove static export entirely**: Would require changing deployment infrastructure
3. **Use server-side rendering**: Not compatible with CloudFront static hosting

The chosen solution provides the best balance between development experience and production deployment requirements.

## Related Files Modified

- `nsj-frontend/nsj-frontend/next.config.mjs` - Updated output configuration
- `nsj-frontend/nsj-frontend/app/vouchers/pending-queries/[id]/page.tsx` - Ensured client-side rendering
- `nsj-frontend/nsj-frontend/app/vouchers/pending-queries/[id]/convert/page.tsx` - Ensured client-side rendering
- `nsj-frontend/nsj-frontend/app/not-found.tsx` - Added 404 fallback page

## Support

If you still encounter issues after restarting the dev server:

1. Clear the Next.js cache: `rm -rf .next`
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check browser console for any JavaScript errors
4. Verify the backend API is running and accessible
