"""
Management command to create a sales department user.
"""

from django.core.management.base import BaseCommand
from users.models import User
from core.models import Company


class Command(BaseCommand):
    help = "Create a sales department user"

    def handle(self, *args, **options):
        # Get the NSJ company
        try:
            company = Company.objects.first()  # Get the first company
            if not company:
                self.stdout.write(self.style.ERROR("No company found in database!"))
                return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error getting company: {e}"))
            return

        # Create sales user
        email = "sales@nsj.com"

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f"User with email {email} already exists!"))
            return

        user = User.objects.create_user(
            email=email,
            username="sales",  # Add username
            password="sales123",  # Default password
            name="Sales Department",
            company=company,
            is_active=True,
            is_staff=False,
            is_superuser=False,
        )

        self.stdout.write(self.style.SUCCESS("Successfully created sales user:"))
        self.stdout.write(f"  Email: {user.email}")
        self.stdout.write(f"  Name: {user.name}")
        self.stdout.write("  Password: sales123")
        self.stdout.write(f"  Company: {user.company.name}")
        self.stdout.write(self.style.WARNING("\nPlease change the password after first login!"))
