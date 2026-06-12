# Backend Integration Guide

The frontend communicates with the NSJ Django backend (`http://localhost:8000`) using cookie-based sessions and CSRF protection. This guide summarises the application → backend contract, required headers, and the feature modules currently wired up.

- [Authentication & Session Flow](#authentication--session-flow)
- [Global Fetch Utilities](#global-fetch-utilities)
- [Accounts Module](#accounts-module)
  - [Masters](#masters)
  - [List & Filters](#list--filters)
  - [Create & Update](#create--update)
  - [Delete](#delete)
- [Legacy Invoice Upload](#legacy-invoice-upload)
- [Local Development Checklist](#local-development-checklist)

## Authentication & Session Flow

The backend uses Django sessions (`sessionid`) plus a `csrftoken`. The frontend handles the handshake automatically:

1. **CSRF bootstrap** – `lib/api.ts` calls `GET /api/auth/csrf` the first time a mutating request (POST, PATCH, DELETE) is issued. The response seeds the `csrftoken` cookie.
2. **Login** – `POST /api/auth/login` (email/username + password) returns the authenticated user and sets `sessionid`.
3. **Authenticated requests** – All `apiFetch` calls send `credentials: "include"`, so cookies travel with every request.
4. **Auto refresh** – On 401 responses the client triggers `POST /api/auth/refresh`, then retries the original request with refreshed cookies.
5. **Logout** – `POST /api/auth/logout` clears the server session; the client wipes any cached access token.

> Tip: When testing across different ports make sure your browser allows local cookies. Safari in particular blocks them unless “Prevent cross-site tracking” is disabled for `localhost`.

## Global Fetch Utilities

- `lib/constants.ts` defines `API_BASE_URL` (default `http://localhost:8000/api`) and all endpoint paths in `API_ENDPOINTS`.
- `lib/api.ts` wraps `fetch` with JSON serialization, CSRF header injection, retry-on-401, and a typed `ApiError` surface.
- `lib/backend.ts` re-exports feature-specific helpers such as `accountsList`, `accountCreate`, `accountsMasters`, etc. Prefer using these helpers inside UI code rather than calling `apiFetch` directly.

## Accounts Module

The Accounts workspace (pages under `/app/accounts`) consumes the endpoints described in `docs/api_accounts.md`.

### Masters

- **Endpoint:** `GET /api/accounts/masters/`
- **Usage:** `accountsMasters()` loads branches, locations, states, cities, and countries before rendering the creation form. The data is cached per page load.
- **Filtering:** When a state is selected the frontend filters the `cities` array on the client. If server-side narrowing is preferred pass `state`, `state_id`, or `stateId` to the helper.

### List & Filters

- **Endpoint:** `GET /api/accounts/`
- **Helper:** `accountsList(params?: AccountsQueryParams)` where params can include `page`, `page_size`, `search`, `group`, and `status`.
- **UI:** `components/accounts/AccountsList.tsx` manages search debounce, filter dropdowns, and pagination. Responses are normalised to show counts and results, matching the backend’s paginated payload shape.
- **Error handling:** Any failure surfaces a destructive toast and replaces the table body with an inline error block.

### Create & Update

- **Create endpoint:** `POST /api/accounts/`
- **Update endpoint:** `PATCH /api/accounts/<id>/`
- **Helper:** `accountCreate(payload)` / `accountUpdate(id, payload)`
- **Payload shaping:** `AccountForm` strips empty strings before submission so the backend only receives populated fields. Nested structures (`contact`, `bank`, `tax`, `opening_balance`) are compacted to avoid null spam.
- **Validation:** Zod ensures required fields (account number, name, group) are set before the request fires. Backend errors reach the user via toast notifications.

### Delete

- **Endpoint:** `DELETE /api/accounts/<id>/`
- **Helper:** `accountDelete(id)`
- **UI:** The list table displays a “Delete” ghost button per row. Confirmations use `window.confirm` for now; swap in a shadcn dialog when design resources are available.
- **Post-delete refresh:** After a successful delete the table refetches the current page and shows a success toast.

## Legacy Invoice Upload

The invoice upload modal on the dashboard still targets the existing FastAPI-compatible route:

- **Endpoint:** `POST /invoices/upload`
- **Helper:** `uploadInvoices(file)`
- **Notes:** The backend must accept multipart uploads (field name `file`). Responses should match `{ imported: number, skipped: number }`.

If the backend transitions to Django, update the endpoint in `lib/constants.ts` and adjust any auth requirements accordingly.

## Local Development Checklist

1. Start the backend (`python manage.py runserver 8000` or equivalent) and confirm `/api/auth/csrf` is reachable.
2. Launch the frontend (`pnpm dev`) and log in through `/login`.
3. Visit `/accounts`, `/accounts/list`, and `/accounts/new` to verify data flows end-to-end.
4. If requests fail with 403 CSRF errors, check that the backend sets the `csrftoken` cookie with `SameSite=Lax` (or `None` when using HTTPS) and that the frontend domain matches the allowed origin list.
5. Keep MSW handlers in `tests/mocks/server.ts` aligned with backend payloads to maintain green test suites.
