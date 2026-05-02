import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("vouchers", "0066_increase_origin_type_max_length"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="orderprocessstep",
            name="marked_done_at",
            field=models.DateTimeField(
                blank=True,
                help_text="When the step was marked as done (COMPLETED)",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="orderprocessstep",
            name="marked_done_by",
            field=models.ForeignKey(
                blank=True,
                help_text="User who marked the step as done",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="completed_process_steps",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="orderprocessstep",
            name="saved_at",
            field=models.DateTimeField(
                blank=True, help_text="When the step was saved (IN_PROGRESS)", null=True
            ),
        ),
        migrations.AddField(
            model_name="orderprocessstep",
            name="saved_by",
            field=models.ForeignKey(
                blank=True,
                help_text="User who saved the step",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="saved_process_steps",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
