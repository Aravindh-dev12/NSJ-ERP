# Generated migration for Final Quality Check, Item Final Packing List, and Raw Material Tally

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("core", "0006_add_item_group_master"),
        ("vouchers", "0032_update_stone_demand_add_pre_rhodium"),
    ]

    operations = [
        # Create FinalQualityCheck model
        migrations.CreateModel(
            name="FinalQualityCheck",
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
                    "final_quality_check",
                    models.BooleanField(
                        default=False,
                        help_text="Final Quality Check (Yes/No)",
                    ),
                ),
                (
                    "final_quality_check_image",
                    models.ImageField(
                        blank=True,
                        help_text="Final Quality Check Image",
                        null=True,
                        upload_to="final_quality_checks/",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="final_quality_checks",
                        to="core.company",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_final_quality_checks",
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
                        related_name="final_quality_checks",
                        to="vouchers.order",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_final_quality_checks",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "final_quality_checks",
                "ordering": ["-created_at"],
            },
        ),
        # Create ItemFinalPackingList model
        migrations.CreateModel(
            name="ItemFinalPackingList",
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
                    "jewellery_piece_image",
                    models.ImageField(
                        blank=True,
                        help_text="Jewellery Piece Image",
                        null=True,
                        upload_to="item_final_packing_lists/",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="item_final_packing_lists",
                        to="core.company",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_item_final_packing_lists",
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
                        related_name="item_final_packing_lists",
                        to="vouchers.order",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_item_final_packing_lists",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "item_final_packing_lists",
                "ordering": ["-created_at"],
            },
        ),
        # Create RawMaterialTally model
        migrations.CreateModel(
            name="RawMaterialTally",
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
                        upload_to="raw_material_tallies/carry_forward/",
                    ),
                ),
                (
                    "raw_material_movement",
                    models.JSONField(
                        blank=True,
                        help_text="Multiple raw material movement records",
                        null=True,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="raw_material_tallies",
                        to="core.company",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_raw_material_tallies",
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
                        related_name="raw_material_tallies",
                        to="vouchers.order",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_raw_material_tallies",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "raw_material_tallies",
                "ordering": ["-created_at"],
            },
        ),
    ]
