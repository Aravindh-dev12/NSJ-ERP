import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0014_alter_dailygoldrate_gold_22k"),
    ]

    operations = [
        migrations.CreateModel(
            name="GoldQualityMaster",
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
                ("name", models.CharField(max_length=50)),
                ("code", models.CharField(blank=True, max_length=20, null=True)),
                (
                    "company",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="gold_qualities",
                        to="core.company",
                    ),
                ),
            ],
            options={
                "db_table": "gold_quality_master",
                "ordering": ["name"],
            },
        ),
    ]
