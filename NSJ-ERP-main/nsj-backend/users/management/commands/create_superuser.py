"""
Management command to create a superuser for Django admin access.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Create a superuser for Django admin access"

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            default="admin",
            help="Username for the superuser (default: admin)",
        )
        parser.add_argument(
            "--email",
            default="admin@nsj.com",
            help="Email for the superuser (default: admin@nsj.com)",
        )
        parser.add_argument(
            "--password",
            default="admin123",
            help="Password for the superuser (default: admin123)",
        )

    def handle(self, *args, **options):
        username = options["username"]
        email = options["email"]
        password = options["password"]

        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f"Superuser '{username}' already exists"))
            return

        User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            name="Admin",
        )

        self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' created successfully"))
        self.stdout.write(f"  Email: {email}")
        self.stdout.write(f"  Password: {password}")
        self.stdout.write(
            self.style.WARNING("Please change the password after first login for security!")
        )
