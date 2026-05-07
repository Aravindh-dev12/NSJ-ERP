import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from typing import List

logger = logging.getLogger(__name__)


def get_urgency_badge(urgency):
    """Get HTML badge for urgency level"""
    colors = {"LOW": "#4CAF50", "MEDIUM": "#ff9800", "HIGH": "#f44336", "URGENT": "#d32f2f"}
    labels = {"LOW": "🟢 Low", "MEDIUM": "🟡 Medium", "HIGH": "🔴 High", "URGENT": "🔴 URGENT"}
    color = colors.get(urgency, "#888888")
    label = labels.get(urgency, urgency)
    return f'<span style="display: inline-block; padding: 6px 12px; background-color: {color}; color: #ffffff; border-radius: 20px; font-size: 13px; font-weight: 600;">{label}</span>'


def get_status_badge(status):
    """Get HTML badge for status"""
    colors = {
        "PENDING": "#ff9800",
        "COMPLETED": "#4CAF50",
        "STUCK": "#f44336",
        "NEED_FOUNDER": "#9C27B0",
        "TRANSFERRED": "#2196F3",
    }
    color = colors.get(status, "#888888")
    return f'<span style="display: inline-block; padding: 8px 16px; background-color: {color}; color: #ffffff; border-radius: 20px; font-size: 14px; font-weight: 600;">{status}</span>'


def get_task_url(task):
    """Generate URL to task in dashboard"""
    # Update this with your actual frontend URL
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    return f"{frontend_url}/tasks/{task.id}"


class TaskEmailService:
    """Service class for sending task-related emails"""

    @staticmethod
    def send_task_assignment_email(task, assignees: List, assigned_by=None):
        """
        Send email notification when a task is assigned to users.

        Args:
            task: Task instance
            assignees: List of User instances
            assigned_by: User who assigned the task
        """
        if not assignees:
            logger.warning(f"No assignees provided for task {task.id}")
            return False

        # Get recipient emails
        recipient_emails = [user.email for user in assignees if user.email]

        if not recipient_emails:
            logger.warning(f"No valid email addresses for task {task.id} assignees")
            return False

        try:
            # Email subject
            subject = f"New Task Assigned: {task.title}"

            # Prepare template context
            context = {
                "task_title": task.title,
                "task_description": task.description,
                "deadline": task.deadline.strftime("%B %d, %Y"),
                "urgency_badge": get_urgency_badge(task.urgency),
                "department": task.get_department_display(),
                "sub_department": task.get_sub_department_display()
                if task.sub_department
                else None,
                "assigned_by": assigned_by.name if assigned_by else "System",
                "task_url": get_task_url(task),
            }

            # Render HTML template
            html_message = render_to_string("emails/task_assignment.html", context)

            # Plain text fallback
            message = f"""
Hello,

You have been assigned a new task by {context["assigned_by"]}:

Task: {task.title}
Description: {task.description}
Deadline: {context["deadline"]}
Urgency: {task.get_urgency_display()}
Department: {context["department"]}

View task: {context["task_url"]}

---
This is an automated notification from NSJ ERP System.
"""

            # Send email
            email = EmailMultiAlternatives(
                subject=subject,
                body=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=recipient_emails,
            )
            email.attach_alternative(html_message, "text/html")
            email.send(fail_silently=False)

            logger.info(
                f"Task assignment email sent for task {task.id} to {len(recipient_emails)} recipients"
            )
            return True

        except Exception as e:
            logger.error(f"Failed to send task assignment email for task {task.id}: {e}")
            return False

    @staticmethod
    def send_task_status_change_email(task, old_status, new_status, changed_by=None):
        """
        Send email notification when task status changes.

        Args:
            task: Task instance
            old_status: Previous status
            new_status: New status
            changed_by: User who changed the status
        """
        # Get all assignees
        assignees = task.get_all_assignees()
        recipient_emails = [user.email for user in assignees if user.email]

        # Also notify the creator if different from assignees
        if task.created_by and task.created_by.email:
            if task.created_by.email not in recipient_emails:
                recipient_emails.append(task.created_by.email)

        if not recipient_emails:
            logger.warning(
                f"No valid email addresses for task {task.id} status change notification"
            )
            return False

        try:
            changed_by_name = changed_by.name if changed_by else "System"
            subject = f"Task Status Updated: {task.title}"

            # Prepare template context
            context = {
                "task_title": task.title,
                "old_status": old_status,
                "new_status_badge": get_status_badge(new_status),
                "changed_by": changed_by_name,
                "changed_at": timezone.now().strftime("%B %d, %Y at %I:%M %p"),
                "deadline": task.deadline.strftime("%B %d, %Y"),
                "urgency_badge": get_urgency_badge(task.urgency),
                "department": task.get_department_display(),
                "task_url": get_task_url(task),
            }

            # Render HTML template
            html_message = render_to_string("emails/task_status_change.html", context)

            # Plain text fallback
            message = f"""
Hello,

The status of task "{task.title}" has been updated by {changed_by_name}:

Old Status: {old_status}
New Status: {new_status}
Changed At: {context["changed_at"]}

Task Details:
- Deadline: {context["deadline"]}
- Urgency: {task.get_urgency_display()}

View task: {context["task_url"]}

---
This is an automated notification from NSJ ERP System.
"""

            email = EmailMultiAlternatives(
                subject=subject,
                body=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=recipient_emails,
            )
            email.attach_alternative(html_message, "text/html")
            email.send(fail_silently=False)

            logger.info(
                f"Task status change email sent for task {task.id} to {len(recipient_emails)} recipients"
            )
            return True

        except Exception as e:
            logger.error(f"Failed to send task status change email for task {task.id}: {e}")
            return False

    @staticmethod
    def send_task_deadline_reminder_email(task, days_until_deadline):
        """
        Send email reminder for upcoming task deadline.

        Args:
            task: Task instance
            days_until_deadline: Number of days until deadline
        """
        assignees = task.get_all_assignees()
        recipient_emails = [user.email for user in assignees if user.email]

        if not recipient_emails:
            logger.warning(f"No valid email addresses for task {task.id} deadline reminder")
            return False

        try:
            if days_until_deadline == 0:
                urgency_text = "⚠️ YOUR TASK IS DUE TODAY"
                subject = f"⚠️ URGENT: Task Due Today - {task.title}"
            elif days_until_deadline == 1:
                urgency_text = "⚠️ YOUR TASK IS DUE TOMORROW"
                subject = f"⚠️ Task Due Tomorrow - {task.title}"
            else:
                urgency_text = f"⚠️ YOUR TASK IS DUE IN {days_until_deadline} DAYS"
                subject = f"Reminder: Task Due Soon - {task.title}"

            # Prepare template context
            context = {
                "task_title": task.title,
                "task_description": task.description,
                "deadline": task.deadline.strftime("%B %d, %Y"),
                "urgency_text": urgency_text,
                "urgency_badge": get_urgency_badge(task.urgency),
                "status_badge": get_status_badge(task.status),
                "department": task.get_department_display(),
                "task_url": get_task_url(task),
            }

            # Render HTML template
            html_message = render_to_string("emails/task_deadline_reminder.html", context)

            # Plain text fallback
            message = f"""
Hello,

{urgency_text}

Task: {task.title}
Description: {task.description}
Deadline: {context["deadline"]}
Urgency: {task.get_urgency_display()}
Current Status: {task.get_status_display()}

Please ensure you complete this task on time.

View task: {context["task_url"]}

---
This is an automated reminder from NSJ ERP System.
"""

            email = EmailMultiAlternatives(
                subject=subject,
                body=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=recipient_emails,
            )
            email.attach_alternative(html_message, "text/html")
            email.send(fail_silently=False)

            logger.info(
                f"Task deadline reminder email sent for task {task.id} to {len(recipient_emails)} recipients"
            )
            return True

        except Exception as e:
            logger.error(f"Failed to send task deadline reminder email for task {task.id}: {e}")
            return False

    @staticmethod
    def send_task_comment_email(task, comment_text, commented_by):
        """
        Send email notification when someone comments on a task.

        Args:
            task: Task instance
            comment_text: The comment text
            commented_by: User who made the comment
        """
        # Notify all assignees except the commenter
        assignees = task.get_all_assignees()
        recipient_emails = [user.email for user in assignees if user.email and user != commented_by]

        # Also notify creator if different
        if task.created_by and task.created_by.email and task.created_by != commented_by:
            if task.created_by.email not in recipient_emails:
                recipient_emails.append(task.created_by.email)

        if not recipient_emails:
            return False

        try:
            subject = f"New Comment on Task: {task.title}"

            # Prepare template context
            context = {
                "task_title": task.title,
                "commented_by": commented_by.name,
                "commenter_initial": commented_by.name[0].upper() if commented_by.name else "?",
                "commented_at": timezone.now().strftime("%B %d, %Y at %I:%M %p"),
                "comment_text": comment_text,
                "status_badge": get_status_badge(task.status),
                "deadline": task.deadline.strftime("%B %d, %Y"),
                "department": task.get_department_display(),
                "task_url": get_task_url(task),
            }

            # Render HTML template
            html_message = render_to_string("emails/task_comment.html", context)

            # Plain text fallback
            message = f"""
Hello,

{commented_by.name} has commented on task "{task.title}":

Comment: {comment_text}

Task Details:
- Status: {task.get_status_display()}
- Deadline: {context["deadline"]}

View and reply: {context["task_url"]}

---
This is an automated notification from NSJ ERP System.
"""

            email = EmailMultiAlternatives(
                subject=subject,
                body=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=recipient_emails,
            )
            email.attach_alternative(html_message, "text/html")
            email.send(fail_silently=False)

            logger.info(
                f"Task comment email sent for task {task.id} to {len(recipient_emails)} recipients"
            )
            return True

        except Exception as e:
            logger.error(f"Failed to send task comment email for task {task.id}: {e}")
            return False
