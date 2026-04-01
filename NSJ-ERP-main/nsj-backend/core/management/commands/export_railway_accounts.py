"""
Export accounts from Railway Postgres to a JSON file for backup.
This creates a backup of all accounts currently in the database.
"""

import json
from django.core.management.base import BaseCommand
from accounts.models import Account
from django.core import serializers


class Command(BaseCommand):
    help = "Export all accounts from database to JSON file"

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            type=str,
            default="railway_accounts_backup.json",
            help="Output file name (default: railway_accounts_backup.json)",
        )

    def handle(self, *args, **options):
        output_file = options["output"]

        self.stdout.write("📦 Exporting accounts from database...")

        # Get all accounts
        accounts = Account.objects.all().order_by("account_no")
        count = accounts.count()

        if count == 0:
            self.stdout.write(self.style.WARNING("⚠️  No accounts found in database"))
            return

        self.stdout.write(f"Found {count} accounts:")

        # Show what we're exporting
        for account in accounts[:10]:  # Show first 10
            self.stdout.write(
                f"  - {account.account_no}: {account.account_name} (Company: {account.company_id})"
            )

        if count > 10:
            self.stdout.write(f"  ... and {count - 10} more")

        # Serialize to JSON
        data = serializers.serialize("json", accounts, indent=2)

        # Write to file
        with open(output_file, "w") as f:
            f.write(data)

        self.stdout.write(
            self.style.SUCCESS(f"\n✅ Exported {count} accounts to {output_file}")
        )
        self.stdout.write(f"File size: {len(data)} bytes")

        # Also create a simple CSV for easy viewing
        csv_file = output_file.replace(".json", ".csv")
        with open(csv_file, "w") as f:
            f.write("account_no,account_name,group_code,status,company_id\n")
            for account in accounts:
                f.write(
                    f'"{account.account_no}","{account.account_name}","{account.group_code}","{account.status}","{account.company_id}"\n'
                )

        self.stdout.write(self.style.SUCCESS(f"✅ Also created CSV: {csv_file}"))
