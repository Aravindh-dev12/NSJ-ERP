import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0009_alter_accountcontact_city_and_more"),
        ("core", "0014_alter_dailygoldrate_gold_22k"),
    ]

    operations = [
        migrations.AddField(
            model_name="accountcontact",
            name="city_master",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="account_contacts",
                to="core.citymaster",
            ),
        ),
        migrations.AddField(
            model_name="accountcontact",
            name="country_master",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="account_contacts",
                to="core.countrymaster",
            ),
        ),
        migrations.AddField(
            model_name="accountcontact",
            name="state_master",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="account_contacts",
                to="core.statemaster",
            ),
        ),
        migrations.AlterField(
            model_name="accountcontact",
            name="city",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="accountcontact",
            name="country",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="accountcontact",
            name="state",
            field=models.TextField(blank=True, null=True),
        ),
    ]
