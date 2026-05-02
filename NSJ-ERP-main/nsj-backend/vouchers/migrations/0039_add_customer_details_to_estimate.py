# Generated migration for adding customer details to EstimateVoucher

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("vouchers", "0038_add_selected_estimate_to_sale"),
    ]

    operations = [
        migrations.AddField(
            model_name="estimatevoucher",
            name="sub_account",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="estimatevoucher",
            name="phone_number",
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name="estimatevoucher",
            name="sales_person_name",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
