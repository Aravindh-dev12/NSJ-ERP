"""
Management command to assign users to departments based on their roles.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Department

User = get_user_model()


class Command(BaseCommand):
    help = "Assign users to departments based on their roles"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting department assignment..."))

        # Get all departments
        try:
            accounts = Department.objects.get(code="ACCOUNTS")
            production = Department.objects.get(code="PRODUCTION")
            raw_material = Department.objects.get(code="RAW_MATERIAL")
            administration = Department.objects.get(code="ADMINISTRATION")
            logistics = Department.objects.get(code="LOGISTICS")
            sales = Department.objects.get(code="SALES")
        except Department.DoesNotExist as e:
            self.stdout.write(self.style.ERROR(f"Department not found: {e}"))
            self.stdout.write(self.style.WARNING("Run migrations first: python manage.py migrate"))
            return

        # User assignments based on specification
        user_assignments = {
            "niti": {
                "departments": [
                    accounts,
                    production,
                    raw_material,
                    administration,
                    logistics,
                    sales,
                ],
                "active": accounts,
                "role": "Founder - ALL tasks",
            },
            "mehul": {"departments": [accounts], "active": accounts, "role": "Accounts Head"},
            "jinu": {
                "departments": [raw_material],
                "active": raw_material,
                "role": "Raw Material Head",
            },
            "sandhya": {
                "departments": [administration],
                "active": administration,
                "role": "Administration Head",
            },
            "sanjana": {
                "departments": [production],
                "active": production,
                "role": "Production Head",
            },
            "pradip": {"departments": [logistics], "active": logistics, "role": "Logistics Head"},
        }

        assigned_count = 0
        for username, config in user_assignments.items():
            try:
                user = User.objects.get(username=username)

                # Clear existing departments
                user.departments.clear()

                # Assign new departments
                for dept in config["departments"]:
                    user.departments.add(dept)

                # Set active department
                user.current_active_department = config["active"]
                user.save()

                dept_names = ", ".join([d.name for d in config["departments"]])
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✓ {username} ({config['role']}): {dept_names} | Active: {config['active'].name}"
                    )
                )
                assigned_count += 1

            except User.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'⚠ User "{username}" not found - skipping'))

        self.stdout.write(
            self.style.SUCCESS(f"\n✓ Successfully assigned {assigned_count} users to departments")
        )

        if assigned_count == 0:
            self.stdout.write(
                self.style.WARNING("\nNo users were assigned. Create users first with:")
            )
            self.stdout.write("  python manage.py createsuperuser")
