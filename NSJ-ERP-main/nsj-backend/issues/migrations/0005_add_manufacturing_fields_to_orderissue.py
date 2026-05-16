# Generated migration for OrderIssue manufacturing fields

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("issues", "0004_add_subaccount_and_custom_item_name"),
    ]

    operations = [
        migrations.AlterField(
            model_name="orderissue",
            name="order",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.CASCADE,
                related_name="order_issues",
                to="vouchers.order",
            ),
        ),
        migrations.AddField(
            model_name="orderissue",
            name="metal",
            field=models.CharField(
                blank=True, help_text="Gold Karat (e.g., 22K, 18K)", max_length=50, null=True
            ),
        ),
        migrations.AddField(
            model_name="orderissue",
            name="total_size",
            field=models.CharField(
                blank=True, help_text="Size/Dimensions", max_length=100, null=True
            ),
        ),
        migrations.AddField(
            model_name="orderissue",
            name="base_metal_colour",
            field=models.CharField(
                blank=True, help_text="Base Metal Color", max_length=100, null=True
            ),
        ),
        migrations.AddField(
            model_name="orderissue",
            name="rhodium_instructions",
            field=models.TextField(blank=True, help_text="Rhodium plating instructions", null=True),
        ),
        migrations.AddField(
            model_name="orderissue",
            name="prong_style",
            field=models.CharField(blank=True, help_text="Prong style", max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="orderissue",
            name="locking_system",
            field=models.CharField(
                blank=True, help_text="Locking system", max_length=100, null=True
            ),
        ),
        migrations.AddField(
            model_name="orderissue",
            name="final_finish",
            field=models.CharField(
                blank=True, help_text="Final finish type", max_length=100, null=True
            ),
        ),
        migrations.AddField(
            model_name="orderissue",
            name="additional_notes",
            field=models.TextField(
                blank=True, help_text="Additional manufacturing notes", null=True
            ),
        ),
    ]
