"""
Management command to ensure all accounts belong to the correct company.
This runs automatically during startup to fix company ID mismatches.
"""

from django.core.management.base import BaseCommand
from accounts.models import Account
from core.models import Company


class Command(BaseCommand):
    help = "Ensure all accounts belong to the correct company (auto-fix on startup)"

    def handle(self, *args, **options):
        self.stdout.write("🔍 Checking account company associations...")

        # Get main company
        main_company = (
            Company.objects.filter(name__icontains="NSJ").first() or Company.objects.first()
        )

        if not main_company:
            self.stdout.write(self.style.WARNING("⚠️  No company found, skipping"))
            return

        # Count total accounts
        total_accounts = Account.objects.count()
        
        if total_accounts == 0:
            self.stdout.write("ℹ️  No accounts in database yet")
            return

        # Find mismatched accounts
        mismatched = Account.objects.exclude(company_id=main_company.id)
        mismatched_count = mismatched.count()

        if mismatched_count == 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f"✅ All {total_accounts} accounts belong to {main_company.name}"
                )
            )
            return

        # Auto-fix mismatched accounts
        self.stdout.write(
            self.style.WARNING(
                f"⚠️  Found {mismatched_count} accounts with wrong company, fixing..."
            )
        )

        # Show which accounts are being fixed
        for account in mismatched[:5]:  # Show first 5
            self.stdout.write(f"  → Fixing: {account.account_no} - {account.account_name}")

        if mismatched_count > 5:
            self.stdout.write(f"  → ... and {mismatched_count - 5} more")

        # Update all mismatched accounts
        updated = mismatched.update(company=main_company)

        self.stdout.write(
            self.style.SUCCESS(
                f"✅ Fixed {updated} accounts - now belong to {main_company.name}"
            )
        )

        # Verify
        remaining = Account.objects.exclude(company_id=main_company.id).count()
        if remaining > 0:
            self.stdout.write(
                self.style.ERROR(f"❌ Still {remaining} accounts with wrong company!")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f"✅ All {total_accounts} accounts now accessible")
            )
