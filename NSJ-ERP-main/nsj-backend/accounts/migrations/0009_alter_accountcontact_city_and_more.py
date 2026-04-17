import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0008_alter_subaccount_options"),
        ("core", "0014_alter_dailygoldrate_gold_22k"),
    ]

    operations = [
        migrations.AlterField(
            model_name="accountcontact",
            name="city",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="account_contacts",
                to="core.citymaster",
            ),
        ),
        migrations.AlterField(
            model_name="accountcontact",
            name="country",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="account_contacts",
                to="core.countrymaster",
            ),
        ),
        migrations.AlterField(
            model_name="accountcontact",
            name="state",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="account_contacts",
                to="core.statemaster",
            ),
        ),
    ]
