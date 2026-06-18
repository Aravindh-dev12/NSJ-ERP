"""
Lightweight Flask Mock Server to emulate Tally API
This server provides endpoints to fetch account balances for testing the Receipt Voucher functionality.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Mock data: Account balances (simulating Tally's ledger data)
MOCK_ACCOUNTS = {
    "CUST001": {
        "account_id": "CUST001",
        "account_name": "ABC Jewellers",
        "balance": 125000.50,
        "balance_type": "Dr",  # Debit balance (customer owes us)
        "last_updated": "2025-12-09",
    },
    "CUST002": {
        "account_id": "CUST002",
        "account_name": "XYZ Gold Traders",
        "balance": 75000.00,
        "balance_type": "Cr",  # Credit balance (we owe customer)
        "last_updated": "2025-12-08",
    },
    "CUST003": {
        "account_id": "CUST003",
        "account_name": "Diamond Palace",
        "balance": 250000.75,
        "balance_type": "Dr",
        "last_updated": "2025-12-10",
    },
    "CUST004": {
        "account_id": "CUST004",
        "account_name": "Golden Ornaments Ltd",
        "balance": 0.00,
        "balance_type": "Dr",
        "last_updated": "2025-12-10",
    },
    "CUST005": {
        "account_id": "CUST005",
        "account_name": "Silver Shine Exports",
        "balance": 180000.25,
        "balance_type": "Cr",
        "last_updated": "2025-12-07",
    },
}


def generate_balance_for_account(account_id):
    """
    Generate a consistent balance for any account ID (including UUIDs).
    Uses the account ID as a seed for consistency - same ID always returns same balance.
    """
    import hashlib

    # Use account ID hash to generate consistent random balance
    hash_value = int(hashlib.md5(account_id.encode()).hexdigest()[:8], 16)

    # Generate balance between 10,000 and 500,000
    min_balance = 10000.00
    max_balance = 500000.00
    balance_range = max_balance - min_balance
    balance = min_balance + (hash_value % int(balance_range))

    # Determine balance type (Dr or Cr) based on hash
    balance_type = "Dr" if hash_value % 2 == 0 else "Cr"

    return {"balance": round(balance, 2), "balance_type": balance_type}


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify(
        {"status": "ok", "service": "Tally Mock Server", "timestamp": datetime.now().isoformat()}
    )


@app.route("/api/accounts", methods=["GET"])
def get_accounts():
    """Get list of all accounts (for dropdown population)"""
    accounts = [
        {
            "id": acc_id,
            "name": acc_data["account_name"],
            "balance": acc_data["balance"],
            "balance_type": acc_data["balance_type"],
        }
        for acc_id, acc_data in MOCK_ACCOUNTS.items()
    ]
    return jsonify({"success": True, "data": accounts, "count": len(accounts)})


@app.route("/api/accounts/<account_id>/balance", methods=["GET"])
def get_account_balance(account_id):
    """
    Get balance for a specific account
    This is the main endpoint that the Receipt Voucher will call

    Supports both:
    - Pre-configured account IDs (CUST001, CUST002, etc.)
    - Dynamic UUID-based account IDs from Django database
    """
    print(f"📥 Balance request for account: {account_id}")

    # Check if it's a pre-configured account
    if account_id in MOCK_ACCOUNTS:
        account = MOCK_ACCOUNTS[account_id]
        print(f"✅ Found pre-configured account: {account['account_name']}")
        return jsonify(
            {
                "success": True,
                "data": {
                    "account_id": account_id,
                    "account_name": account["account_name"],
                    "balance": account["balance"],
                    "balance_type": account["balance_type"],
                    "last_updated": account["last_updated"],
                    "currency": "INR",
                },
            }
        )

    # For any other account ID (like UUIDs from database), generate a balance
    # This simulates Tally returning balance for any valid account
    try:
        balance_data = generate_balance_for_account(account_id)
        print(
            f"✅ Generated balance for UUID account: {balance_data['balance']} {balance_data['balance_type']}"
        )

        return jsonify(
            {
                "success": True,
                "data": {
                    "account_id": account_id,
                    "account_name": f"Account {account_id[:8]}...",  # Shortened for display
                    "balance": balance_data["balance"],
                    "balance_type": balance_data["balance_type"],
                    "last_updated": datetime.now().strftime("%Y-%m-%d"),
                    "currency": "INR",
                },
            }
        )
    except Exception as e:
        print(f"❌ Error generating balance: {str(e)}")
        return jsonify(
            {"success": False, "error": "Failed to generate balance", "message": str(e)}
        ), 500


@app.route("/api/accounts/search", methods=["GET"])
def search_accounts():
    """Search accounts by name"""
    query = request.args.get("q", "").lower()

    if not query:
        return jsonify({"success": False, "error": "Query parameter 'q' is required"}), 400

    results = [
        {
            "id": acc_id,
            "name": acc_data["account_name"],
            "balance": acc_data["balance"],
            "balance_type": acc_data["balance_type"],
        }
        for acc_id, acc_data in MOCK_ACCOUNTS.items()
        if query in acc_data["account_name"].lower()
    ]

    return jsonify({"success": True, "data": results, "count": len(results)})


@app.route("/api/receipts", methods=["POST"])
def create_receipt():
    """
    Mock endpoint to simulate creating a receipt in Tally
    (Optional - for testing the full flow)
    """
    data = request.get_json()

    required_fields = ["account_id", "amount", "type"]
    missing_fields = [field for field in required_fields if field not in data]

    if missing_fields:
        return jsonify(
            {"success": False, "error": "Missing required fields", "missing_fields": missing_fields}
        ), 400

    # Simulate receipt creation
    receipt_id = f"RCP{random.randint(10000, 99999)}"

    return jsonify(
        {
            "success": True,
            "message": "Receipt created successfully",
            "data": {
                "receipt_id": receipt_id,
                "account_id": data["account_id"],
                "amount": data["amount"],
                "type": data["type"],
                "date": data.get("date", datetime.now().strftime("%Y-%m-%d")),
                "narration": data.get("narration", ""),
                "created_at": datetime.now().isoformat(),
            },
        }
    )


@app.route("/api/accounts/<account_id>/transactions", methods=["GET"])
def get_account_transactions(account_id):
    """Get recent transactions for an account (optional feature)"""
    if account_id not in MOCK_ACCOUNTS:
        return jsonify({"success": False, "error": "Account not found"}), 404

    # Mock transaction data
    transactions = [
        {
            "id": f"TXN{i}",
            "date": f"2025-12-{10 - i:02d}",
            "type": random.choice(["Dr", "Cr"]),
            "amount": random.uniform(1000, 50000),
            "narration": f"Transaction {i}",
            "balance_after": MOCK_ACCOUNTS[account_id]["balance"],
        }
        for i in range(1, 6)
    ]

    return jsonify(
        {
            "success": True,
            "data": {
                "account_id": account_id,
                "account_name": MOCK_ACCOUNTS[account_id]["account_name"],
                "transactions": transactions,
            },
        }
    )


if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Tally Mock Server Starting...")
    print("=" * 60)
    print("\nAvailable Endpoints:")
    print("  GET  /api/health                          - Health check")
    print("  GET  /api/accounts                        - List all accounts")
    print("  GET  /api/accounts/<id>/balance           - Get account balance")
    print("  GET  /api/accounts/search?q=<query>       - Search accounts")
    print("  POST /api/receipts                        - Create receipt")
    print("  GET  /api/accounts/<id>/transactions      - Get transactions")
    print("\n" + "=" * 60)
    print("Server running on: http://localhost:5001")
    print("=" * 60 + "\n")

    app.run(host="0.0.0.0", port=5001, debug=True)
