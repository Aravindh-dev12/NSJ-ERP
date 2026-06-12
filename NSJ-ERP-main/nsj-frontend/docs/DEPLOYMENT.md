# Deployment Guide

This guide explains how to deploy the JSC Frontend application to AWS CloudFront and S3.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Build Process](#build-process)
- [Manual Deployment](#manual-deployment)
- [Automated Deployment (CI/CD)](#automated-deployment-cicd)
- [Deployment Verification](#deployment-verification)
- [Troubleshooting](#troubleshooting)

## Overview

This application is a **static Next.js site** configured with `output: "export"`, which means:

- ✅ All pages are pre-rendered at build time
- ✅ No Node.js server required
- ✅ Can be deployed to any static hosting (S3, CloudFront, Netlify, etc.)
- ✅ Excellent performance and low cost
- ❌ No server-side rendering (SSR)
- ❌ No API routes in Next.js
- ❌ No dynamic server features

**Why CloudFront?**

- Global CDN for fast content delivery
- SSL/TLS certificate support via AWS Certificate Manager
- Edge caching for optimal performance
- Integrates seamlessly with S3
- Cost-effective for static content

**Docker is NOT required** for CloudFront deployment. Static files are deployed directly to S3.

## Prerequisites

### Local Development

- Node.js 20+
- pnpm 8+
- AWS CLI configured

### AWS Resources

- AWS Account with appropriate permissions
- S3 bucket for hosting static files
- CloudFront distribution (optional but recommended)
- Route 53 for custom domain (optional)
- ACM certificate for HTTPS (optional)

### AWS Permissions Required

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": "arn:aws:cloudfront::*:distribution/*"
    }
  ]
}
```

## Build Process

### 1. Install Dependencies

```bash
pnpm install --frozen-lockfile
```

### 2. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env.local

# Update with your backend API URL
echo "NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com" > .env.local
```

**Important**: The `NEXT_PUBLIC_` prefix is required for browser-accessible variables.

### 3. Build Static Site

```bash
# Build for production
pnpm build

# Output directory: /out
# This contains all static HTML, CSS, JS files
```

### 4. Verify Build

```bash
# Check build output
ls -la out/

# Should contain:
# - index.html (home page)
# - dashboard.html
# - login.html
# - logout.html
# - _next/ (bundled assets)
# - Other static files
```

## Manual Deployment

### Step 1: Create S3 Bucket

```bash
# Create bucket (use a unique name)
aws s3 mb s3://your-app-frontend --region us-east-1

# Enable static website hosting
aws s3 website s3://your-app-frontend \
  --index-document index.html \
  --error-document index.html

# Set bucket policy for public read access
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-app-frontend/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket your-app-frontend \
  --policy file://bucket-policy.json
```

**Note**: For CloudFront distributions, you may want to use Origin Access Identity (OAI) instead of public bucket access.

### Step 2: Upload Static Files

```bash
# Sync build output to S3
aws s3 sync ./out s3://your-app-frontend \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "*.html" \
  --exclude "*.txt"

# Upload HTML files with no-cache (for SPA routing)
aws s3 sync ./out s3://your-app-frontend \
  --exclude "*" \
  --include "*.html" \
  --cache-control "no-cache, no-store, must-revalidate"
```

**Caching Strategy**:

- Static assets (JS, CSS, images): 1 year cache
- HTML files: No cache (ensures latest version)

### Step 3: Create CloudFront Distribution

```bash
# Create distribution configuration
cat > cloudfront-config.json << EOF
{
  "Comment": "JSC Frontend Distribution",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": [
    {
      "Id": "S3-your-app-frontend",
      "DomainName": "your-app-frontend.s3.us-east-1.amazonaws.com",
      "S3OriginConfig": {
        "OriginAccessIdentity": ""
      }
    }
  ],
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-your-app-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
    "CachedMethods": ["GET", "HEAD"],
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": { "Forward": "none" }
    },
    "Compress": true,
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "CustomErrorResponses": [
    {
      "ErrorCode": 404,
      "ResponsePagePath": "/index.html",
      "ResponseCode": 200,
      "ErrorCachingMinTTL": 300
    },
    {
      "ErrorCode": 403,
      "ResponsePagePath": "/index.html",
      "ResponseCode": 200,
      "ErrorCachingMinTTL": 300
    }
  ],
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true
  }
}
EOF

# Create distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

**Important**: Custom error responses (404 → index.html) enable client-side routing for the SPA.

### Step 4: Configure Security Headers (Optional)

Use CloudFront Functions or Lambda@Edge to add security headers:

```javascript
// CloudFront Function to add security headers
function handler(event) {
  var response = event.response;
  var headers = response.headers;

  // Add security headers
  headers["strict-transport-security"] = {
    value: "max-age=31536000; includeSubDomains",
  };
  headers["x-content-type-options"] = { value: "nosniff" };
  headers["x-frame-options"] = { value: "SAMEORIGIN" };
  headers["x-xss-protection"] = { value: "1; mode=block" };
  headers["referrer-policy"] = { value: "strict-origin-when-cross-origin" };

  return response;
}
```

### Step 5: Invalidate Cache

After each deployment, invalidate CloudFront cache:

```bash
# Get distribution ID
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='JSC Frontend Distribution'].Id" \
  --output text)

# Create invalidation
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

# Monitor invalidation status
aws cloudfront get-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --id INVALIDATION_ID
```

## Automated Deployment (CI/CD)

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to CloudFront

on:
  push:
    branches: [main]

env:
  NODE_VERSION: "20"
  AWS_REGION: us-east-1
  S3_BUCKET: your-app-frontend
  CLOUDFRONT_DISTRIBUTION_ID: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}

jobs:
  deploy:
    name: Build and Deploy
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build application
        run: pnpm build
        env:
          NEXT_PUBLIC_API_BASE_URL: ${{ secrets.API_BASE_URL }}

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to S3
        run: |
          aws s3 sync ./out s3://${{ env.S3_BUCKET }} \
            --delete \
            --cache-control "public, max-age=31536000" \
            --exclude "*.html"

          aws s3 sync ./out s3://${{ env.S3_BUCKET }} \
            --exclude "*" \
            --include "*.html" \
            --cache-control "no-cache"

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ env.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

### Required GitHub Secrets

Add these secrets to your repository:

- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `CLOUDFRONT_DISTRIBUTION_ID`: CloudFront distribution ID
- `API_BASE_URL`: Backend API URL

## Deployment Verification

### 1. Check S3 Upload

```bash
# List bucket contents
aws s3 ls s3://your-app-frontend --recursive

# Verify file count matches build output
```

### 2. Test CloudFront URL

```bash
# Get CloudFront domain
DOMAIN=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='JSC Frontend Distribution'].DomainName" \
  --output text)

echo "CloudFront URL: https://$DOMAIN"

# Test with curl
curl -I https://$DOMAIN
```

### 3. Verify SPA Routing

```bash
# Test non-existent route (should return index.html)
curl -I https://$DOMAIN/non-existent-page

# Should return 200 and serve index.html
```

### 4. Test Security Headers

```bash
# Check security headers
curl -I https://$DOMAIN | grep -i "x-"
```

### 5. Manual Browser Testing

1. Open CloudFront URL in browser
2. Test login functionality
3. Navigate to dashboard
4. Test page refresh (should not 404)
5. Test theme toggle
6. Verify API connectivity

## Troubleshooting

### Issue: 404 Errors on Page Refresh

**Cause**: CloudFront not configured for SPA routing

**Solution**: Configure custom error responses:

```bash
# Update distribution to return index.html for 404
aws cloudfront update-distribution --id DIST_ID --distribution-config '{
  "CustomErrorResponses": [{
    "ErrorCode": 404,
    "ResponsePagePath": "/index.html",
    "ResponseCode": 200
  }]
}'
```

### Issue: Old Content After Deployment

**Cause**: CloudFront cache not invalidated

**Solution**: Create invalidation

```bash
aws cloudfront create-invalidation \
  --distribution-id DIST_ID \
  --paths "/*"
```

### Issue: API Calls Failing (CORS)

**Cause**: Backend CORS not configured correctly

**Solution**: Update backend CORS settings:

```python
# FastAPI backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-cloudfront-domain.cloudfront.net"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Broken Assets/404s for CSS/JS

**Cause**: Incorrect base path or asset paths

**Solution**: Verify `next.config.mjs`:

```javascript
const nextConfig = {
  output: "export",
  // basePath: "/your-base-path", // Only if deploying to subdirectory
  images: {
    unoptimized: true,
  },
};
```

### Issue: Authentication Not Working

**Cause**: Cookies not being sent to API

**Solution**:

1. Ensure API is on same domain or properly configured for CORS
2. Check `credentials: "include"` in API client
3. Verify backend sets cookies with correct domain and SameSite settings

### Issue: Build Fails

**Cause**: Various reasons

**Troubleshooting**:

```bash
# Clear cache and rebuild
rm -rf .next out node_modules
pnpm install
pnpm build

# Check for TypeScript errors
pnpm typecheck

# Verify environment variables
cat .env.local
```

## Best Practices

### 1. Cache Management

- Use long cache times for immutable assets (JS, CSS, images)
- Use no-cache for HTML files
- Always invalidate CloudFront after deployment

### 2. Security

- Use HTTPS only (redirect HTTP to HTTPS)
- Implement security headers via CloudFront Functions
- Use WAF for DDoS protection (if needed)
- Restrict S3 bucket access using OAI

### 3. Performance

- Enable Gzip/Brotli compression in CloudFront
- Use HTTP/2 and HTTP/3
- Configure proper cache behaviors
- Minimize bundle size

### 4. Monitoring

- Enable CloudFront access logs
- Set up CloudWatch alarms
- Monitor invalidation costs
- Track cache hit ratio

### 5. Cost Optimization

- Use S3 Intelligent-Tiering for older versions
- Limit invalidation patterns (use `/path/*` instead of `/*`)
- Review data transfer costs
- Consider reserved pricing for CloudFront

## Alternative Deployment Options

### 1. AWS Amplify Hosting

- Fully managed deployment
- Built-in CI/CD
- Supports SSR (if needed in future)
- Simple setup: `amplify init && amplify publish`

### 2. Vercel

- Official Next.js platform
- Zero-config deployment
- Excellent developer experience
- Free tier available

### 3. Netlify

- Simple static hosting
- Built-in CI/CD
- Form handling and serverless functions
- Free tier available

### 4. CDN + Object Storage

- Other providers: Cloudflare, Fastly, Azure CDN
- Similar concept: build → upload → serve
- Choose based on your requirements

## Additional Resources

- [Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [CloudFront Developer Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/)

## Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review AWS CloudWatch logs
3. Check browser console for errors
4. Contact the development team
5. Open a GitHub issue

---

**Happy Deploying! 🚀**
