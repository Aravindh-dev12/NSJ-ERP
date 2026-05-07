"""
Management command to test and verify the notification system is working correctly.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from tasks.models import Task, TaskNotification
from users.models import User
from core.models import Company
from datetime import date, timedelta


class Command(BaseCommand):
    help = "Test and verify the notification system is working"

    def add_arguments(self, parser):
        parser.add_argument(
            "--create-test-task",
            action="store_true",
            help="Create a test task with notifications",
        )
        parser.add_argument(
            "--user-email",
            type=str,
            help="Email of user to test notifications for",
        )

    def handle(self, *args, **options):
        create_test = options["create_test_task"]
        user_email = options.get("user_email")

        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("NOTIFICATION SYSTEM TEST"))
        self.stdout.write(self.style.SUCCESS("=" * 60))

        # Test 1: Check if TaskNotification model exists and is accessible
        self.stdout.write("\n1. Testing TaskNotification model...")
        try:
            notification_count = TaskNotification.objects.count()
            self.stdout.write(
                self.style.SUCCESS(f"   ✓ TaskNotification model accessible")
            )
            self.stdout.write(f"   Total notifications in database: {notification_count}")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ✗ Error accessing TaskNotification: {e}"))
            return

        # Test 2: Check if users exist
        self.stdout.write("\n2. Testing User model...")
        try:
            user_count = User.objects.count()
            self.stdout.write(self.style.SUCCESS(f"   ✓ User model accessible"))
            self.stdout.write(f"   Total users in database: {user_count}")

            if user_count == 0:
                self.stdout.write(
                    self.style.WARNING("   ⚠ No users found - notifications won't work!")
                )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ✗ Error accessing User: {e}"))
            return

        # Test 3: Check if tasks exist
        self.stdout.write("\n3. Testing Task model...")
        try:
            task_count = Task.objects.count()
            self.stdout.write(self.style.SUCCESS(f"   ✓ Task model accessible"))
            self.stdout.write(f"   Total tasks in database: {task_count}")

            if task_count == 0:
                self.stdout.write(
                    self.style.WARNING("   ⚠ No tasks found - run backfill after creating tasks")
                )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ✗ Error accessing Task: {e}"))
            return

        # Test 4: Check notification distribution
        self.stdout.write("\n4. Checking notification distribution...")
        try:
            users_with_notifications = (
                TaskNotification.objects.values("user__name", "user__email")
                .distinct()
                .count()
            )
            self.stdout.write(
                f"   Users with notifications: {users_with_notifications} / {user_count}"
            )

            # Show top 5 users with most notifications
            from django.db.models import Count

            top_users = (
                TaskNotification.objects.values("user__name", "user__email")
                .annotate(count=Count("id"))
                .order_by("-count")[:5]
            )

            if top_users:
                self.stdout.write("\n   Top users by notification count:")
                for user in top_users:
                    self.stdout.write(
                        f"     - {user['user__name']} ({user['user__email']}): {user['count']} notifications"
                    )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ✗ Error checking distribution: {e}"))

        # Test 5: Check unread notifications
        self.stdout.write("\n5. Checking unread notifications...")
        try:
            unread_count = TaskNotification.objects.filter(is_read=False).count()
            read_count = TaskNotification.objects.filter(is_read=True).count()
            self.stdout.write(f"   Unread notifications: {unread_count}")
            self.stdout.write(f"   Read notifications: {read_count}")

            if unread_count == 0 and notification_count > 0:
                self.stdout.write(
                    self.style.WARNING(
                        "   ⚠ All notifications are marked as read - users won't see them!"
                    )
                )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ✗ Error checking read status: {e}"))

        # Test 6: Check specific user notifications
        if user_email:
            self.stdout.write(f"\n6. Checking notifications for {user_email}...")
            try:
                user = User.objects.get(email=user_email)
                user_notifications = TaskNotification.objects.filter(user=user)
                unread_user = user_notifications.filter(is_read=False).count()

                self.stdout.write(
                    self.style.SUCCESS(f"   ✓ Found user: {user.name}")
                )
                self.stdout.write(f"   Total notifications: {user_notifications.count()}")
                self.stdout.write(f"   Unread notifications: {unread_user}")

                # Show recent notifications
                recent = user_notifications.order_by("-created_at")[:5]
                if recent:
                    self.stdout.write("\n   Recent notifications:")
                    for notif in recent:
                        status = "📬 UNREAD" if not notif.is_read else "✓ Read"
                        self.stdout.write(
                            f"     [{status}] {notif.message[:60]}... ({notif.created_at.strftime('%Y-%m-%d %H:%M')})"
                        )
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f"   ✗ User with email {user_email} not found")
                )
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"   ✗ Error: {e}"))

        # Test 7: Create test task if requested
        if create_test:
            self.stdout.write("\n7. Creating test task with notifications...")
            try:
                company = Company.objects.first()
                if not company:
                    self.stdout.write(
                        self.style.ERROR("   ✗ No company found - cannot create test task")
                    )
                    return

                # Get a test user
                test_user = User.objects.first()
                if not test_user:
                    self.stdout.write(
                        self.style.ERROR("   ✗ No users found - cannot create test task")
                    )
                    return

                # Create test task
                test_task = Task.objects.create(
                    company=company,
                    title="TEST: Notification System Verification",
                    description="This is a test task to verify the notification system is working correctly.",
                    department="ADMINISTRATION",
                    deadline=date.today() + timedelta(days=7),
                    urgency="LOW",
                    assigned_to=test_user,
                    created_by=test_user,
                    status="PENDING",
                )

                self.stdout.write(
                    self.style.SUCCESS(f"   ✓ Created test task: {test_task.id}")
                )

                # Check if notification was auto-created by signal
                import time

                time.sleep(1)  # Wait for signal to process

                test_notifications = TaskNotification.objects.filter(task=test_task)
                if test_notifications.exists():
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"   ✓ Notification auto-created by signal! ({test_notifications.count()} notifications)"
                        )
                    )
                    for notif in test_notifications:
                        self.stdout.write(
                            f"     - For {notif.user.name}: {notif.message}"
                        )
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            "   ⚠ No notification auto-created - signals might not be working"
                        )
                    )

                    # Manually create notification
                    manual_notif = TaskNotification.objects.create(
                        user=test_user,
                        task=test_task,
                        message=f"Manual test notification for task: {test_task.title}",
                        is_read=False,
                    )
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"   ✓ Manually created notification: {manual_notif.id}"
                        )
                    )

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"   ✗ Error creating test task: {e}"))

        # Summary
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("TEST SUMMARY"))
        self.stdout.write("=" * 60)

        issues = []

        if user_count == 0:
            issues.append("No users in database")
        if task_count == 0:
            issues.append("No tasks in database")
        if notification_count == 0:
            issues.append("No notifications in database - run backfill_notifications")
        if unread_count == 0 and notification_count > 0:
            issues.append("All notifications are read - users won't see them")

        if issues:
            self.stdout.write(self.style.WARNING("\n⚠ Issues found:"))
            for issue in issues:
                self.stdout.write(f"  - {issue}")

            self.stdout.write("\n📋 Recommended actions:")
            if notification_count == 0:
                self.stdout.write("  1. Run: python manage.py backfill_notifications")
            if user_count == 0:
                self.stdout.write("  2. Create users in the system")
            if task_count == 0:
                self.stdout.write("  3. Create tasks in the system")
        else:
            self.stdout.write(self.style.SUCCESS("\n✓ All tests passed!"))
            self.stdout.write("  Notification system appears to be working correctly.")

        self.stdout.write("\n" + "=" * 60)
