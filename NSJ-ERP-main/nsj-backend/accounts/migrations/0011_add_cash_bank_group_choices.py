# Generated migration to add CASH and BANK to Account.group_code choices
# Note: In Django, choices are metadata only and don't affect the database schema.
# The database column remains a VARCHAR(20) field that can store any string.
# We include all choices here to keep the migration consistent with the model definition.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0010_accountcontact_city_master_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="account",
            name="group_code",
            field=models.CharField(
                choices=[
                    ("CUSTOMER", "Customer"),
                    ("SUPPLIER", "Supplier"),
                    ("AGENT", "Agent"),
                    ("STAFF", "Staff"),
                    ("CASH", "Cash"),  # NEW: Added CASH option
                    ("BANK", "Bank"),  # NEW: Added BANK option
                ],
                max_length=20,
            ),
        ),
    ]
