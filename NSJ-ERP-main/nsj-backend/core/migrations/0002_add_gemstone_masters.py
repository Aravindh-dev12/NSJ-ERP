# Generated migration for gemstone master tables

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        # Create GemstoneMaster
        migrations.CreateModel(
            name="GemstoneMaster",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                ("code", models.CharField(blank=True, max_length=50, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="gemstones",
                        to="core.company",
                    ),
                ),
            ],
            options={
                "db_table": "gemstone_master",
                "ordering": ["name"],
            },
        ),
        # Create GemstoneShapeMaster
        migrations.CreateModel(
            name="GemstoneShapeMaster",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("name", models.CharField(max_length=50)),
                ("code", models.CharField(blank=True, max_length=20, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="gemstone_shapes",
                        to="core.company",
                    ),
                ),
            ],
            options={
                "db_table": "gemstone_shape_master",
                "ordering": ["name"],
            },
        ),
        # Create GemstoneColorMaster
        migrations.CreateModel(
            name="GemstoneColorMaster",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("name", models.CharField(max_length=50)),
                ("code", models.CharField(blank=True, max_length=20, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="gemstone_colors",
                        to="core.company",
                    ),
                ),
            ],
            options={
                "db_table": "gemstone_color_master",
                "ordering": ["name"],
            },
        ),
        # Create GemstoneClarityMaster
        migrations.CreateModel(
            name="GemstoneClarityMaster",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("name", models.CharField(max_length=10)),
                ("code", models.CharField(blank=True, max_length=10, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="gemstone_clarities",
                        to="core.company",
                    ),
                ),
            ],
            options={
                "db_table": "gemstone_clarity_master",
                "ordering": ["name"],
            },
        ),
        # Create GemstoneTreatmentMaster
        migrations.CreateModel(
            name="GemstoneTreatmentMaster",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("name", models.CharField(max_length=50)),
                ("code", models.CharField(blank=True, max_length=20, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="gemstone_treatments",
                        to="core.company",
                    ),
                ),
            ],
            options={
                "db_table": "gemstone_treatment_master",
                "ordering": ["name"],
            },
        ),
        # Create OriginMaster
        migrations.CreateModel(
            name="OriginMaster",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("name", models.CharField(max_length=50)),
                (
                    "material_type",
                    models.CharField(
                        choices=[
                            ("diamond", "Diamond"),
                            ("gemstone", "Gemstone"),
                            ("all", "All Materials"),
                        ],
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="origins",
                        to="core.company",
                    ),
                ),
            ],
            options={
                "db_table": "origin_master",
                "ordering": ["name"],
            },
        ),
    ]
