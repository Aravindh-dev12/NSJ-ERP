import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django.conf import settings
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.models import DjangoJobExecution
from django_apscheduler import util

logger = logging.getLogger(__name__)


def send_task_deadline_reminders():
    """
    Send deadline reminders for tasks due soon.
    This function is called automatically by the scheduler.
    """
    from tasks.models import Task
    from tasks.email_service import TaskEmailService
    from django.utils import timezone
    from datetime import timedelta

    try:
        today = timezone.now().date()
        tomorrow = today + timedelta(days=1)

        # Get pending tasks due today or tomorrow
        tasks = Task.objects.filter(
            status="PENDING", deadline__lte=tomorrow, deadline__gte=today
        ).select_related("assigned_to", "created_by")

        sent_count = 0
        for task in tasks:
            days_until_deadline = (task.deadline - today).days

            success = TaskEmailService.send_task_deadline_reminder_email(
                task=task, days_until_deadline=days_until_deadline
            )

            if success:
                sent_count += 1

        logger.info(f"Task deadline reminders: Sent {sent_count} emails for {tasks.count()} tasks")

    except Exception as e:
        logger.error(f"Error sending task deadline reminders: {e}")


@util.close_old_connections
def delete_old_job_executions(max_age=604_800):
    """
    Delete old job execution records (older than 7 days by default).
    This prevents the database from growing too large.
    """
    DjangoJobExecution.objects.delete_old_job_executions(max_age)


def start_scheduler():
    """
    Start the background scheduler.
    This is called automatically when Django starts.
    """
    scheduler = BackgroundScheduler()
    scheduler.add_jobstore(DjangoJobStore(), "default")

    # Schedule task deadline reminders - runs daily at 9:00 AM
    scheduler.add_job(
        send_task_deadline_reminders,
        trigger=CronTrigger(hour=9, minute=0),  # 9:00 AM every day
        id="send_task_deadline_reminders",
        max_instances=1,
        replace_existing=True,
        name="Send task deadline reminders",
    )

    # Schedule cleanup of old job executions - runs weekly on Sunday at 2:00 AM
    scheduler.add_job(
        delete_old_job_executions,
        trigger=CronTrigger(day_of_week="sun", hour=2, minute=0),
        id="delete_old_job_executions",
        max_instances=1,
        replace_existing=True,
        name="Delete old job execution records",
    )

    try:
        logger.info("Starting task scheduler...")
        scheduler.start()
        logger.info("Task scheduler started successfully!")
        logger.info("- Task deadline reminders: Daily at 9:00 AM")
        logger.info("- Job cleanup: Weekly on Sunday at 2:00 AM")
    except KeyboardInterrupt:
        logger.info("Stopping task scheduler...")
        scheduler.shutdown()
        logger.info("Task scheduler stopped.")
