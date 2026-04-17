# Generated migration for sub-account restructuring

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0006_acgroupmaster_alter_subaccount_options_acgroup"),
    ]

    operations = [
        # Add email field
        migrations.AddField(
            model_name="subaccount",
            name="email",
            field=models.EmailField(max_length=254, null=True, blank=True),
        ),
        # Remove jewelry-specific fields
        migrations.RemoveField(
            model_name="subaccount",
            name="ring_size",
        ),
        migrations.RemoveField(
            model_name="subaccount",
            name="bangle_size",
        ),
        migrations.RemoveField(
            model_name="subaccount",
            name="item_name",
        ),
    ]
