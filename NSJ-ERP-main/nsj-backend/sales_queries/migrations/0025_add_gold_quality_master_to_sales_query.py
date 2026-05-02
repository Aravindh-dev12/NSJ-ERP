import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0015_add_gold_quality_master_to_sales_query"),
        ("sales_queries", "0024_add_jewellery_type_master_to_sales_query"),
    ]

    operations = [
        migrations.AddField(
            model_name="salesquery",
            name="gold_quality_master",
            field=models.ForeignKey(
                blank=True,
                help_text="Gold quality from Gold Quality Master",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="sales_queries",
                to="core.goldqualitymaster",
            ),
        ),
    ]
