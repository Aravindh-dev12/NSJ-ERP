# Quick Start: Tally Mock Server

Get the Receipt Voucher balance fetching working in 5 minutes!

## Step 1: Install Dependencies (30 seconds)

```bash
cd nsj-backend
pip install Flask==3.0.0 flask-cors==4.0.0
```

## Step 2: Start Mock Server (10 seconds)

**Windows:**
```bash
start_tally_mock.bat
```

**Linux/Mac:**
```bash
python tally_mock_server.py
```

You should see:
```
============================================================
🚀 Tally Mock Server Starting...
============================================================

Available Endpoints:
  GET  /api/health                          - Health check
  GET  /api/accounts                        - List all accounts
  GET  /api/accounts/<id>/balance           - Get account balance
  ...

Server running on: http://localhost:5001
============================================================
```

## Step 3: Test the Server (30 seconds)

Open a new terminal and run:
```bash
python test_tally_integration.py
```

You should see all tests passing ✅

## Step 4: Configure Frontend (20 seconds)

Add to `nsj-frontend/nsj-frontend/.env.local`:
```env
NEXT_PUBLIC_TALLY_MOCK_URL=http://localhost:5001
```

## Step 5: Test in Browser (3 minutes)

1. Start Django backend:
   ```bash
   cd nsj-backend/nsj-backend
   python manage.py runserver
   ```

2. Start Next.js frontend:
   ```bash
   cd nsj-frontend/nsj-frontend
   npm run dev
   ```

3. Open browser and navigate to Receipt Voucher form

4. Select a party from dropdown

5. Watch the balance auto-populate! 🎉

## What You'll See

When you select a party:
- ⏳ "Fetching balance from Tally..." message appears
- ✅ Balance field populates automatically
- 🎨 Color coding: Red for Debit (customer owes), Green for Credit (we owe)
- 💬 Helpful message: "Customer owes: ₹125,000.50" or "We owe customer: ₹75,000.00"

## Available Test Accounts

Try these account IDs:
- **CUST001** - ABC Jewellers (₹125,000.50 Dr)
- **CUST002** - XYZ Gold Traders (₹75,000.00 Cr)
- **CUST003** - Diamond Palace (₹250,000.75 Dr)
- **CUST004** - Golden Ornaments Ltd (₹0.00 Dr)
- **CUST005** - Silver Shine Exports (₹180,000.25 Cr)

## Quick Test with cURL

```bash
# Test health
curl http://localhost:5001/api/health

# Get all accounts
curl http://localhost:5001/api/accounts

# Get specific balance
curl http://localhost:5001/api/accounts/CUST001/balance

# Search accounts
curl "http://localhost:5001/api/accounts/search?q=gold"
```

## Troubleshooting

**Server won't start?**
```bash
# Check if port is in use
netstat -ano | findstr :5001

# Try different port
# Edit tally_mock_server.py, change port=5001 to port=5002
```

**Balance not fetching?**
1. Check mock server is running (look for console output)
2. Check browser console for errors (F12)
3. Verify `.env.local` has correct URL
4. Restart Next.js dev server after adding env variable

**Tests failing?**
- Make sure mock server is running first
- Check you're in the correct directory
- Verify Python and requests library are installed

## Next Steps

- Read full documentation: `TALLY_MOCK_INTEGRATION.md`
- Add more test accounts in `tally_mock_server.py`
- Customize the frontend UI
- Connect to real Tally API when ready

---

**Need Help?** Check the full documentation or review the test output for detailed error messages.
