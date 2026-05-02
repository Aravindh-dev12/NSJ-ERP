# Custom migration for comprehensive raw material purchase fields

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("vouchers", "0043_add_product_image_to_estimate"),
    ]

    operations = [
        # Add missing common fields
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="certificate_number",
            field=models.CharField(
                max_length=128, null=True, blank=True, help_text="Certificate number"
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="size",
            field=models.CharField(max_length=128, null=True, blank=True, help_text="Size details"),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="fluorescence",
            field=models.CharField(
                max_length=128, null=True, blank=True, help_text="Fluorescence details"
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="purchase_budget_total",
            field=models.DecimalField(
                max_digits=14,
                decimal_places=2,
                null=True,
                blank=True,
                help_text="Purchase budget total",
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="purchase_budget_per_carat",
            field=models.DecimalField(
                max_digits=14,
                decimal_places=2,
                null=True,
                blank=True,
                help_text="Purchase budget per carat",
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="suggested_supplier",
            field=models.CharField(
                max_length=256, null=True, blank=True, help_text="Suggested supplier"
            ),
        ),
        # Add all gemstone specific fields
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gemstone_shape",
            field=models.CharField(
                max_length=128, null=True, blank=True, help_text="Gemstone shape"
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gemstone_carat_weight",
            field=models.DecimalField(
                max_digits=12,
                decimal_places=3,
                null=True,
                blank=True,
                help_text="Gemstone carat weight",
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gemstone_number_of_pieces",
            field=models.IntegerField(null=True, blank=True, help_text="Number of gemstone pieces"),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gemstone_color",
            field=models.CharField(
                max_length=128, null=True, blank=True, help_text="Gemstone color"
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gemstone_clarity",
            field=models.CharField(
                max_length=128, null=True, blank=True, help_text="Gemstone clarity"
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gemstone_treatment",
            field=models.CharField(
                max_length=128, null=True, blank=True, help_text="Gemstone treatment"
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gemstone_lab",
            field=models.CharField(max_length=128, null=True, blank=True, help_text="Gemstone lab"),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gemstone_certificate_number",
            field=models.CharField(
                max_length=128, null=True, blank=True, help_text="Gemstone certificate number"
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gemstone_additional_details",
            field=models.TextField(null=True, blank=True, help_text="Gemstone additional details"),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gemstone_cut",
            field=models.CharField(max_length=128, null=True, blank=True, help_text="Gemstone cut"),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gemstone_size",
            field=models.CharField(
                max_length=128, null=True, blank=True, help_text="Gemstone size"
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gemstone_purchase_budget_total",
            field=models.DecimalField(
                max_digits=14,
                decimal_places=2,
                null=True,
                blank=True,
                help_text="Gemstone purchase budget total",
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gemstone_purchase_budget_per_carat",
            field=models.DecimalField(
                max_digits=14,
                decimal_places=2,
                null=True,
                blank=True,
                help_text="Gemstone purchase budget per carat",
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gemstone_suggested_supplier",
            field=models.CharField(
                max_length=256, null=True, blank=True, help_text="Gemstone suggested supplier"
            ),
        ),
        # Add all gold specific fields
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gold_purity",
            field=models.CharField(
                max_length=128, null=True, blank=True, help_text="Gold purity (e.g., 24K, 22K, 18K)"
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gold_weight",
            field=models.DecimalField(
                max_digits=12,
                decimal_places=3,
                null=True,
                blank=True,
                help_text="Gold weight in grams",
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gold_mode",
            field=models.CharField(
                max_length=128, null=True, blank=True, help_text="Gold mode (Cast, Mill, etc.)"
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gold_suggested_supplier",
            field=models.CharField(
                max_length=256, null=True, blank=True, help_text="Gold suggested supplier"
            ),
        ),
    ]
