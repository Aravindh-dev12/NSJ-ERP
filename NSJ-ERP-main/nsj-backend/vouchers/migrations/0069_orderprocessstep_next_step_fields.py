import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Add next-step deadline, assignee, and linked task to OrderProcessStep.

    NOTE: On fresh installs, migration 0068 already contains these operations
    (merged). This file exists only for environments where 0068 was applied
    before the merge — it is a no-op on fresh installs because Django tracks
    migrations by name, not content.

    These fields are populated when a step is marked as done — the user picks
    a deadline and assignee for the NEXT step, and a Task is auto-created.
    """

    dependencies = [
        ("vouchers", "0068_add_is_draft_to_step_forms"),
        ("tasks", "0007_alter_task_assigned_to_name_alter_task_assignees_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="orderprocessstep",
            name="next_step_deadline",
            field=models.DateField(
                blank=True,
                null=True,
                help_text="Deadline for the next process step (set when marking this step done)",
            ),
        ),
        migrations.AddField(
            model_name="orderprocessstep",
            name="next_step_assignee",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="next_step_assignments",
                to=settings.AUTH_USER_MODEL,
                help_text="User assigned to the next process step",
            ),
        ),
        migrations.AddField(
            model_name="orderprocessstep",
            name="next_step_task",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="triggered_by_step",
                to="tasks.task",
                help_text="Task created for the next step when this step was marked done",
            ),
        ),
    ]
