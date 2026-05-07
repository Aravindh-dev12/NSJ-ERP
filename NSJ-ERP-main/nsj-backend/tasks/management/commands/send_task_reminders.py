from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from tasks.models import Task
from tasks.email_service import TaskEmailService


class Command(BaseCommand):
    help = "Send email reminders for upcoming task deadlines"

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=1,
            help="Send reminders for tasks due within this many days (default: 1)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be sent without actually sending emails",
        )

    def handle(self, *args, **options):
        days = options["days"]
        dry_run = options["dry_run"]

        today = timezone.now().date()
        target_date = today + timedelta(days=days)

        self.stdout.write(f"Checking for tasks due on or before {target_date}...")

        # Get pending tasks with upcoming deadlines
        tasks = Task.objects.filter(
            status="PENDING", deadline__lte=target_date, deadline__gte=today
        ).select_related("assigned_to", "created_by")

        total_tasks = tasks.count()
        self.stdout.write(f"Found {total_tasks} tasks with upcoming deadlines")

        sent_count = 0
        failed_count = 0

        for task in tasks:
            days_until_deadline = (task.deadline - today).days

            if dry_run:
                assignees = task.get_all_assignees()
                assignee_emails = [u.email for u in assignees if u.email]
                self.stdout.write(
                    f'  [DRY RUN] Would send reminder for task "{task.title}" '
                    f"(due in {days_until_deadline} days) to: {', '.join(assignee_emails)}"
                )
                sent_count += 1
            else:
                try:
                    success = TaskEmailService.send_task_deadline_reminder_email(
                        task=task, days_until_deadline=days_until_deadline
                    )

                    if success:
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'  ✓ Sent reminder for task "{task.title}" (due in {days_until_deadline} days)'
                            )
                        )
                        sent_count += 1
                    else:
                        self.stdout.write(
                            self.style.WARNING(f'  ⚠ No recipients for task "{task.title}"')
                        )

                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(
                            f'  ✗ Failed to send reminder for task "{task.title}": {e}'
                        )
                    )
                    failed_count += 1

        # Summary
        self.stdout.write("\n" + "=" * 60)
        if dry_run:
            self.stdout.write(self.style.SUCCESS(f"DRY RUN COMPLETE"))
            self.stdout.write(f"Would send {sent_count} reminder emails")
        else:
            self.stdout.write(self.style.SUCCESS(f"REMINDER EMAILS SENT"))
            self.stdout.write(f"Successfully sent: {sent_count}")
            if failed_count > 0:
                self.stdout.write(self.style.ERROR(f"Failed: {failed_count}"))
        self.stdout.write("=" * 60)
