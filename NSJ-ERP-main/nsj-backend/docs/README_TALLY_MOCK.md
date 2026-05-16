# 🎯 Tally Mock Server - Complete Guide

> A lightweight Flask-based mock server that emulates Tally's API for testing Receipt Voucher balance fetching functionality.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🎯 Overview

This implementation provides a complete mock server solution for testing the Receipt Voucher form's automatic balance fetching feature. Instead of connecting to a real Tally server during development, this mock server provides realistic responses for testing and development.

### What Problem Does This Solve?

- ✅ **No Tally Required**: Test without actual Tally installation
- ✅ **Fast Development**: Instant responses, no network delays
- ✅ **Predictable Data**: Consistent test data every time
- ✅ **Easy Debugging**: Full control over responses
- ✅ **Offline Work**: No internet connection needed

### What's Included?

- 🚀 Flask-based mock server (6 endpoints)
- 🧪 Comprehensive test suite (7 automated tests)
- 🎬 Interactive demo script
- 📚 Complete documentation (4 guides)
- ✅ Testing checklist (100+ test cases)
- 🎨 Frontend integration (auto-fetch balance)

## ⚡ Quick Start

Get up and running in 5 minutes!

### 1. Install Dependencies

```bash
cd nsj-backend
pip install -r tally_mock_requirements.txt
```

### 2. Start Mock Server

```bash
python tally_mock_server.py
```

You should see:
```
============================================================
🚀 Tally Mock Server Starting...
============================================================
Server running on: http://localhost:5001
============================================================
```

### 3. Test It

```bash
# In a new terminal
python test_tally_integration.py
```

Expected output: `✅ 7/7 tests passed`

### 4. Use It

1. Start Django backend: `python manage.py runserver`
2. Start Next.js frontend: `npm run dev`
3. Open Receipt Voucher form
4. Select a party
5. Watch balance auto-populate! 🎉

## ✨ Features

### Mock Server Features

| Feature | Description |
|---------|-------------|
| 🌐 RESTful API | 6 fully functional endpoints |
| 📊 Mock Data | 5 pre-configured test accounts |
| 🔄 CORS Support | Works with frontend on different port |
| ⚡ Fast Response | < 100ms response times |
| 🛡️ Error Handling | Graceful error responses |
| 📝 JSON Format | Standard JSON responses |
| 💚 Health Check | Monitor server status |

### Frontend Features

| Feature | Description |
|---------|-------------|
| 🔄 Auto-Fetch | Balance fetches on party selection |
| ⏳ Loading States | Visual feedback during fetch |
| 🎨 Color Coding | Red (Dr) / Green (Cr) indicators |
| 💬 Helpful Messages | "Customer owes" / "We owe customer" |
| 🛡️ Error Handling | Fallback to manual entry |
| 🔔 Notifications | Toast messages for feedback |
| ♿ Accessibility | Disabled states, ARIA labels |

### Testing Features

| Feature | Description |
|---------|-------------|
| 🧪 Automated Tests | 7 comprehensive tests |
| 🎬 Interactive Demo | Step-by-step workflow |
| ✅ Checklist | 100+ test cases |
| 📊 Coverage | Unit, integration, E2E |
| 🐛 Debugging | Detailed error messages |

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Frontend   │────────▶│  Tally Mock  │         │   Django    │
│  (Next.js)  │  Fetch  │  (Flask)     │         │  Backend    │
│  Port 3000  │ Balance │  Port 5001   │         │  Port 8000  │
└─────────────┘         └──────────────┘         └──────┬──────┘
                                                         │
                                                         ▼
                                                  ┌─────────────┐
                                                  │  Database   │
                                                  └─────────────┘
```

[See detailed architecture →](ARCHITECTURE_DIAGRAM.md)

## 📦 Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Node.js 18+ (for frontend)
- Django backend setup

### Step-by-Step Installation

1. **Clone or navigate to the project:**
   ```bash
   cd nsj-backend
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r tally_mock_requirements.txt
   ```

   Or install individually:
   ```bash
   pip install Flask==3.0.0 flask-cors==4.0.0 requests==2.31.0
   ```

3. **Configure frontend:**
   
   Add to `nsj-frontend/nsj-frontend/.env.local`:
   ```env
   NEXT_PUBLIC_TALLY_MOCK_URL=http://localhost:5001
   ```

4. **Verify installation:**
   ```bash
   python tally_mock_server.py
   ```

   Should start without errors.

## 🚀 Usage

### Starting the Server

**Windows:**
```bash
start_tally_mock.bat
```

**Linux/Mac:**
```bash
python tally_mock_server.py
```

**Custom Port:**
```bash
# Edit tally_mock_server.py, line ~200:
app.run(host='0.0.0.0', port=5002, debug=True)
```

### Using in Frontend

The Receipt Voucher form automatically uses the mock server:

1. User opens form
2. Selects a party from dropdown
3. Balance auto-fetches from mock server
4. Balance displays with color coding
5. User enters Dr/Cr amounts
6. Form submits to Django backend

### Testing with cURL

```bash
# Health check
curl http://localhost:5001/api/health

# Get all accounts
curl http://localhost:5001/api/accounts

# Get specific balance
curl http://localhost:5001/api/accounts/CUST001/balance

# Search accounts
curl "http://localhost:5001/api/accounts/search?q=gold"

# Create receipt
curl -X POST http://localhost:5001/api/receipts \
  -H "Content-Type: application/json" \
  -d '{"account_id":"CUST001","amount":50000,"type":"Cr","date":"2025-12-10","narration":"Payment"}'
```

## 📚 API Reference

### Base URL
```
http://localhost:5001
```

### Endpoints

#### 1. Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "Tally Mock Server",
  "timestamp": "2025-12-10T10:30:00"
}
```

#### 2. Get All Accounts
```http
GET /api/accounts
```

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

#### 3. Get Account Balance ⭐ (Main Endpoint)
```http
GET /api/accounts/{account_id}/balance
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

#### 4. Search Accounts
```http
GET /api/accounts/search?q={query}
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 2
}
```

#### 5. Create Receipt
```http
POST /api/receipts
Content-Type: application/json

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
    "created_at": "2025-12-10T10:30:00"
  }
}
```

#### 6. Get Account Transactions
```http
GET /api/accounts/{account_id}/transactions
```

**Response:**
```json
{
  "success": true,
  "data": {
    "account_id": "CUST001",
    "account_name": "ABC Jewellers",
    "transactions": [...]
  }
}
```

### Test Accounts

| Account ID | Name | Balance | Type | Description |
|------------|------|---------|------|-------------|
| CUST001 | ABC Jewellers | ₹125,000.50 | Dr | Customer owes us |
| CUST002 | XYZ Gold Traders | ₹75,000.00 | Cr | We owe customer |
| CUST003 | Diamond Palace | ₹250,000.75 | Dr | Large debit balance |
| CUST004 | Golden Ornaments Ltd | ₹0.00 | Dr | Zero balance |
| CUST005 | Silver Shine Exports | ₹180,000.25 | Cr | Large credit balance |

## 🧪 Testing

### Automated Tests

Run the complete test suite:

```bash
python test_tally_integration.py
```

**Tests included:**
1. ✅ Health check endpoint
2. ✅ Get all accounts
3. ✅ Get account balance
4. ✅ Search accounts
5. ✅ Create receipt
6. ✅ Get transactions
7. ✅ Complete Receipt Voucher workflow

### Interactive Demo

Run the step-by-step demonstration:

```bash
python demo_tally_workflow.py
```

This walks through the entire workflow with explanations.

### Manual Testing

Use the comprehensive checklist:

```bash
# Open in your editor
code TESTING_CHECKLIST.md
```

100+ test cases covering:
- Server functionality
- Frontend integration
- Form submission
- Error handling
- Edge cases
- Performance
- Security

### Browser Testing

1. Start all servers
2. Open browser DevTools (F12)
3. Navigate to Receipt Voucher form
4. Monitor Network tab for API calls
5. Check Console for errors
6. Test different accounts

## 📖 Documentation

### Available Guides

| Document | Purpose | Time to Read |
|----------|---------|--------------|
| [QUICK_START_TALLY_MOCK.md](QUICK_START_TALLY_MOCK.md) | Get started in 5 minutes | 5 min |
| [TALLY_MOCK_INTEGRATION.md](TALLY_MOCK_INTEGRATION.md) | Complete technical docs | 20 min |
| [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) | System architecture | 10 min |
| [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) | Testing guide | 15 min |
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) | Project overview | 10 min |

### Quick Links

- 🚀 [Quick Start Guide](QUICK_START_TALLY_MOCK.md) - Get running fast
- 📚 [Full Documentation](TALLY_MOCK_INTEGRATION.md) - Everything you need
- 🏗️ [Architecture](ARCHITECTURE_DIAGRAM.md) - How it works
- ✅ [Testing Checklist](TESTING_CHECKLIST.md) - Verify everything works
- 📊 [Implementation Summary](IMPLEMENTATION_SUMMARY.md) - What was built

## 🔧 Troubleshooting

### Common Issues

#### Server Won't Start

**Problem:** Port 5001 already in use

**Solution:**
```bash
# Check what's using the port
netstat -ano | findstr :5001

# Kill the process or use different port
# Edit tally_mock_server.py, change port number
```

#### Balance Not Fetching

**Problem:** Frontend can't connect to mock server

**Solutions:**
1. Verify mock server is running
2. Check `.env.local` has correct URL
3. Restart Next.js dev server
4. Check browser console for CORS errors
5. Verify no firewall blocking port 5001

#### Tests Failing

**Problem:** Test suite shows failures

**Solutions:**
1. Ensure mock server is running first
2. Check Python version (3.8+)
3. Verify all dependencies installed
4. Review test output for specific errors
5. Check network connectivity to localhost

#### CORS Errors

**Problem:** Browser shows CORS policy errors

**Solutions:**
1. Verify flask-cors is installed
2. Check CORS is enabled in server code
3. Restart mock server
4. Clear browser cache
5. Check browser console for details

### Debug Mode

Enable detailed logging:

```python
# In tally_mock_server.py
app.run(host='0.0.0.0', port=5001, debug=True)
```

### Getting Help

1. Check [Troubleshooting Guide](TALLY_MOCK_INTEGRATION.md#troubleshooting)
2. Review [Testing Checklist](TESTING_CHECKLIST.md)
3. Run automated tests for diagnostics
4. Check server logs for errors
5. Review browser console

## 🔄 Migration to Real Tally

When ready to connect to actual Tally:

### 1. Update Environment Variable

```env
# .env.local
NEXT_PUBLIC_TALLY_MOCK_URL=https://your-tally-api.com
```

### 2. Add Authentication

```typescript
// In ReceiptForm.tsx
const response = await fetch(`${TALLY_URL}/api/accounts/${accountId}/balance`, {
  headers: {
    'Authorization': `Bearer ${tallyApiKey}`,
    'Content-Type': 'application/json'
  }
});
```

### 3. Adjust Response Parsing

Map Tally's actual response format to your expected format.

### 4. Keep Mock Server

Continue using for:
- Development
- Testing
- Demos
- Offline work

## 📊 Project Statistics

- **Lines of Code**: 2,000+
- **Files Created**: 12
- **API Endpoints**: 6
- **Test Cases**: 100+
- **Documentation Pages**: 5
- **Test Accounts**: 5
- **Setup Time**: < 5 minutes
- **Test Coverage**: Comprehensive

## 🤝 Contributing

### Adding New Accounts

Edit `tally_mock_server.py`:

```python
MOCK_ACCOUNTS = {
    "CUST006": {
        "account_id": "CUST006",
        "account_name": "New Customer",
        "balance": 100000.00,
        "balance_type": "Dr",
        "last_updated": "2025-12-10"
    }
}
```

### Adding New Endpoints

```python
@app.route('/api/your-endpoint', methods=['GET'])
def your_endpoint():
    return jsonify({
        "success": True,
        "data": {}
    })
```

### Improving Documentation

1. Update relevant .md files
2. Keep examples current
3. Add troubleshooting tips
4. Include screenshots if helpful

## 📝 License

This is part of the NSJ project. See main project license.

## 🙏 Acknowledgments

- Flask framework for the mock server
- React/Next.js for the frontend
- Django for the backend
- All contributors and testers

## 📞 Support

- 📖 Read the documentation
- 🧪 Run the tests
- 🎬 Try the demo
- ✅ Use the checklist
- 🐛 Check troubleshooting guide

---

**Version**: 1.0.0  
**Last Updated**: December 10, 2025  
**Status**: ✅ Production Ready

**Made with ❤️ for testing Receipt Voucher functionality**
