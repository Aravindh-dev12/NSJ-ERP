from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("sales_queries", "0025_add_gold_quality_master_to_sales_query"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="salesquery",
            name="gold_quality_master",
        ),
        migrations.AlterField(
            model_name="salesquery",
            name="gold_quality",
            field=models.CharField(
                blank=True,
                help_text="Gold purity in KT (e.g., 18KT, 22KT, 24KT) - supports hardcoded dropdown or custom input",
                max_length=10,
                null=True,
            ),
        ),
    ]
