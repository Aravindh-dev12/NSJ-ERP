from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("vouchers", "0059_add_sub_account_and_gold_quality_to_estimate"),
    ]

    operations = [
        migrations.AlterField(
            model_name="estimatevoucher",
            name="gold_quality",
            field=models.CharField(
                blank=True,
                help_text="Gold purity in KT (e.g., 18KT, 22KT, 24KT) - supports hardcoded dropdown or custom input",
                max_length=10,
                null=True,
            ),
        ),
    ]
