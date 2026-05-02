from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("vouchers", "0065_contra_internal_cash_bank"),
    ]

    operations = [
        migrations.AlterField(
            model_name="rawmaterialpurchase",
            name="origin_type",
            field=models.CharField(
                blank=True,
                null=True,
                max_length=100,
                help_text="Origin type (Natural/CVD/Synthetic)",
            ),
        ),
    ]
