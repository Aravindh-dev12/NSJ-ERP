"""
Management command to fix account company associations.
Ensures all accounts belong to the correct company.
"""

from django.core.management.base import BaseCommand
from accounts.models import Account
from core.models import Company
from users.models import User


class Command(BaseCommand):
    help = "Fix account company associations - ensure all accounts belong to the correct company"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be changed without making changes",
        )
        parser.add_argument(
            "--auto-fix",
            action="store_true",
            help="Automatically fix mismatched accounts without prompting",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        auto_fix = options["auto_fix"]

        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("ACCOUNT COMPANY ID FIX"))
        self.stdout.write(self.style.SUCCESS("=" * 60))

        # Get all companies
        companies = Company.objects.all()
        self.stdout.write(f"\n📊 Companies: {companies.count()}")
        for company in companies:
            self.stdout.write(f"  - {company.name} (ID: {company.id})")

        # Get main company
        main_company = (
            Company.objects.filter(name__icontains="NSJ").first() or Company.objects.first()
        )
        if not main_company:
            self.stdout.write(self.style.ERROR("\n❌ No company found!"))
            return

        self.stdout.write(
            self.style.SUCCESS(f"\n✓ Main Company: {main_company.name} (ID: {main_company.id})")
        )

        # Check all accounts
        all_accounts = Account.objects.all()
        self.stdout.write(f"\n📇 Total Accounts: {all_accounts.count()}")

        # Group by company
        for company in companies:
            count = Account.objects.filter(company=company).count()
            self.stdout.write(f"  - {company.name}: {count} accounts")

        # Find mismatched accounts
        mismatched = Account.objects.exclude(company_id=main_company.id)

        if mismatched.count() == 0:
            self.stdout.write(
                self.style.SUCCESS(f"\n✅ All accounts already belong to {main_company.name}")
            )
            return

        self.stdout.write(
            self.style.WARNING(
                f"\n⚠️  Found {mismatched.count()} accounts with wrong company ID!"
            )
        )
        self.stdout.write("\nAccounts to fix:")
        for account in mismatched[:10]:  # Show first 10
            self.stdout.write(f"  - {account.account_no}: {account.account_name}")
            self.stdout.write(f"    Current: {account.company_id}")
            self.stdout.write(f"    Should be: {main_company.id}")

        if mismatched.count() > 10:
            self.stdout.write(f"  ... and {mismatched.count() - 10} more")

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f"\n🔍 DRY RUN: Would update {mismatched.count()} accounts"
                )
            )
            return

        if not auto_fix:
            self.stdout.write(
                self.style.WARNING(
                    "\n⚠️  Use --auto-fix to update these accounts automatically"
                )
            )
            return

        # Fix accounts
        self.stdout.write(f"\n🔨 Updating {mismatched.count()} accounts...")
        updated_count = mismatched.update(company=main_company)
        self.stdout.write(
            self.style.SUCCESS(f"✅ Updated {updated_count} accounts to: {main_company.name}")
        )

        # Verify
        remaining = Account.objects.exclude(company_id=main_company.id).count()
        if remaining == 0:
            self.stdout.write(
                self.style.SUCCESS(f"\n✅ All accounts now belong to {main_company.name}!")
            )
        else:
            self.stdout.write(
                self.style.WARNING(f"\n⚠️  Still {remaining} accounts with different company")
            )

        # Test as user
        self.stdout.write(f"\n🔍 Testing visibility for users:")
        test_user = User.objects.filter(username="niti").first() or User.objects.first()
        if test_user:
            user_accounts = Account.objects.filter(company_id=test_user.company_id)
            self.stdout.write(f"  - User: {test_user.name}")
            self.stdout.write(
                f"  - Company: {test_user.company.name if test_user.company else 'None'}"
            )
            self.stdout.write(f"  - Visible accounts: {user_accounts.count()}")

        self.stdout.write(self.style.SUCCESS("\n" + "=" * 60))
