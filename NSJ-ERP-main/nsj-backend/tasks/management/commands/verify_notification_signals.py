"""
Management command to verify that notification signals are working correctly.
Creates test tasks and verifies notifications are auto-generated.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from tasks.models import Task, TaskNotification
from users.models import User
from core.models import Company
from datetime import date, timedelta
import time


class Command(BaseCommand):
    help = "Verify notification signals are working by creating test tasks"

    def add_arguments(self, parser):
        parser.add_argument(
            "--cleanup",
            action="store_true",
            help="Clean up test tasks and notifications after verification",
        )

    def handle(self, *args, **options):
        cleanup = options["cleanup"]

        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("NOTIFICATION SIGNAL VERIFICATION"))
        self.stdout.write(self.style.SUCCESS("=" * 60))

        # Get company and users
        company = Company.objects.first()
        if not company:
            self.stdout.write(self.style.ERROR("No company found. Cannot create test tasks."))
            return

        users = User.objects.filter(company=company)[:3]
        if users.count() < 2:
            self.stdout.write(
                self.style.ERROR("Need at least 2 users to test. Please create more users.")
            )
            return

        creator = users[0]
        assignee1 = users[1]
        assignee2 = users[2] if users.count() > 2 else users[1]

        self.stdout.write(f"\nUsing company: {company.name}")
        self.stdout.write(f"Creator: {creator.name} ({creator.email})")
        self.stdout.write(f"Assignee 1: {assignee1.name} ({assignee1.email})")
        self.stdout.write(f"Assignee 2: {assignee2.name} ({assignee2.email})")

        test_tasks = []
        test_notifications = []

        try:
            # Test 1: Single assignee task
            self.stdout.write("\n" + "=" * 60)
            self.stdout.write("TEST 1: Task with single assignee")
            self.stdout.write("=" * 60)

            task1 = Task.objects.create(
                company=company,
                title="TEST 1: Single Assignee Task",
                description="This task should create notifications for assignee and creator",
                department="ADMINISTRATION",
                deadline=date.today() + timedelta(days=7),
                urgency="MEDIUM",
                assigned_to=assignee1,
                created_by=creator,
                status="PENDING",
            )
            test_tasks.append(task1)

            # Wait for signal to process
            time.sleep(0.5)

            # Check notifications
            notifications = TaskNotification.objects.filter(task=task1)
            self.stdout.write(f"\nTask created: {task1.id}")
            self.stdout.write(f"Notifications created: {notifications.count()}")

            if notifications.count() >= 1:
                self.stdout.write(self.style.SUCCESS("✓ PASS: Notifications created"))
                for notif in notifications:
                    self.stdout.write(f"  - {notif.user.name}: {notif.message}")
                    test_notifications.append(notif)
            else:
                self.stdout.write(
                    self.style.ERROR("✗ FAIL: No notifications created for single assignee task")
                )

            # Test 2: Multiple assignees task
            self.stdout.write("\n" + "=" * 60)
            self.stdout.write("TEST 2: Task with multiple assignees")
            self.stdout.write("=" * 60)

            task2 = Task.objects.create(
                company=company,
                title="TEST 2: Multiple Assignees Task",
                description="This task should create notifications for all assignees and creator",
                department="PRODUCTION",
                deadline=date.today() + timedelta(days=7),
                urgency="HIGH",
                created_by=creator,
                status="PENDING",
            )
            test_tasks.append(task2)

            # Add multiple assignees
            task2.assignees.add(assignee1, assignee2)

            # Wait for signal to process
            time.sleep(0.5)

            # Check notifications
            notifications = TaskNotification.objects.filter(task=task2)
            self.stdout.write(f"\nTask created: {task2.id}")
            self.stdout.write(f"Assignees added: {assignee1.name}, {assignee2.name}")
            self.stdout.write(f"Notifications created: {notifications.count()}")

            if notifications.count() >= 2:
                self.stdout.write(self.style.SUCCESS("✓ PASS: Notifications created for multiple assignees"))
                for notif in notifications:
                    self.stdout.write(f"  - {notif.user.name}: {notif.message}")
                    test_notifications.append(notif)
            else:
                self.stdout.write(
                    self.style.ERROR(
                        "✗ FAIL: Not enough notifications for multiple assignees task"
                    )
                )

            # Test 3: Task with same creator and assignee
            self.stdout.write("\n" + "=" * 60)
            self.stdout.write("TEST 3: Task where creator = assignee")
            self.stdout.write("=" * 60)

            task3 = Task.objects.create(
                company=company,
                title="TEST 3: Self-Assigned Task",
                description="This task should create only one notification (no duplicate)",
                department="SALES",
                deadline=date.today() + timedelta(days=7),
                urgency="LOW",
                assigned_to=creator,
                created_by=creator,
                status="PENDING",
            )
            test_tasks.append(task3)

            # Wait for signal to process
            time.sleep(0.5)

            # Check notifications
            notifications = TaskNotification.objects.filter(task=task3)
            self.stdout.write(f"\nTask created: {task3.id}")
            self.stdout.write(f"Creator = Assignee: {creator.name}")
            self.stdout.write(f"Notifications created: {notifications.count()}")

            if notifications.count() == 1:
                self.stdout.write(
                    self.style.SUCCESS("✓ PASS: Only one notification (no duplicate)")
                )
                for notif in notifications:
                    self.stdout.write(f"  - {notif.user.name}: {notif.message}")
                    test_notifications.append(notif)
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f"⚠ WARNING: Expected 1 notification, got {notifications.count()}"
                    )
                )

            # Summary
            self.stdout.write("\n" + "=" * 60)
            self.stdout.write(self.style.SUCCESS("VERIFICATION SUMMARY"))
            self.stdout.write("=" * 60)

            total_tasks = len(test_tasks)
            total_notifications = len(test_notifications)

            self.stdout.write(f"\nTest tasks created: {total_tasks}")
            self.stdout.write(f"Total notifications created: {total_notifications}")

            if total_notifications >= total_tasks:
                self.stdout.write(
                    self.style.SUCCESS(
                        "\n✓ SUCCESS: Notification signals are working correctly!"
                    )
                )
                self.stdout.write("  Tasks automatically create notifications for assigned users.")
            else:
                self.stdout.write(
                    self.style.ERROR(
                        "\n✗ FAILURE: Notification signals are NOT working properly!"
                    )
                )
                self.stdout.write("  Some tasks did not create notifications.")
                self.stdout.write("\n  Possible issues:")
                self.stdout.write("    1. Signals not registered in tasks/apps.py")
                self.stdout.write("    2. Signal receivers have errors")
                self.stdout.write("    3. Database transaction issues")

            # Cleanup
            if cleanup:
                self.stdout.write("\n" + "=" * 60)
                self.stdout.write("CLEANUP")
                self.stdout.write("=" * 60)

                # Delete test notifications
                deleted_notifs = TaskNotification.objects.filter(
                    id__in=[n.id for n in test_notifications]
                ).delete()
                self.stdout.write(f"Deleted {deleted_notifs[0]} test notifications")

                # Delete test tasks
                deleted_tasks = Task.objects.filter(id__in=[t.id for t in test_tasks]).delete()
                self.stdout.write(f"Deleted {deleted_tasks[0]} test tasks")

                self.stdout.write(self.style.SUCCESS("\n✓ Cleanup complete"))
            else:
                self.stdout.write("\n" + "=" * 60)
                self.stdout.write("NOTE: Test tasks and notifications were NOT deleted.")
                self.stdout.write("Run with --cleanup flag to remove them:")
                self.stdout.write("  python manage.py verify_notification_signals --cleanup")
                self.stdout.write("=" * 60)

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n✗ ERROR during verification: {e}"))
            import traceback

            self.stdout.write(traceback.format_exc())

            # Cleanup on error
            if test_tasks:
                self.stdout.write("\nCleaning up test data due to error...")
                Task.objects.filter(id__in=[t.id for t in test_tasks]).delete()
