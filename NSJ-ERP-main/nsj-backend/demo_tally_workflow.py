"""
Interactive Demo: Receipt Voucher with Tally Integration
This script demonstrates the complete workflow of creating a receipt voucher
with automatic balance fetching from Tally Mock Server.
"""

import requests
import json
from datetime import datetime
import time

TALLY_MOCK_URL = "http://localhost:5001"


def print_header(text):
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70 + "\n")


def print_step(step_num, text):
    print(f"\n{'─' * 70}")
    print(f"📍 STEP {step_num}: {text}")
    print("─" * 70)


def print_success(text):
    print(f"✅ {text}")


def print_info(text):
    print(f"ℹ️  {text}")


def print_data(label, value):
    print(f"   {label}: {value}")


def wait_for_user():
    input("\n⏸️  Press Enter to continue...")


def demo_workflow():
    print_header("🎬 RECEIPT VOUCHER WORKFLOW DEMONSTRATION")
    print("This demo simulates a user creating a receipt voucher")
    print("with automatic balance fetching from Tally.")

    wait_for_user()

    # Step 1: Check Tally Connection
    print_step(1, "Checking Tally Mock Server Connection")
    try:
        response = requests.get(f"{TALLY_MOCK_URL}/api/health", timeout=2)
        if response.status_code == 200:
            print_success("Tally Mock Server is running!")
            data = response.json()
            print_data("Service", data.get("service"))
            print_data("Status", data.get("status"))
        else:
            print("❌ Server returned error status")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to Tally Mock Server: {e}")
        print("\n💡 Make sure to start the server first:")
        print("   python tally_mock_server.py")
        return False

    wait_for_user()

    # Step 2: Load Available Accounts
    print_step(2, "Loading Available Accounts (Party Dropdown)")
    try:
        response = requests.get(f"{TALLY_MOCK_URL}/api/accounts")
        data = response.json()
        accounts = data.get("data", [])

        print_success(f"Loaded {len(accounts)} accounts")
        print("\n📋 Available Parties:")
        for i, acc in enumerate(accounts, 1):
            print(f"   {i}. {acc['name']} ({acc['id']})")
            print(f"      Balance: ₹{acc['balance']:,.2f} {acc['balance_type']}")
    except Exception as e:
        print(f"❌ Error loading accounts: {e}")
        return False

    wait_for_user()

    # Step 3: User Selects a Party
    print_step(3, "User Selects Party from Dropdown")
    selected_account = accounts[0]  # Select first account for demo
    print_info(f"User selected: {selected_account['name']}")
    print_data("Account ID", selected_account["id"])

    wait_for_user()

    # Step 4: Auto-fetch Balance from Tally
    print_step(4, "Auto-Fetching Balance from Tally")
    print_info("Frontend makes API call to Tally Mock Server...")
    time.sleep(0.5)  # Simulate network delay

    try:
        response = requests.get(f"{TALLY_MOCK_URL}/api/accounts/{selected_account['id']}/balance")
        balance_data = response.json()["data"]

        print_success("Balance fetched successfully!")
        print("\n💰 Account Balance Details:")
        print_data("Account Name", balance_data["account_name"])
        print_data("Balance Amount", f"₹{balance_data['balance']:,.2f}")
        print_data("Balance Type", balance_data["balance_type"])
        print_data("Last Updated", balance_data["last_updated"])
        print_data("Currency", balance_data["currency"])

        # Explain balance type
        if balance_data["balance_type"] == "Dr":
            print("\n   🔴 Debit Balance: Customer owes us money")
        else:
            print("\n   🟢 Credit Balance: We owe the customer money")

    except Exception as e:
        print(f"❌ Error fetching balance: {e}")
        return False

    wait_for_user()

    # Step 5: User Fills Receipt Form
    print_step(5, "User Fills Receipt Voucher Form")

    receipt_data = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "type": "Cr",
        "party_name_id": selected_account["id"],
        "balance": balance_data["balance"],
        "dr": 0.00,
        "cr": 25000.00,
        "narration": "Payment received for order #12345",
    }

    print_info("Form Data:")
    print_data("Date", receipt_data["date"])
    print_data("Type", receipt_data["type"])
    print_data("Party", balance_data["account_name"])
    print_data("Balance (from Tally)", f"₹{receipt_data['balance']:,.2f}")
    print_data("Dr Amount", f"₹{receipt_data['dr']:,.2f}")
    print_data("Cr Amount", f"₹{receipt_data['cr']:,.2f}")
    print_data("Narration", receipt_data["narration"])

    wait_for_user()

    # Step 6: Calculate New Balance
    print_step(6, "Calculating New Balance")

    old_balance = balance_data["balance"]
    cr_amount = receipt_data["cr"]

    if balance_data["balance_type"] == "Dr":
        new_balance = old_balance - cr_amount
        print_info("Customer had Debit balance (owed us money)")
        print_data("Old Balance", f"₹{old_balance:,.2f} Dr")
        print_data("Payment Received (Cr)", f"₹{cr_amount:,.2f}")
        print_data("New Balance", f"₹{new_balance:,.2f} Dr")

        if new_balance < 0:
            print("\n   ⚠️  Balance would become negative (we would owe customer)")
    else:
        new_balance = old_balance + cr_amount
        print_info("Customer had Credit balance (we owed them)")
        print_data("Old Balance", f"₹{old_balance:,.2f} Cr")
        print_data("Additional Credit", f"₹{cr_amount:,.2f}")
        print_data("New Balance", f"₹{new_balance:,.2f} Cr")

    wait_for_user()

    # Step 7: Submit to Backend
    print_step(7, "Submitting Receipt to Django Backend")
    print_info("Frontend sends POST request to Django API...")
    print_info("Endpoint: POST /api/receipts/")
    print("\n📤 Payload:")
    print(json.dumps(receipt_data, indent=2))

    print("\n" + "─" * 70)
    print_success("Receipt would be saved to database!")
    print_info("Django would:")
    print("   1. Validate the data")
    print("   2. Create Receipt record in database")
    print("   3. Update account ledger")
    print("   4. Return success response")

    wait_for_user()

    # Step 8: Optional - Send to Tally
    print_step(8, "Optional: Sync Receipt to Tally")
    print_info("Sending receipt data to Tally Mock Server...")

    try:
        tally_payload = {
            "account_id": selected_account["id"],
            "amount": receipt_data["cr"],
            "type": receipt_data["type"],
            "date": receipt_data["date"],
            "narration": receipt_data["narration"],
        }

        response = requests.post(
            f"{TALLY_MOCK_URL}/api/receipts",
            json=tally_payload,
            headers={"Content-Type": "application/json"},
        )

        if response.status_code == 200:
            result = response.json()
            print_success("Receipt synced to Tally!")
            print_data("Tally Receipt ID", result["data"]["receipt_id"])
            print_data("Created At", result["data"]["created_at"])

    except Exception as e:
        print(f"⚠️  Could not sync to Tally: {e}")

    wait_for_user()

    # Step 9: View Updated Transactions
    print_step(9, "Viewing Updated Account Transactions")

    try:
        response = requests.get(
            f"{TALLY_MOCK_URL}/api/accounts/{selected_account['id']}/transactions"
        )
        txn_data = response.json()["data"]

        print_success("Recent transactions retrieved")
        print(f"\n📊 Transactions for: {txn_data['account_name']}")
        print("\n   Date       | Type | Amount        | Narration")
        print("   " + "-" * 60)

        for txn in txn_data["transactions"][:5]:
            print(
                f"   {txn['date']} | {txn['type']:4} | ₹{txn['amount']:>10,.2f} | {txn['narration']}"
            )

    except Exception as e:
        print(f"⚠️  Could not fetch transactions: {e}")

    # Summary
    print_header("✨ WORKFLOW COMPLETE!")
    print("Summary of what happened:")
    print("  1. ✅ Connected to Tally Mock Server")
    print("  2. ✅ Loaded available accounts")
    print("  3. ✅ User selected a party")
    print("  4. ✅ Auto-fetched balance from Tally")
    print("  5. ✅ User filled receipt form")
    print("  6. ✅ Calculated new balance")
    print("  7. ✅ Submitted to Django backend")
    print("  8. ✅ Synced to Tally (optional)")
    print("  9. ✅ Viewed updated transactions")

    print("\n" + "=" * 70)
    print("🎉 Receipt Voucher created successfully!")
    print("=" * 70 + "\n")

    return True


def main():
    try:
        success = demo_workflow()
        if success:
            print("\n💡 Next Steps:")
            print("   - Try this in the actual UI")
            print("   - Test with different accounts")
            print("   - Customize the mock data")
            print("   - Connect to real Tally API")
        else:
            print("\n⚠️  Demo encountered errors")
            print("   Make sure the Tally Mock Server is running:")
            print("   python tally_mock_server.py")
    except KeyboardInterrupt:
        print("\n\n⚠️  Demo interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")


if __name__ == "__main__":
    main()
