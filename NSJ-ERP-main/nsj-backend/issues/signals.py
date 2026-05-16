"""
Issues App Signals - Auto-Triggers for Order-Based Automation

Phase 2: Auto-Triggers
- When query converted to order → auto-notify production dept
- When order issued → auto-create production milestones/tasks
"""

import logging
import sys
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import Query, OrderIssue

logger = logging.getLogger(__name__)

# Log that signals module is being loaded
print("[SIGNALS INIT] issues/signals.py is being loaded!", file=sys.stderr)
logger.info("[SIGNALS INIT] issues/signals.py is being loaded!")


# ============================================================================
# Query Conversion Triggers
# ============================================================================


@receiver(pre_save, sender=Query)
def track_query_status_change(sender, instance, **kwargs):
    """Track when query status changes"""
    if instance.pk:
        try:
            old_instance = Query.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except Query.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=Query)
def handle_query_conversion(sender, instance, created, **kwargs):
    """
    When a query is converted to an order, notify the production department.
    """
    if not created and hasattr(instance, "_old_status"):
        # Check if status changed to 'converted_to_order'
        if instance._old_status != "converted_to_order" and instance.status == "converted_to_order":
            logger.info(
                f"Query {instance.id} converted to order - triggering production notification"
            )

            try:
                from tasks.signals import notify_production_department

                notify_production_department(instance)
            except Exception as e:
                logger.error(f"Failed to notify production department: {e}")


# ============================================================================
# Order Issue Triggers
# ============================================================================


@receiver(post_save, sender=OrderIssue)
def handle_order_issue_creation(sender, instance, created, **kwargs):
    """
    When an order issue is created, auto-create production milestone tasks.
    """
    import sys
    import traceback

    # Always log to stderr for Railway visibility
    print("[SIGNAL DEBUG] OrderIssue post_save signal received!", file=sys.stderr)
    print(f"[SIGNAL DEBUG] created={created}, instance.id={instance.id}", file=sys.stderr)
    print(f"[SIGNAL DEBUG] instance.created_by={instance.created_by}", file=sys.stderr)

    logger.info(f"[SIGNAL] OrderIssue post_save triggered - created={created}, id={instance.id}")

    if created:
        print(
            f"[SIGNAL] Order issue {instance.id} created - triggering production task creation",
            file=sys.stderr,
        )
        logger.info(f"Order issue {instance.id} created - triggering production task creation")

        try:
            from tasks.signals import create_production_tasks_for_order

            print("[SIGNAL] Calling create_production_tasks_for_order...", file=sys.stderr)
            tasks = create_production_tasks_for_order(instance, created_by=instance.created_by)
            print(
                f"[SIGNAL] Created {len(tasks) if tasks else 0} tasks for order issue {instance.id}",
                file=sys.stderr,
            )
            logger.info(f"Created {len(tasks) if tasks else 0} tasks for order issue {instance.id}")
        except Exception as e:
            print(f"[SIGNAL ERROR] Failed to create production tasks: {e}", file=sys.stderr)
            print(traceback.format_exc(), file=sys.stderr)
            logger.error(f"Failed to create production tasks: {e}")
            logger.error(traceback.format_exc())
    else:
        print("[SIGNAL DEBUG] Not a new creation, skipping task creation", file=sys.stderr)
