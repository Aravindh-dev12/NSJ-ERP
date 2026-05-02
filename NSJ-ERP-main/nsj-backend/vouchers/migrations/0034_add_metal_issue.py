# Generated migration for Metal Issue

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("core", "0006_add_item_group_master"),
        ("vouchers", "0033_add_final_qc_packing_list_raw_material_tally"),
    ]

    operations = [
        # Create MetalIssue model
        migrations.CreateModel(
            name="MetalIssue",
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
                    "account_order_id",
                    models.CharField(
                        blank=True,
                        help_text="Account & Order ID matching database records",
                        max_length=256,
                        null=True,
                    ),
                ),
                (
                    "carry_forward_image",
                    models.ImageField(
                        blank=True,
                        help_text="Carry-Forward Image",
                        null=True,
                        upload_to="metal_issues/carry_forward/",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="metal_issues",
                        to="core.company",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_metal_issues",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "order",
                    models.ForeignKey(
                        blank=True,
                        help_text="Validated order reference",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="metal_issues",
                        to="vouchers.order",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_metal_issues",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "metal_issues",
                "ordering": ["-created_at"],
            },
        ),
    ]
