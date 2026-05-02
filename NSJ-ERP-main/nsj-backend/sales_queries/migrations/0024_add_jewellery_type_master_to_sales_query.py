import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0014_alter_dailygoldrate_gold_22k"),
        ("sales_queries", "0023_add_sub_account_record_to_sales_query"),
    ]

    operations = [
        migrations.AddField(
            model_name="salesquery",
            name="jewellery_type_master",
            field=models.ForeignKey(
                blank=True,
                help_text="Jewellery type from Item Name Master",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="sales_queries",
                to="core.itemnamemaster",
            ),
        ),
    ]
