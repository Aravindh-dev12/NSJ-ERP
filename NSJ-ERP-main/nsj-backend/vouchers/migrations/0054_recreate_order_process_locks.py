# Manual migration to recreate order_process_locks table with correct structure
import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("vouchers", "0053_add_receipt_voucher_to_orderdraft"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Drop the old table
        migrations.RunSQL(
            sql="DROP TABLE IF EXISTS order_process_locks;",
            reverse_sql="",  # Can't reverse a drop
        ),
        # Recreate with correct structure
        migrations.CreateModel(
            name="OrderProcessLock",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "lock_level",
                    models.CharField(
                        choices=[
                            ("UNLOCKED", "Unlocked"),
                            ("LOCKED_FOR_EDIT", "Locked for Edit"),
                            ("FULLY_LOCKED", "Fully Locked"),
                        ],
                        default="LOCKED_FOR_EDIT",
                        max_length=20,
                    ),
                ),
                ("locked_at", models.DateTimeField(auto_now_add=True)),
                ("courier_dispatched", models.BooleanField(default=False)),
                ("courier_dispatched_at", models.DateTimeField(blank=True, null=True)),
                (
                    "locked_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "order",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="process_lock",
                        to="vouchers.order",
                    ),
                ),
            ],
            options={
                "db_table": "order_process_locks",
            },
        ),
    ]
