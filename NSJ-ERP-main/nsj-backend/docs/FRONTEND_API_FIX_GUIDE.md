# Frontend API URL Issue - Diagnostic & Fix Guide

## ❌ Problem

Frontend is sending requests to: `POST /api/api/payments/queries/` (double `/api/` prefix)
Backend server logs show: `Not Found: /api/api/payments/queries/`

## ✅ Correct Endpoint

Per specification: `POST /api/payments/queries/`

## 🔍 Root Cause Analysis

The double `/api/` prefix indicates one of these frontend issues:

### Scenario 1: API Base URL Configuration
Your frontend likely has:
```javascript
// ❌ WRONG - API_BASE_URL already includes /api/
const API_BASE_URL = "http://localhost:8000/api/";

// Then constructing URLs like:
fetch(`${API_BASE_URL}/api/payments/queries/`) // Results in /api/api/payments/queries/
```

### Scenario 2: Hardcoded Path with Base URL
```javascript
// ❌ WRONG
const createQuery = async (data) => {
  const response = await fetch(`${API_BASE_URL}api/payments/queries/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
// API_BASE_URL = "http://localhost:8000/api/" → Results in /api/api/payments/queries/
```

### Scenario 3: API Client Configuration
```javascript
// ❌ WRONG - Axios or Fetch library with double prefix
const apiClient = axios.create({
  baseURL: "http://localhost:8000/api/",
});

// Then calling with:
apiClient.post("/api/payments/queries/", data) // Double prefix!
```

## ✅ Solution

### For Scenario 1 & 2: Fix Your API Configuration
```javascript
// ✅ CORRECT - API_BASE_URL is the root only
const API_BASE_URL = "http://localhost:8000";

// Construct full URL correctly:
fetch(`${API_BASE_URL}/api/payments/queries/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRFToken': csrfToken,
  },
  body: JSON.stringify(data),
})
```

### For Scenario 3: Fix Axios/HTTP Client
```javascript
// ✅ CORRECT - baseURL should be the root
const apiClient = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true, // Important for session-based auth
});

// Then call with correct path:
apiClient.post("/api/payments/queries/", data)
// Result: http://localhost:8000/api/payments/queries/ ✅
```

## 📋 Checklist: How to Fix

1. **Find your frontend's API configuration file** (likely `api.js`, `config.js`, `.env`, etc.)

2. **Search for these patterns:**
   - `API_BASE_URL`
   - `baseURL`
   - `fetch("http://localhost`
   - `axios.create`

3. **Look for the double `/api/` pattern in:**
   - URL concatenation: `${baseURL}api/payments/queries/`
   - Endpoint constants that include `/api/`
   - Fetch/Axios interceptors

4. **Fix by ensuring:**
   - Base URL = `http://localhost:8000` (or just `/` for relative URLs)
   - Endpoint paths include the full path: `/api/payments/queries/`
   - NO double `/api/` in the final URL

## 🧪 Test Your Fix

After fixing the frontend code, test with:

```bash
# Should return 201 Created
curl -X POST http://localhost:8000/api/payments/queries/ \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionid=<your-session-id>" \
  -d '{
    "account": "uuid",
    "item_name": "uuid",
    "gold_carat": "22K",
    "gender": "Woman",
    "size": "6 inches",
    "query_in_date": "2025-12-08",
    "expiry_date": "2025-12-15"
  }'

# Should return 200 OK with list of queries
curl http://localhost:8000/api/payments/queries/ \
  -H "Cookie: sessionid=<your-session-id>"
```

## Backend Verification ✅

The backend is correctly configured:
- ✅ Endpoint: `/api/payments/queries/` (verified in Django URLs)
- ✅ ViewSet: `QueryViewSet` handles POST and GET
- ✅ Django system check: 0 issues
- ✅ Database: Migrations applied

**The problem is 100% on the frontend side.**

---

## Common Frontend Framework Examples

### React with Fetch
```javascript
// ✅ CORRECT
const API_BASE = 'http://localhost:8000';

async function createQuery(queryData) {
  const response = await fetch(`${API_BASE}/api/payments/queries/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value,
    },
    credentials: 'include',
    body: JSON.stringify(queryData),
  });
  return response.json();
}

async function listQueries() {
  const response = await fetch(`${API_BASE}/api/payments/queries/`, {
    credentials: 'include',
  });
  return response.json();
}
```

### Vue with Axios
```javascript
// ✅ CORRECT
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
});

export const queryAPI = {
  create(data) {
    return apiClient.post('/api/payments/queries/', data);
  },
  list(params = {}) {
    return apiClient.get('/api/payments/queries/', { params });
  },
};
```

### Angular with HttpClient
```typescript
// ✅ CORRECT
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class QueryService {
  private apiBase = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  createQuery(data: any) {
    return this.http.post(`${this.apiBase}/api/payments/queries/`, data);
  }

  listQueries(params?: any) {
    return this.http.get(`${this.apiBase}/api/payments/queries/`, { params });
  }
}
```

---

## Need Help?

1. Share your frontend API configuration file
2. Look for where the `/api/` prefix is being added
3. Remove the duplicate prefix
4. Test with curl command above to confirm

Once fixed, your frontend should connect successfully to the backend endpoints!
