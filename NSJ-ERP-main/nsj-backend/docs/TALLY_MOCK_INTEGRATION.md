# Tally Mock Server Integration

This document describes the Tally Mock Server implementation for testing the Receipt Voucher balance fetching functionality.

## Overview

The Tally Mock Server is a lightweight Flask application that emulates Tally's API endpoints. It allows the Receipt Voucher form to fetch customer account balances without requiring an actual Tally connection.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Frontend       │         │  Tally Mock      │         │  Django     │
│  Receipt Form   │────────▶│  Server          │         │  Backend    │
│  (Next.js)      │  Fetch  │  (Flask)         │         │             │
└─────────────────┘ Balance └──────────────────┘         └─────────────┘
                                                                 │
                                                                 ▼
                                                          ┌─────────────┐
                                                          │  Database   │
                                                          └─────────────┘
```

## Files Created

1. **tally_mock_server.py** - Main Flask server with API endpoints
2. **tally_mock_requirements.txt** - Python dependencies
3. **start_tally_mock.bat** - Windows batch script to start the server
4. **test_tally_integration.py** - Comprehensive test suite
5. **TALLY_MOCK_INTEGRATION.md** - This documentation

## Setup Instructions

### 1. Install Dependencies

```bash
cd nsj-backend
pip install -r tally_mock_requirements.txt
```

Or install individually:
```bash
pip install Flask==3.0.0 flask-cors==4.0.0
```

### 2. Start the Mock Server

**Windows:**
```bash
start_tally_mock.bat
```

**Linux/Mac:**
```bash
python tally_mock_server.py
```

The server will start on `http://localhost:5001`

### 3. Configure Frontend

Add to your `.env.local` file:
```env
NEXT_PUBLIC_TALLY_MOCK_URL=http://localhost:5001
```

### 4. Run Tests

```bash
python test_tally_integration.py
```

## API Endpoints

### 1. Health Check
```
GET /api/health
```
Returns server status and timestamp.

**Response:**
```json
{
  "status": "ok",
  "service": "Tally Mock Server",
  "timestamp": "2025-12-10T10:30:00"
}
```

### 2. Get All Accounts
```
GET /api/accounts
```
Returns list of all accounts with balances.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "CUST001",
      "name": "ABC Jewellers",
      "balance": 125000.50,
      "balance_type": "Dr"
    }
  ],
  "count": 5
}
```

### 3. Get Account Balance (Main Endpoint)
```
GET /api/accounts/<account_id>/balance
```
Fetches balance for a specific account. This is the primary endpoint used by the Receipt Voucher form.

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

### 4. Search Accounts
```
GET /api/accounts/search?q=<query>
```
Search accounts by name.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "CUST002",
      "name": "XYZ Gold Traders",
      "balance": 75000.00,
      "balance_type": "Cr"
    }
  ],
  "count": 1
}
```

### 5. Create Receipt
```
POST /api/receipts
```
Simulates creating a receipt in Tally.

**Request Body:**
```json
{
  "account_id": "CUST001",
  "amount": 50000.00,
  "type": "Cr",
  "date": "2025-12-10",
  "narration": "Payment received"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Receipt created successfully",
  "data": {
    "receipt_id": "RCP12345",
    "account_id": "CUST001",
    "amount": 50000.00,
    "type": "Cr",
    "date": "2025-12-10",
    "narration": "Payment received",
    "created_at": "2025-12-10T10:30:00"
  }
}
```

### 6. Get Account Transactions
```
GET /api/accounts/<account_id>/transactions
```
Returns recent transactions for an account.

## Mock Data

The server includes 5 pre-configured accounts:

| Account ID | Account Name | Balance | Type |
|------------|--------------|---------|------|
| CUST001 | ABC Jewellers | ₹125,000.50 | Dr |
| CUST002 | XYZ Gold Traders | ₹75,000.00 | Cr |
| CUST003 | Diamond Palace | ₹250,000.75 | Dr |
| CUST004 | Golden Ornaments Ltd | ₹0.00 | Dr |
| CUST005 | Silver Shine Exports | ₹180,000.25 | Cr |

**Balance Types:**
- **Dr (Debit)**: Customer owes us money
- **Cr (Credit)**: We owe the customer money

## Frontend Integration

The Receipt Voucher form (`ReceiptForm.tsx`) has been updated to:

1. **Auto-fetch balance** when a party is selected
2. **Display balance type** with color coding (Red for Dr, Green for Cr)
3. **Show loading state** while fetching from Tally
4. **Handle errors gracefully** with fallback to manual entry
5. **Display helpful messages** about balance status

### User Experience Flow

1. User opens Receipt Voucher form
2. User selects a party from dropdown
3. Form automatically fetches balance from Tally Mock Server
4. Balance is displayed with type indicator (Dr/Cr)
5. User can proceed to enter Dr/Cr amounts
6. Form submits to Django backend with all data

## Testing the Integration

### Manual Testing

1. Start the Tally Mock Server:
   ```bash
   python tally_mock_server.py
   ```

2. Start the Django backend:
   ```bash
   cd nsj-backend/nsj-backend
   python manage.py runserver
   ```

3. Start the Next.js frontend:
   ```bash
   cd nsj-frontend/nsj-frontend
   npm run dev
   ```

4. Navigate to the Receipt Voucher form
5. Select a party and observe the balance being fetched

### Automated Testing

Run the test suite:
```bash
python test_tally_integration.py
```

This will test:
- ✅ Health check endpoint
- ✅ Get all accounts
- ✅ Get specific account balance
- ✅ Search accounts
- ✅ Create receipt
- ✅ Get transactions
- ✅ Complete Receipt Voucher workflow

## Extending the Mock Server

### Adding New Accounts

Edit `tally_mock_server.py` and add to `MOCK_ACCOUNTS`:

```python
"CUST006": {
    "account_id": "CUST006",
    "account_name": "New Customer",
    "balance": 100000.00,
    "balance_type": "Dr",
    "last_updated": "2025-12-10"
}
```

### Adding New Endpoints

Add new Flask routes in `tally_mock_server.py`:

```python
@app.route('/api/your-endpoint', methods=['GET'])
def your_endpoint():
    return jsonify({
        "success": True,
        "data": {}
    })
```

## Connecting to Real Tally

When ready to connect to actual Tally:

1. Replace `NEXT_PUBLIC_TALLY_MOCK_URL` with real Tally API URL
2. Update authentication headers if required
3. Adjust response parsing based on actual Tally API format
4. Keep the mock server for development/testing

## Troubleshooting

### Server won't start
- Check if port 5001 is already in use
- Verify Flask and flask-cors are installed
- Check Python version (3.8+ recommended)

### Balance not fetching
- Verify mock server is running on port 5001
- Check browser console for CORS errors
- Ensure `.env.local` has correct URL
- Verify account ID exists in mock data

### Tests failing
- Ensure mock server is running before running tests
- Check network connectivity to localhost:5001
- Review test output for specific error messages

## Security Notes

⚠️ **Important**: This is a mock server for development/testing only!

- Do not use in production
- No authentication implemented
- No data persistence
- CORS is wide open for testing

For production:
- Implement proper authentication
- Use HTTPS
- Add rate limiting
- Validate all inputs
- Use real Tally API with proper security

## Future Enhancements

Potential improvements:
- [ ] Add webhook support for real-time updates
- [ ] Implement data persistence (SQLite)
- [ ] Add authentication/API keys
- [ ] Support for multiple companies
- [ ] Transaction history with pagination
- [ ] Export functionality
- [ ] WebSocket support for live updates

## Support

For issues or questions:
1. Check this documentation
2. Review test output
3. Check server logs
4. Verify configuration

---

**Last Updated**: December 10, 2025
**Version**: 1.0.0
