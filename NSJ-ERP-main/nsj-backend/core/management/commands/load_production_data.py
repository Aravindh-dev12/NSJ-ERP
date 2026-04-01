"""
Management command to load production data from db_backup.json.
This imports all data from the local SQLite database to Railway PostgreSQL.
"""

import os
from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = "Load production data from db_backup.json"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            default="db_backup.json",
            help="Path to the JSON export file (default: db_backup.json)",
        )

    def handle(self, *args, **options):
        file_path = options["file"]

        # Check if file exists
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f"File not found: {file_path}"))
            self.stdout.write(self.style.WARNING("Make sure db_backup.json is in the project root"))
            return

        self.stdout.write(self.style.SUCCESS(f"Loading data from {file_path}..."))

        try:
            # Use Django's loaddata command
            call_command("loaddata", file_path, verbosity=2)
            self.stdout.write(self.style.SUCCESS("Successfully loaded all production data!"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error loading data: {str(e)}"))
            raise
