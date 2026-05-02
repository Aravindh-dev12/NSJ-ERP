import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0010_accountcontact_city_master_and_more"),
        ("vouchers", "0058_merge_20260216_2038"),
    ]

    operations = [
        migrations.AddField(
            model_name="estimatevoucher",
            name="gold_quality",
            field=models.CharField(
                blank=True,
                help_text="Gold purity in KT (e.g., 18KT, 22KT, 24KT)",
                max_length=10,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="estimatevoucher",
            name="sub_account_record",
            field=models.ForeignKey(
                blank=True,
                help_text="Sub account for detailed customer tracking",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="estimate_vouchers",
                to="accounts.subaccount",
            ),
        ),
    ]
