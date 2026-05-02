# Generated migration for Bagging Ready, Diamond Purchase/Issue, and Gemstone Purchase/Issue

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("vouchers", "0034_add_metal_issue"),
    ]

    operations = [
        migrations.CreateModel(
            name="BaggingReady",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
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
                        upload_to="bagging_ready/carry_forward/",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="bagging_ready",
                        to="core.company",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_bagging_ready",
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
                        related_name="bagging_ready",
                        to="vouchers.order",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_bagging_ready",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "bagging_ready",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="DiamondPurchaseIssue",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
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
                        upload_to="diamond_purchase_issue/carry_forward/",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="diamond_purchase_issue",
                        to="core.company",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_diamond_purchase_issue",
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
                        related_name="diamond_purchase_issue",
                        to="vouchers.order",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_diamond_purchase_issue",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "diamond_purchase_issue",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="GemstonePurchaseIssue",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
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
                        upload_to="gemstone_purchase_issue/carry_forward/",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="gemstone_purchase_issue",
                        to="core.company",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_gemstone_purchase_issue",
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
                        related_name="gemstone_purchase_issue",
                        to="vouchers.order",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_gemstone_purchase_issue",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "gemstone_purchase_issue",
                "ordering": ["-created_at"],
            },
        ),
    ]
