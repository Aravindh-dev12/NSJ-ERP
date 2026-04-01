"""
Management command to seed Item Group master data.
"""

from django.core.management.base import BaseCommand
from core.models import ItemGroupMaster


class Command(BaseCommand):
    help = "Seed Item Group master data"

    def handle(self, *args, **options):
        item_groups = [
            "GOLD METAL",
            "DIAMOND JEWELLERY",
            "DIAMOND",
            "GEMS/STONES",
            "GOLD JEWELLERY",
            "BRANDED JEWELLERY",
            "SILVER JEWELLERY",
            "KUNDAN JEWELLERY",
            "OTHERS",
            "PC RATE JEWELLERY",
        ]

        created_count = 0
        for group_name in item_groups:
            _, created = ItemGroupMaster.objects.get_or_create(
                name=group_name,
                company=None,  # Global item groups
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"Created: {group_name}"))
            else:
                self.stdout.write(f"Already exists: {group_name}")

        self.stdout.write(
            self.style.SUCCESS(f"\nSeeding complete! Created {created_count} new item groups.")
        )
        self.stdout.write(f"Total item groups: {ItemGroupMaster.objects.count()}")
