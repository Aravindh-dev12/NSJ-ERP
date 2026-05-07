"""
Task Management Signals - Auto-Triggers & Automation

Phase 2: Auto-Triggers
- When query converted to order → auto-notify production dept
- When order issued → auto-create production milestones/tasks
- Email notifications for task assignments and status changes
"""

import logging
from django.db.models.signals import post_save, pre_save, m2m_changed
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta

from .models import Task, TaskNotification, TaskStatusHistory
from .email_service import TaskEmailService

logger = logging.getLogger(__name__)


# ============================================================================
# Task Status Change Tracking
# ============================================================================


@receiver(pre_save, sender=Task)
def track_task_status_change(sender, instance, **kwargs):
    """Track when task status changes for history"""
    if instance.pk:
        try:
            old_instance = Task.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except Task.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=Task)
def create_task_status_history(sender, instance, created, **kwargs):
    """Create status history entry when task status changes and send email notifications"""
    if created:
        # New task - create initial status history
        TaskStatusHistory.objects.create(
            task=instance,
            old_status=None,
            new_status=instance.status,
            changed_by=instance.created_by,
            notes="Task created",
        )

        # Send email notification for new task assignment
        assignees = instance.get_all_assignees()
        if assignees:
            TaskEmailService.send_task_assignment_email(
                task=instance, assignees=assignees, assigned_by=instance.created_by
            )

    elif hasattr(instance, "_old_status") and instance._old_status != instance.status:
        # Status changed - create history entry
        TaskStatusHistory.objects.create(
            task=instance,
            old_status=instance._old_status,
            new_status=instance.status,
            changed_by=None,  # Will be set by the view if available
            notes="",
        )

        # Update completed_at timestamp
        if instance.status == "COMPLETED" and not instance.completed_at:
            instance.completed_at = timezone.now()
            Task.objects.filter(pk=instance.pk).update(completed_at=instance.completed_at)

        # Send email notification for status change
        TaskEmailService.send_task_status_change_email(
            task=instance,
            old_status=instance._old_status,
            new_status=instance.status,
            changed_by=None,  # Will be updated by view if available
        )


@receiver(post_save, sender=Task)
def notify_task_assignment(sender, instance, created, **kwargs):
    """
    Notify users when task is created or assigned.
    Creates notifications for:
    - Assigned user (assigned_to)
    - Task creator (created_by)
    - Multiple assignees (will be handled by m2m_changed signal)
    """
    if created:
        notifications_created = []

        # Notify assigned user (single assignment)
        if instance.assigned_to:
            try:
                TaskNotification.objects.create(
                    user=instance.assigned_to,
                    task=instance,
                    message=f"New task assigned: {instance.title}",
                )
                notifications_created.append(instance.assigned_to.name)
            except Exception as e:
                logger.error(
                    f"Failed to create notification for assigned_to {instance.assigned_to.id}: {e}"
                )

        # Notify task creator (if different from assigned user)
        if instance.created_by and instance.created_by != instance.assigned_to:
            try:
                TaskNotification.objects.create(
                    user=instance.created_by,
                    task=instance,
                    message=f"Task created: {instance.title}",
                )
                notifications_created.append(instance.created_by.name)
            except Exception as e:
                logger.error(
                    f"Failed to create notification for created_by {instance.created_by.id}: {e}"
                )

        # Log notification creation
        if notifications_created:
            logger.info(
                f"Created notifications for task {instance.id} ({instance.title}) - Recipients: {', '.join(notifications_created)}"
            )
        else:
            logger.warning(
                f"No notifications created for task {instance.id} ({instance.title}) - No assigned users"
            )


@receiver(m2m_changed, sender=Task.assignees.through)
def notify_multiple_assignees(sender, instance, action, pk_set, **kwargs):
    """
    Send notifications when multiple assignees are added.
    Creates both email and in-app notifications.
    """
    if action == "post_add" and pk_set:
        from users.models import User

        new_assignees = User.objects.filter(pk__in=pk_set)

        # Send email to newly added assignees
        try:
            TaskEmailService.send_task_assignment_email(
                task=instance, assignees=list(new_assignees), assigned_by=instance.created_by
            )
        except Exception as e:
            logger.error(f"Failed to send email for task {instance.id}: {e}")

        # Create in-app notifications for each new assignee
        notifications_created = []
        for user in new_assignees:
            try:
                # Check if notification already exists to avoid duplicates
                existing = TaskNotification.objects.filter(user=user, task=instance).exists()
                if not existing:
                    TaskNotification.objects.create(
                        user=user,
                        task=instance,
                        message=f"You have been assigned to task: {instance.title}",
                    )
                    notifications_created.append(user.name)
            except Exception as e:
                logger.error(f"Failed to create notification for user {user.id}: {e}")

        if notifications_created:
            logger.info(
                f"Created notifications for multiple assignees on task {instance.id} - Recipients: {', '.join(notifications_created)}"
            )


# ============================================================================
# Order-Based Auto-Triggers (Phase 2)
# ============================================================================


def create_production_tasks_for_order(order_issue, created_by=None):
    """
    Auto-create production milestone tasks when an order issue is created.

    Production workflow tasks:
    1. Material Sourcing (Raw Material Inventory)
    2. Design Approval (Product Design)
    3. Manufacturing (Production)
    4. Quality Check (Production)
    5. Finishing (Production)
    6. Packaging & Dispatch (Logistics)
    """
    import sys
    from core.models import Company
    from users.models import User

    print(
        f"[TASK CREATION] Starting task creation for order issue {order_issue.id}", file=sys.stderr
    )

    company = Company.objects.first()
    if not company:
        print("[TASK CREATION ERROR] No company found for auto-task creation", file=sys.stderr)
        logger.warning("No company found for auto-task creation")
        return []

    print(f"[TASK CREATION] Using company: {company.name}", file=sys.stderr)

    # Base deadline from order
    base_date = timezone.now().date()

    # Define production milestones
    milestones = [
        {
            "title": f"Material Sourcing - Order {order_issue.order.bill_no if order_issue.order else 'N/A'}",
            "description": f"Source raw materials for order.\nItem: {order_issue.item_name.name if order_issue.item_name else 'N/A'}\nMetal: {order_issue.metal or 'N/A'}",
            "department": "RAW_MATERIAL_INVENTORY",
            "sub_department": "DAILY_IN_OUT",
            "deadline_days": 2,
            "urgency": "HIGH",
        },
        {
            "title": f"Design Verification - Order {order_issue.order.bill_no if order_issue.order else 'N/A'}",
            "description": f"Verify design specifications.\nSize: {order_issue.total_size or 'N/A'}\nFinish: {order_issue.final_finish or 'N/A'}",
            "department": "PRODUCT_DESIGN",
            "sub_department": "2D_DESIGN",
            "deadline_days": 3,
            "urgency": "MEDIUM",
        },
        {
            "title": f"Manufacturing - Order {order_issue.order.bill_no if order_issue.order else 'N/A'}",
            "description": f"Begin manufacturing process.\nProng Style: {order_issue.prong_style or 'N/A'}\nLocking: {order_issue.locking_system or 'N/A'}",
            "department": "PRODUCTION",
            "sub_department": "CUSTOM_JEWELLERY",
            "deadline_days": 7,
            "urgency": "HIGH",
        },
        {
            "title": f"Quality Check - Order {order_issue.order.bill_no if order_issue.order else 'N/A'}",
            "description": f"Perform quality inspection.\nRhodium: {order_issue.rhodium_instructions or 'N/A'}",
            "department": "PRODUCTION",
            "sub_department": "VENDOR_HANDLING",
            "deadline_days": 8,
            "urgency": "HIGH",
        },
        {
            "title": f"Final Finishing - Order {order_issue.order.bill_no if order_issue.order else 'N/A'}",
            "description": f"Apply final finish and polish.\nBase Color: {order_issue.base_metal_colour or 'N/A'}",
            "department": "PRODUCTION",
            "sub_department": "CUSTOM_JEWELLERY",
            "deadline_days": 9,
            "urgency": "MEDIUM",
        },
        {
            "title": f"Packaging & Dispatch - Order {order_issue.order.bill_no if order_issue.order else 'N/A'}",
            "description": f"Package and prepare for dispatch.\nAdditional Notes: {order_issue.additional_notes or 'None'}",
            "department": "LOGISTICS",
            "sub_department": "LOCAL",
            "deadline_days": 10,
            "urgency": "MEDIUM",
        },
    ]

    created_tasks = []

    for milestone in milestones:
        # Find appropriate assignee (department head)
        # First try to find a department head for the specific department
        assignee = User.objects.filter(
            department=milestone["department"], task_role__in=["DEPT_HEAD", "SUB_DEPT_HEAD"]
        ).first()

        # If no department head found, try to find the founder (Niti) as fallback
        if not assignee:
            assignee = User.objects.filter(task_role="FOUNDER").first()

        print(
            f"[TASK CREATION] Creating task: {milestone['title']}, assignee: {assignee.name if assignee else 'None'}",
            file=sys.stderr,
        )

        try:
            task = Task.objects.create(
                company=company,
                title=milestone["title"],
                description=milestone["description"],
                department=milestone["department"],
                sub_department=milestone["sub_department"],
                deadline=base_date + timedelta(days=milestone["deadline_days"]),
                urgency=milestone["urgency"],
                assigned_to=assignee,
                assigned_to_name=assignee.name if assignee else None,
                created_by=created_by,
                output_medium="Order completion milestone",
                status="PENDING",
            )
            created_tasks.append(task)
            print(f"[TASK CREATION] Task created: {task.id}", file=sys.stderr)

            # Notify assignee
            if assignee:
                TaskNotification.objects.create(
                    user=assignee, task=task, message=f"Auto-assigned production task: {task.title}"
                )
        except Exception as e:
            print(
                f"[TASK CREATION ERROR] Failed to create task {milestone['title']}: {e}",
                file=sys.stderr,
            )
            logger.error(f"Failed to create task {milestone['title']}: {e}")

    print(
        f"[TASK CREATION] Created {len(created_tasks)} production tasks for order issue {order_issue.id}",
        file=sys.stderr,
    )
    logger.info(f"Created {len(created_tasks)} production tasks for order issue {order_issue.id}")
    return created_tasks


def notify_production_department(query, order=None):
    """
    Notify production department when a query is converted to an order.
    """
    from users.models import User

    # Find production department head
    production_head = User.objects.filter(department="PRODUCTION", task_role="DEPT_HEAD").first()

    if not production_head:
        logger.warning("No production department head found for notification")
        return None

    # Create a notification task for production
    from core.models import Company

    company = Company.objects.first()

    if not company:
        return None

    item_name = (
        query.item_name.name if query.item_name else query.item_name_custom or "Unknown Item"
    )
    account_name = query.account.account_name if query.account else "Unknown Customer"

    task = Task.objects.create(
        company=company,
        title=f"New Order Alert - {item_name}",
        description=f"Query converted to order.\n\nCustomer: {account_name}\nItem: {item_name}\nGold Carat: {query.gold_carat}\nSize: {query.size}\n\nPlease review and prepare for production.",
        department="PRODUCTION",
        sub_department="CUSTOM_JEWELLERY",
        deadline=timezone.now().date() + timedelta(days=1),
        urgency="HIGH",
        assigned_to=production_head,
        assigned_to_name=production_head.name,
        created_by=query.created_by,
        output_medium="Production preparation",
        status="PENDING",
    )

    # Create notification
    TaskNotification.objects.create(
        user=production_head,
        task=task,
        message=f"New order received: {item_name} for {account_name}",
    )

    logger.info(f"Notified production department about query {query.id} conversion")
    return task
