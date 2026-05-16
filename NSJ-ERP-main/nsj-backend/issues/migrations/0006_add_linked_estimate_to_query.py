from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("issues", "0005_add_manufacturing_fields_to_orderissue"),
    ]

    operations = [
        migrations.AddField(
            model_name="query",
            name="linked_estimate_id",
            field=models.UUIDField(
                blank=True,
                null=True,
                help_text="UUID of the EstimateVoucher linked to this query before order creation",
            ),
        ),
    ]
