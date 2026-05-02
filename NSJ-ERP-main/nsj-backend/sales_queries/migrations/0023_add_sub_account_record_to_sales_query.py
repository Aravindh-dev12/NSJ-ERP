import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0010_accountcontact_city_master_and_more"),
        ("sales_queries", "0022_add_gold_quality_field"),
    ]

    operations = [
        migrations.AddField(
            model_name="salesquery",
            name="sub_account_record",
            field=models.ForeignKey(
                blank=True,
                help_text="Sub account for detailed customer tracking",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="sales_queries",
                to="accounts.subaccount",
            ),
        ),
    ]
