"""
Management command to set up users for task management with role-based access.

Company Structure:
- Niti (Founder) - Global access to all tasks
- Mehul (Accounts Head) - Access to Accounts department tasks
- Jinu Bhai (Raw Material Inventory Head) - Access to Raw Material Inventory tasks
- Sandhya (Administration Head) - Access to Administration tasks
- Sanjana (Production Head + Product Inventory Head) - Access to Production & Product Inventory tasks
- Pradip Bhai (Logistics Head) - Access to Logistics tasks
"""

from django.core.management.base import BaseCommand
from users.models import User
from core.models import Company


class Command(BaseCommand):
    help = "Set up users for task management with role-based access"

    def handle(self, *args, **options):
        # Get or create company
        company = Company.objects.first()
        if not company:
            company = Company.objects.create(name="NSJ Main", display_name="NSJ Main")
            self.stdout.write(self.style.SUCCESS(f"Created company: {company.name}"))

        # Define users with their roles
        # NOTE: is_staff=False for all frontend users to prevent Django admin access
        # Only the 'admin' superuser (created separately) should have Django admin access
        users_data = [
            {
                "name": "Niti",
                "email": "niti@nsj.com",
                "username": "niti",
                "task_role": "FOUNDER",
                "department": "FOUNDER",
                "sub_department": None,
                "role": "ADMIN",
                "is_staff": False,  # No Django admin access
            },
            {
                "name": "Mehul",
                "email": "mehul@nsj.com",
                "username": "mehul",
                "task_role": "DEPT_HEAD",
                "department": "ACCOUNTS",
                "sub_department": None,
                "role": "EMPLOYEE",
                "is_staff": False,
            },
            {
                "name": "Jinu Bhai",
                "email": "jinu@nsj.com",
                "username": "jinu",
                "task_role": "DEPT_HEAD",
                "department": "RAW_MATERIAL_INVENTORY",
                "sub_department": None,
                "role": "EMPLOYEE",
                "is_staff": False,
            },
            {
                "name": "Sandhya",
                "email": "sandhya@nsj.com",
                "username": "sandhya",
                "task_role": "DEPT_HEAD",
                "department": "ADMINISTRATION",
                "sub_department": None,
                "role": "EMPLOYEE",
                "is_staff": False,
            },
            {
                "name": "Sanjana",
                "email": "sanjana@nsj.com",
                "username": "sanjana",
                "task_role": "DEPT_HEAD",
                "department": "PRODUCTION",  # Primary department
                "sub_department": None,
                "role": "EMPLOYEE",
                "is_staff": False,
            },
            {
                "name": "Pradip Bhai",
                "email": "pradip@nsj.com",
                "username": "pradip",
                "task_role": "DEPT_HEAD",
                "department": "LOGISTICS",
                "sub_department": None,
                "role": "EMPLOYEE",
                "is_staff": False,
            },
        ]

        default_password = "nsj@123"  # Default password for all users

        for user_data in users_data:
            user, created = User.objects.update_or_create(
                email=user_data["email"],
                defaults={
                    "name": user_data["name"],
                    "username": user_data["username"],
                    "task_role": user_data["task_role"],
                    "department": user_data["department"],
                    "sub_department": user_data["sub_department"],
                    "role": user_data["role"],
                    "is_staff": user_data.get("is_staff", False),
                    "company": company,
                    "is_active": True,
                },
            )

            if created:
                user.set_password(default_password)
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created user: {user.name} ({user.email}) - {user.get_task_role_display()}"
                    )
                )
            else:
                # Also reset password for existing users to ensure they can log in
                user.set_password(default_password)
                user.save()
                self.stdout.write(
                    self.style.WARNING(
                        f"Updated user: {user.name} ({user.email}) - {user.get_task_role_display()}"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(f"\nAll users created/updated with password: {default_password}")
        )
        self.stdout.write(self.style.SUCCESS("\nUser Summary:"))
        self.stdout.write("=" * 60)

        for user in User.objects.filter(company=company).order_by("name"):
            dept = user.get_department_display() if user.department else "N/A"
            self.stdout.write(f"{user.name:15} | {user.get_task_role_display():20} | {dept}")
