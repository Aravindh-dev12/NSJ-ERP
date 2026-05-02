from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("sales_queries", "0021_remove_salesquery_aadhaar_details"),
    ]

    operations = [
        migrations.AddField(
            model_name="salesquery",
            name="gold_quality",
            field=models.CharField(
                blank=True,
                help_text="Gold purity in KT (e.g., 18KT, 22KT, 24KT)",
                max_length=10,
                null=True,
            ),
        ),
    ]
