# Generated migration for adding discount and other_charges fields

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("sales_queries", "0011_salesquery_advance_amount_salesquery_sale_notes"),
    ]

    operations = [
        migrations.AddField(
            model_name="salesquery",
            name="discount",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                default=0,
                help_text="Discount amount applied to the sale",
                max_digits=12,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="salesquery",
            name="other_charges",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                default=0,
                help_text="Other charges added to the sale",
                max_digits=12,
                null=True,
            ),
        ),
    ]
