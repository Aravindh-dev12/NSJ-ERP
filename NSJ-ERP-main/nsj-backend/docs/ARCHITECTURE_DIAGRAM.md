# Tally Mock Server - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                              │
│                    (Browser - Port 3000)                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │
                    ┌─────────────▼─────────────┐
                    │   Receipt Voucher Form    │
                    │   (ReceiptForm.tsx)       │
                    │                           │
                    │  ┌─────────────────────┐  │
                    │  │ Date: 2025-12-10    │  │
                    │  │ Type: Cr            │  │
                    │  │ Party: [Dropdown]   │  │
                    │  │ Balance: [Auto]     │  │
                    │  │ Dr: 0.00            │  │
                    │  │ Cr: 25000.00        │  │
                    │  │ Narration: ...      │  │
                    │  └─────────────────────┘  │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
    ┌───────────────────────────┐   ┌───────────────────────────┐
    │   Tally Mock Server       │   │   Django Backend          │
    │   (Flask - Port 5001)     │   │   (Port 8000)             │
    │                           │   │                           │
    │  GET /api/accounts        │   │  POST /api/receipts/      │
    │  GET /api/accounts/{id}/  │   │  GET /api/receipts/       │
    │      balance              │   │  GET /api/accounts/       │
    │  POST /api/receipts       │   │                           │
    └───────────────────────────┘   └───────────┬───────────────┘
                                                 │
                                                 ▼
                                    ┌───────────────────────────┐
                                    │   PostgreSQL Database     │
                                    │                           │
                                    │  - receipts table         │
                                    │  - accounts table         │
                                    │  - users table            │
                                    └───────────────────────────┘
```

## Data Flow Sequence

### 1. Form Load
```
User → Browser → Next.js Frontend
                      │
                      ├─→ Django Backend (GET /api/accounts/)
                      │   └─→ Returns: List of accounts for dropdown
                      │
                      └─→ Renders: Receipt Form with empty fields
```

### 2. Party Selection & Balance Fetch
```
User selects party → handlePartyChange()
                          │
                          ├─→ setFetchingBalance(true)
                          │   └─→ Shows: "Fetching balance from Tally..."
                          │
                          ├─→ Tally Mock Server
                          │   GET /api/accounts/CUST001/balance
                          │   │
                          │   └─→ Returns:
                          │       {
                          │         "success": true,
                          │         "data": {
                          │           "account_id": "CUST001",
                          │           "account_name": "ABC Jewellers",
                          │           "balance": 125000.50,
                          │           "balance_type": "Dr",
                          │           "last_updated": "2025-12-09",
                          │           "currency": "INR"
                          │         }
                          │       }
                          │
                          ├─→ setBalance(125000.50)
                          ├─→ setBalanceType("Dr")
                          ├─→ setFetchingBalance(false)
                          │
                          └─→ Shows:
                              - Balance: ₹125,000.50 (Dr)
                              - Red border
                              - "Customer owes: ₹125,000.50"
```

### 3. Form Submission
```
User clicks Save → handleSubmit()
                       │
                       ├─→ Validates form data
                       │
                       ├─→ Django Backend
                       │   POST /api/receipts/
                       │   {
                       │     "date": "2025-12-10",
                       │     "type": "Cr",
                       │     "party_name_id": "CUST001",
                       │     "balance": 125000.50,
                       │     "dr": 0.00,
                       │     "cr": 25000.00,
                       │     "narration": "Payment received"
                       │   }
                       │   │
                       │   ├─→ Validates data
                       │   ├─→ Creates Receipt record
                       │   ├─→ Saves to database
                       │   │
                       │   └─→ Returns:
                       │       {
                       │         "message": "Receipt created",
                       │         "result": { ... }
                       │       }
                       │
                       ├─→ Shows success toast
                       ├─→ Resets form
                       │
                       └─→ Optional: Sync to Tally
                           POST /api/receipts (Tally Mock)
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ReceiptForm.tsx                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  State Management:                                              │
│  ├─ date: string                                                │
│  ├─ type: "Cr" | "Dr"                                           │
│  ├─ partyId: string | null                                      │
│  ├─ balance: number | undefined                                 │
│  ├─ balanceType: string                                         │
│  ├─ dr: number | undefined                                      │
│  ├─ cr: number | undefined                                      │
│  ├─ narration: string                                           │
│  ├─ parties: Account[]                                          │
│  ├─ loading: boolean                                            │
│  ├─ fetchingBalance: boolean                                    │
│  └─ submitting: boolean                                         │
│                                                                 │
│  Functions:                                                     │
│  ├─ fetchBalanceFromTally(accountId)                            │
│  │   └─ Fetches balance from Tally Mock Server                 │
│  ├─ handlePartyChange(partyId)                                  │
│  │   └─ Triggers balance fetch                                 │
│  └─ handleSubmit(e)                                             │
│      └─ Submits receipt to Django backend                      │
│                                                                 │
│  UI Components:                                                 │
│  ├─ Date Input                                                  │
│  ├─ Type Select (Cr/Dr)                                         │
│  ├─ Party Select (with loading state)                           │
│  ├─ Balance Input (with color coding)                           │
│  ├─ Dr Input                                                    │
│  ├─ Cr Input                                                    │
│  ├─ Narration Textarea                                          │
│  └─ Submit Button                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Mock Server Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  tally_mock_server.py                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Flask Application:                                             │
│  ├─ CORS enabled                                                │
│  ├─ JSON responses                                              │
│  └─ Error handling                                              │
│                                                                 │
│  Mock Data:                                                     │
│  └─ MOCK_ACCOUNTS = {                                           │
│      "CUST001": {                                               │
│        "account_id": "CUST001",                                 │
│        "account_name": "ABC Jewellers",                         │
│        "balance": 125000.50,                                    │
│        "balance_type": "Dr",                                    │
│        "last_updated": "2025-12-09"                             │
│      },                                                         │
│      ...                                                        │
│    }                                                            │
│                                                                 │
│  Endpoints:                                                     │
│  ├─ GET  /api/health                                            │
│  │   └─ Returns server status                                  │
│  ├─ GET  /api/accounts                                          │
│  │   └─ Returns all accounts                                   │
│  ├─ GET  /api/accounts/<id>/balance                             │
│  │   └─ Returns specific account balance                       │
│  ├─ GET  /api/accounts/search?q=<query>                         │
│  │   └─ Searches accounts by name                              │
│  ├─ POST /api/receipts                                          │
│  │   └─ Creates mock receipt                                   │
│  └─ GET  /api/accounts/<id>/transactions                        │
│      └─ Returns mock transactions                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                     Receipt Table                               │
├─────────────────────────────────────────────────────────────────┤
│  id                UUID (PK)                                    │
│  company_id        UUID (FK → companies)                        │
│  type              VARCHAR(2) ["Cr", "Dr"]                      │
│  party_name_id     UUID (FK → accounts)                         │
│  balance           DECIMAL(14,2)                                │
│  dr                DECIMAL(14,2)                                │
│  cr                DECIMAL(14,2)                                │
│  narration         TEXT                                         │
│  date              DATE                                         │
│  created_by_id     UUID (FK → users)                            │
│  updated_by_id     UUID (FK → users)                            │
│  created_at        TIMESTAMP                                    │
│  updated_at        TIMESTAMP                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Error Scenarios                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Tally Server Unavailable:                                   │
│     User selects party                                          │
│     → fetchBalanceFromTally()                                   │
│     → fetch() throws error                                      │
│     → catch block executes                                      │
│     → Shows toast: "Tally connection failed"                    │
│     → Balance field remains editable                            │
│     → User can enter balance manually                           │
│                                                                 │
│  2. Invalid Account ID:                                         │
│     User selects party                                          │
│     → fetchBalanceFromTally("INVALID")                          │
│     → Tally returns 404                                         │
│     → Shows toast: "Account not found"                          │
│     → Balance field cleared                                     │
│                                                                 │
│  3. Network Timeout:                                            │
│     User selects party                                          │
│     → fetchBalanceFromTally()                                   │
│     → Request times out                                         │
│     → Shows toast: "Request timed out"                          │
│     → Fallback to manual entry                                  │
│                                                                 │
│  4. Form Validation Error:                                      │
│     User submits incomplete form                                │
│     → handleSubmit()                                            │
│     → Django returns 400                                        │
│     → Shows toast: "Validation failed"                          │
│     → Highlights invalid fields                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## State Transitions

```
┌─────────────────────────────────────────────────────────────────┐
│                   Form State Machine                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INITIAL STATE:                                                 │
│  ├─ loading: true                                               │
│  ├─ fetchingBalance: false                                      │
│  ├─ submitting: false                                           │
│  └─ All fields empty                                            │
│                                                                 │
│  LOADING ACCOUNTS:                                              │
│  ├─ loading: true                                               │
│  └─ Fetching accounts from Django                              │
│                                                                 │
│  READY:                                                         │
│  ├─ loading: false                                              │
│  ├─ Accounts loaded                                             │
│  └─ Form ready for input                                        │
│                                                                 │
│  FETCHING BALANCE:                                              │
│  ├─ fetchingBalance: true                                       │
│  ├─ Party dropdown disabled                                     │
│  ├─ Balance field disabled                                      │
│  └─ Shows "Fetching..." message                                 │
│                                                                 │
│  BALANCE LOADED:                                                │
│  ├─ fetchingBalance: false                                      │
│  ├─ Balance field populated                                     │
│  ├─ Color coding applied                                        │
│  └─ Ready for Dr/Cr entry                                       │
│                                                                 │
│  SUBMITTING:                                                    │
│  ├─ submitting: true                                            │
│  ├─ All fields disabled                                         │
│  └─ Submit button shows "Saving..."                             │
│                                                                 │
│  SUCCESS:                                                       │
│  ├─ submitting: false                                           │
│  ├─ Shows success toast                                         │
│  ├─ Form resets to READY state                                 │
│  └─ All fields cleared                                          │
│                                                                 │
│  ERROR:                                                         │
│  ├─ submitting: false                                           │
│  ├─ Shows error toast                                           │
│  └─ Form remains in current state                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## API Request/Response Examples

### Get Account Balance

**Request:**
```http
GET /api/accounts/CUST001/balance HTTP/1.1
Host: localhost:5001
Accept: application/json
```

**Response:**
```json
{
  "success": true,
  "data": {
    "account_id": "CUST001",
    "account_name": "ABC Jewellers",
    "balance": 125000.50,
    "balance_type": "Dr",
    "last_updated": "2025-12-09",
    "currency": "INR"
  }
}
```

### Create Receipt

**Request:**
```http
POST /api/receipts/ HTTP/1.1
Host: localhost:8000
Content-Type: application/json
Authorization: Bearer <token>

{
  "date": "2025-12-10",
  "type": "Cr",
  "party_name_id": "uuid-here",
  "balance": 125000.50,
  "dr": 0.00,
  "cr": 25000.00,
  "narration": "Payment received for order #12345"
}
```

**Response:**
```json
{
  "message": "Receipt created",
  "result": {
    "id": "uuid-here",
    "date": "2025-12-10",
    "type": "Cr",
    "party_name": {
      "id": "uuid-here",
      "name": "ABC Jewellers"
    },
    "balance": 125000.50,
    "dr": 0.00,
    "cr": 25000.00,
    "narration": "Payment received for order #12345",
    "created_at": "2025-12-10T10:30:00Z"
  }
}
```

## Performance Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                   Performance Metrics                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Balance Fetch:                                                 │
│  ├─ Target: < 500ms                                             │
│  ├─ Typical: 50-100ms (mock server)                             │
│  └─ Timeout: 5000ms                                             │
│                                                                 │
│  Form Submission:                                               │
│  ├─ Target: < 1000ms                                            │
│  ├─ Typical: 200-500ms                                          │
│  └─ Includes: Validation + DB write                             │
│                                                                 │
│  Account Dropdown Load:                                         │
│  ├─ Target: < 1000ms                                            │
│  ├─ Typical: 100-300ms                                          │
│  └─ Cached after first load                                     │
│                                                                 │
│  UI Responsiveness:                                             │
│  ├─ No blocking operations                                      │
│  ├─ Loading states for all async ops                            │
│  └─ Optimistic UI updates                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Security Layers                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend:                                                      │
│  ├─ Input validation                                            │
│  ├─ XSS prevention (React escaping)                             │
│  ├─ CSRF token (Django)                                         │
│  └─ Environment variables for URLs                              │
│                                                                 │
│  Mock Server (Development Only):                                │
│  ├─ CORS enabled for localhost                                  │
│  ├─ No authentication (mock only)                               │
│  └─ Input validation                                            │
│                                                                 │
│  Django Backend:                                                │
│  ├─ Authentication required                                     │
│  ├─ Authorization checks                                        │
│  ├─ Input validation                                            │
│  ├─ SQL injection prevention (ORM)                              │
│  ├─ CSRF protection                                             │
│  └─ Rate limiting                                               │
│                                                                 │
│  Database:                                                      │
│  ├─ Encrypted connections                                       │
│  ├─ Parameterized queries                                       │
│  └─ Access controls                                             │
│                                                                 │
│  Production Tally API:                                          │
│  ├─ API key authentication                                      │
│  ├─ HTTPS only                                                  │
│  ├─ Rate limiting                                               │
│  └─ IP whitelisting                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

**Last Updated**: December 10, 2025  
**Version**: 1.0.0
