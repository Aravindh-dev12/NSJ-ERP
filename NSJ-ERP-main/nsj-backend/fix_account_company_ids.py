#!/usr/bin/env python
"""
Fix account company IDs - ensure all accounts belong to the correct company.
This script identifies accounts with mismatched company IDs and fixes them.
"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nsj_backend.settings")
django.setup()

from accounts.models import Account
from core.models import Company
from users.models import User

def diagnose_and_fix():
    print("=" * 60)
    print("ACCOUNT COMPANY ID DIAGNOSTIC AND FIX")
    print("=" * 60)
    
    # Get all companies
    companies = Company.objects.all()
    print(f"\n📊 Companies in database: {companies.count()}")
    for company in companies:
        print(f"  - {company.name} (ID: {company.id})")
    
    # Get the main company (should be NSJ Main)
    main_company = Company.objects.filter(name__icontains="NSJ").first() or Company.objects.first()
    if not main_company:
        print("\n❌ No company found!")
        return
    
    print(f"\n✓ Main Company: {main_company.name} (ID: {main_company.id})")
    
    # Check all accounts
    all_accounts = Account.objects.all()
    print(f"\n📇 Total Accounts: {all_accounts.count()}")
    
    # Group accounts by company
    accounts_by_company = {}
    for account in all_accounts:
        company_id = str(account.company_id) if account.company_id else "None"
        if company_id not in accounts_by_company:
            accounts_by_company[company_id] = []
        accounts_by_company[company_id].append(account)
    
    print(f"\n📊 Accounts by Company:")
    for company_id, accounts in accounts_by_company.items():
        if company_id == "None":
            print(f"  - No Company: {len(accounts)} accounts")
        else:
            try:
                company = Company.objects.get(id=company_id)
                print(f"  - {company.name} ({company_id}): {len(accounts)} accounts")
            except Company.DoesNotExist:
                print(f"  - Unknown Company ({company_id}): {len(accounts)} accounts")
        
        # Show first 3 accounts
        for account in accounts[:3]:
            print(f"    → {account.account_no}: {account.account_name}")
    
    # Check user company associations
    print(f"\n👥 User Company Associations:")
    users = User.objects.all()[:5]
    for user in users:
        print(f"  - {user.name} ({user.username})")
        print(f"    Company: {user.company.name if user.company else 'None'}")
        print(f"    Company ID: {user.company_id if user.company_id else 'None'}")
    
    # Find accounts that don't match main company
    mismatched_accounts = Account.objects.exclude(company_id=main_company.id)
    
    if mismatched_accounts.count() > 0:
        print(f"\n⚠️  Found {mismatched_accounts.count()} accounts with wrong company ID!")
        print(f"\nAccounts to fix:")
        for account in mismatched_accounts:
            print(f"  - {account.account_no}: {account.account_name}")
            print(f"    Current company: {account.company_id}")
            print(f"    Should be: {main_company.id}")
        
        # Ask for confirmation
        print(f"\n🔧 Fix Options:")
        print(f"  1. Update all accounts to use main company: {main_company.name}")
        print(f"  2. Skip (manual fix required)")
        
        choice = input("\nEnter choice (1 or 2): ").strip()
        
        if choice == "1":
            print(f"\n🔨 Updating {mismatched_accounts.count()} accounts...")
            updated_count = mismatched_accounts.update(company=main_company)
            print(f"✅ Updated {updated_count} accounts to company: {main_company.name}")
            
            # Verify
            remaining = Account.objects.exclude(company_id=main_company.id).count()
            if remaining == 0:
                print(f"✅ All accounts now belong to {main_company.name}!")
            else:
                print(f"⚠️  Still {remaining} accounts with different company")
        else:
            print("\n⏭️  Skipped automatic fix")
    else:
        print(f"\n✅ All accounts already belong to {main_company.name}")
    
    # Final summary
    print(f"\n" + "=" * 60)
    print(f"FINAL STATUS")
    print(f"=" * 60)
    
    for company in companies:
        count = Account.objects.filter(company=company).count()
        print(f"  - {company.name}: {count} accounts")
    
    # Test query as a user would
    print(f"\n🔍 Testing Account Query (as logged-in user):")
    test_user = User.objects.filter(username="niti").first() or User.objects.first()
    if test_user:
        user_accounts = Account.objects.filter(company_id=test_user.company_id)
        print(f"  - User: {test_user.name}")
        print(f"  - User's company: {test_user.company.name if test_user.company else 'None'}")
        print(f"  - Accounts visible: {user_accounts.count()}")
        
        if user_accounts.count() > 0:
            print(f"\n  First 5 accounts:")
            for account in user_accounts[:5]:
                print(f"    → {account.account_no}: {account.account_name}")
        else:
            print(f"\n  ❌ No accounts visible to this user!")
            print(f"  This is why the ERP shows empty list!")
    
    print(f"\n" + "=" * 60)

if __name__ == "__main__":
    diagnose_and_fix()
