# Generated migration for Stone Demand to Bagging updates and Pre-Rhodium Quality Check

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("core", "0006_add_item_group_master"),
        ("vouchers", "0031_add_ghat_quality_check_and_stone_demand"),
    ]

    operations = [
        # Add new fields to StoneDemandToBagging
        migrations.AddField(
            model_name="stonedemandtobagging",
            name="diamond_color_stone",
            field=models.CharField(
                blank=True,
                help_text="Diamond/Color Stone",
                max_length=256,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="stonedemandtobagging",
            name="batch_id",
            field=models.CharField(
                blank=True,
                help_text="Batch ID from Batch ID Master",
                max_length=128,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="stonedemandtobagging",
            name="master_size",
            field=models.CharField(
                blank=True,
                help_text="Master Size",
                max_length=128,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="stonedemandtobagging",
            name="shape",
            field=models.CharField(
                blank=True,
                choices=[
                    ("ROUND", "Round"),
                    ("PRINCESS", "Princess"),
                    ("OVAL", "Oval"),
                    ("CUSHION", "Cushion"),
                    ("EMERALD", "Emerald"),
                    ("PEAR", "Pear"),
                    ("MARQUISE", "Marquise"),
                    ("RADIANT", "Radiant"),
                    ("ASSCHER", "Asscher"),
                    ("HEART", "Heart"),
                    ("TRILLION", "Trillion"),
                    ("BAGUETTE", "Baguette"),
                    ("ROSE_CUT", "Rose Cut"),
                    ("OLD_MINE_CUT", "Old Mine Cut"),
                    ("OLD_EUROPEAN_CUT", "Old European Cut"),
                ],
                help_text="Shape of the stone",
                max_length=64,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="stonedemandtobagging",
            name="mm_size",
            field=models.CharField(
                blank=True,
                help_text="MM Size",
                max_length=64,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="stonedemandtobagging",
            name="no_of_pieces",
            field=models.IntegerField(
                blank=True,
                help_text="Number of pieces (1-100)",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="stonedemandtobagging",
            name="estimated_total_carat_weight",
            field=models.DecimalField(
                blank=True,
                decimal_places=3,
                help_text="Estimated Total Carat Weight",
                max_digits=10,
                null=True,
            ),
        ),
        # Create PreRhodiumQualityCheck model
        migrations.CreateModel(
            name="PreRhodiumQualityCheck",
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
                    "quality_check",
                    models.BooleanField(
                        default=False,
                        help_text="Quality Check (Yes/No)",
                    ),
                ),
                (
                    "quality_check_image",
                    models.ImageField(
                        blank=True,
                        help_text="Quality Check Image",
                        null=True,
                        upload_to="pre_rhodium_quality_checks/",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="pre_rhodium_quality_checks",
                        to="core.company",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_pre_rhodium_quality_checks",
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
                        related_name="pre_rhodium_quality_checks",
                        to="vouchers.order",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_pre_rhodium_quality_checks",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "pre_rhodium_quality_checks",
                "ordering": ["-created_at"],
            },
        ),
    ]
