"""
Management command to backfill task notifications for existing tasks.
This will create notifications for all existing tasks that don't have them.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from tasks.models import Task, TaskNotification
from users.models import User


class Command(BaseCommand):
    help = "Backfill task notifications for existing tasks"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be created without actually creating notifications",
        )
        parser.add_argument(
            "--task-id",
            type=str,
            help="Backfill notifications for a specific task ID only",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        task_id = options.get("task_id")

        self.stdout.write(self.style.SUCCESS("Starting notification backfill..."))

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN MODE - No changes will be made"))

        # Get tasks to process
        if task_id:
            tasks = Task.objects.filter(id=task_id)
            if not tasks.exists():
                self.stdout.write(self.style.ERROR(f"Task with ID {task_id} not found"))
                return
        else:
            tasks = Task.objects.all().select_related("assigned_to", "created_by")

        total_tasks = tasks.count()
        self.stdout.write(f"Processing {total_tasks} tasks...")

        notifications_created = 0
        notifications_skipped = 0
        errors = 0

        for task in tasks:
            try:
                # Determine who should receive notifications for this task
                recipients = set()

                # 1. Assigned user (if exists)
                if task.assigned_to:
                    recipients.add(task.assigned_to)

                # 2. Multiple assignees (if exists)
                try:
                    if hasattr(task, "assignees"):
                        for assignee in task.assignees.all():
                            recipients.add(assignee)
                except Exception:
                    pass  # assignees field might not exist in older versions

                # 3. Creator (if different from assigned users)
                if task.created_by:
                    recipients.add(task.created_by)

                # 4. If assigned_to_name is set, try to find that user
                if task.assigned_to_name and not task.assigned_to:
                    try:
                        user_by_name = User.objects.filter(
                            name__iexact=task.assigned_to_name, company=task.company
                        ).first()
                        if user_by_name:
                            recipients.add(user_by_name)
                    except Exception:
                        pass

                # Create notifications for each recipient
                for user in recipients:
                    # Check if notification already exists
                    existing = TaskNotification.objects.filter(user=user, task=task).exists()

                    if existing:
                        notifications_skipped += 1
                        continue

                    if not dry_run:
                        # Determine message based on user role
                        if user == task.assigned_to or (
                            hasattr(task, "assignees") and user in task.assignees.all()
                        ):
                            message = f"You have been assigned to task: {task.title}"
                        elif user == task.created_by:
                            message = f"Task created: {task.title}"
                        else:
                            message = f"You are involved in task: {task.title}"

                        # Create the notification
                        TaskNotification.objects.create(
                            user=user,
                            task=task,
                            message=message,
                            is_read=False,  # Mark as unread so users see them
                        )
                        notifications_created += 1
                        self.stdout.write(
                            f"  ✓ Created notification for {user.name} on task '{task.title}'"
                        )
                    else:
                        self.stdout.write(
                            f"  [DRY RUN] Would create notification for {user.name} on task '{task.title}'"
                        )
                        notifications_created += 1

            except Exception as e:
                errors += 1
                self.stdout.write(
                    self.style.ERROR(f"  ✗ Error processing task {task.id}: {str(e)}")
                )

        # Summary
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("Backfill Complete!"))
        self.stdout.write(f"Total tasks processed: {total_tasks}")
        self.stdout.write(
            self.style.SUCCESS(f"Notifications created: {notifications_created}")
        )
        self.stdout.write(f"Notifications skipped (already exist): {notifications_skipped}")
        if errors > 0:
            self.stdout.write(self.style.ERROR(f"Errors encountered: {errors}"))

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    "\nThis was a DRY RUN. Run without --dry-run to actually create notifications."
                )
            )
