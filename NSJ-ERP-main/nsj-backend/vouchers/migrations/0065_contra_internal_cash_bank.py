from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("vouchers", "0064_add_raw_material_fk_fields"),
        ("accounts", "0010_accountcontact_city_master_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="contravoucher",
            name="party_name",
        ),
        migrations.AddField(
            model_name="contravoucher",
            name="party_name",
            field=models.CharField(
                choices=[("CASH", "Cash"), ("BANK", "Bank")],
                max_length=10,
                null=True,
                blank=True,
            ),
        ),
        migrations.RemoveField(
            model_name="contracreditentry",
            name="party",
        ),
        migrations.AddField(
            model_name="contracreditentry",
            name="party",
            field=models.CharField(
                choices=[("CASH", "Cash"), ("BANK", "Bank")],
                max_length=10,
                null=True,
                blank=True,
            ),
        ),
    ]
