"""
Test script to verify Tally Mock Server integration
This script tests all the endpoints and simulates the Receipt Voucher workflow
"""

import requests
import json
from datetime import datetime

TALLY_MOCK_URL = "http://localhost:5001"


def print_section(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def test_health_check():
    print_section("1. Testing Health Check")
    try:
        response = requests.get(f"{TALLY_MOCK_URL}/api/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_get_accounts():
    print_section("2. Testing Get All Accounts")
    try:
        response = requests.get(f"{TALLY_MOCK_URL}/api/accounts")
        print(f"Status Code: {response.status_code}")
        data = response.json()
        print(f"Total Accounts: {data.get('count', 0)}")
        print("\nAccounts:")
        for acc in data.get("data", []):
            print(
                f"  - {acc['id']}: {acc['name']} (Balance: ₹{acc['balance']} {acc['balance_type']})"
            )
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_get_account_balance(account_id="CUST001"):
    print_section(f"3. Testing Get Account Balance (ID: {account_id})")
    try:
        response = requests.get(f"{TALLY_MOCK_URL}/api/accounts/{account_id}/balance")
        print(f"Status Code: {response.status_code}")
        data = response.json()
        if data.get("success"):
            acc_data = data["data"]
            print("\n✅ Account Details:")
            print(f"   Account ID: {acc_data['account_id']}")
            print(f"   Account Name: {acc_data['account_name']}")
            print(f"   Balance: ₹{acc_data['balance']:,.2f}")
            print(f"   Balance Type: {acc_data['balance_type']}")
            print(f"   Last Updated: {acc_data['last_updated']}")
            print(f"   Currency: {acc_data['currency']}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_search_accounts(query="gold"):
    print_section(f"4. Testing Search Accounts (Query: '{query}')")
    try:
        response = requests.get(f"{TALLY_MOCK_URL}/api/accounts/search", params={"q": query})
        print(f"Status Code: {response.status_code}")
        data = response.json()
        print(f"Results Found: {data.get('count', 0)}")
        for acc in data.get("data", []):
            print(f"  - {acc['id']}: {acc['name']}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_create_receipt():
    print_section("5. Testing Create Receipt")
    try:
        receipt_data = {
            "account_id": "CUST001",
            "amount": 50000.00,
            "type": "Cr",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "narration": "Payment received for order #12345",
        }

        print("Sending Receipt Data:")
        print(json.dumps(receipt_data, indent=2))

        response = requests.post(
            f"{TALLY_MOCK_URL}/api/receipts",
            json=receipt_data,
            headers={"Content-Type": "application/json"},
        )

        print(f"\nStatus Code: {response.status_code}")
        data = response.json()

        if data.get("success"):
            print("\n✅ Receipt Created Successfully!")
            print(f"   Receipt ID: {data['data']['receipt_id']}")
            print(f"   Account: {data['data']['account_id']}")
            print(f"   Amount: ₹{data['data']['amount']:,.2f}")
            print(f"   Type: {data['data']['type']}")

        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_get_transactions(account_id="CUST001"):
    print_section(f"6. Testing Get Account Transactions (ID: {account_id})")
    try:
        response = requests.get(f"{TALLY_MOCK_URL}/api/accounts/{account_id}/transactions")
        print(f"Status Code: {response.status_code}")
        data = response.json()

        if data.get("success"):
            acc_data = data["data"]
            print(f"\n✅ Transactions for: {acc_data['account_name']}")
            print("\nRecent Transactions:")
            for txn in acc_data["transactions"]:
                print(
                    f"  - {txn['date']} | {txn['type']} | ₹{txn['amount']:,.2f} | {txn['narration']}"
                )

        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_receipt_voucher_workflow():
    print_section("7. Testing Complete Receipt Voucher Workflow")
    print("\nSimulating the Receipt Voucher form workflow:\n")

    # Step 1: User opens the form and selects a party
    print("Step 1: User selects party 'ABC Jewellers' (CUST001)")

    # Step 2: Fetch balance from Tally
    print("Step 2: Fetching balance from Tally...")
    try:
        response = requests.get(f"{TALLY_MOCK_URL}/api/accounts/CUST001/balance")
        if response.status_code == 200:
            data = response.json()
            balance_data = data["data"]
            print(
                f"   ✅ Balance fetched: ₹{balance_data['balance']:,.2f} {balance_data['balance_type']}"
            )

            # Step 3: User enters receipt details
            print("\nStep 3: User enters receipt details:")
            print(f"   - Date: {datetime.now().strftime('%Y-%m-%d')}")
            print("   - Type: Cr (Credit)")
            print(f"   - Party: {balance_data['account_name']}")
            print(f"   - Balance (from Tally): ₹{balance_data['balance']:,.2f}")
            print("   - Dr: ₹0.00")
            print("   - Cr: ₹25,000.00")
            print("   - Narration: Payment received")

            # Step 4: Submit to backend (simulated)
            print("\nStep 4: Form submitted to Django backend")
            print("   ✅ Receipt would be saved to database")

            return True
        else:
            print("   ❌ Failed to fetch balance")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def run_all_tests():
    print("\n" + "🚀" * 30)
    print("  TALLY MOCK SERVER INTEGRATION TESTS")
    print("🚀" * 30)

    results = []

    # Run all tests
    results.append(("Health Check", test_health_check()))
    results.append(("Get All Accounts", test_get_accounts()))
    results.append(("Get Account Balance", test_get_account_balance("CUST001")))
    results.append(("Search Accounts", test_search_accounts("gold")))
    results.append(("Create Receipt", test_create_receipt()))
    results.append(("Get Transactions", test_get_transactions("CUST001")))
    results.append(("Receipt Voucher Workflow", test_receipt_voucher_workflow()))

    # Print summary
    print_section("TEST SUMMARY")
    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")

    print(f"\n{'=' * 60}")
    print(f"Total: {passed}/{total} tests passed")
    print(f"{'=' * 60}\n")

    return passed == total


if __name__ == "__main__":
    try:
        success = run_all_tests()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        exit(1)
