# Generated migration for enhanced raw material purchase fields

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0002_add_gemstone_masters"),
        ("vouchers", "0044_add_comprehensive_raw_material_fields"),
    ]

    operations = [
        # Add enhanced purity fields
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="kt_value",
            field=models.IntegerField(
                blank=True, help_text="KT value for gold (24, 22, 18, etc.)", null=True
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="purity_percent",
            field=models.DecimalField(
                blank=True, decimal_places=2, help_text="Purity percentage", max_digits=5, null=True
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="purity_notes",
            field=models.TextField(blank=True, help_text="Additional purity notes", null=True),
        ),
        # Add cut dimensions
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="cut_length",
            field=models.DecimalField(
                blank=True, decimal_places=2, help_text="Cut length in mm", max_digits=8, null=True
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="cut_width",
            field=models.DecimalField(
                blank=True, decimal_places=2, help_text="Cut width in mm", max_digits=8, null=True
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="cut_height",
            field=models.DecimalField(
                blank=True, decimal_places=2, help_text="Cut height in mm", max_digits=8, null=True
            ),
        ),
        # Add mode selection
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="mode_cash",
            field=models.BooleanField(default=False, help_text="Cash mode selected"),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="mode_bill",
            field=models.BooleanField(default=False, help_text="Bill mode selected"),
        ),
        # Add origin type
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="origin_type",
            field=models.CharField(
                blank=True,
                help_text="Origin type (Natural/CVD/Synthetic)",
                max_length=20,
                null=True,
            ),
        ),
        # Add foreign key references to new master tables
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gemstone_type_fk",
            field=models.ForeignKey(
                blank=True,
                help_text="Gemstone type from master",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="raw_material_purchases_gemstone_type",
                to="core.gemstonemaster",
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gemstone_shape_fk",
            field=models.ForeignKey(
                blank=True,
                help_text="Gemstone shape from master",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="raw_material_purchases_gemstone_shape",
                to="core.gemstoneshapemaster",
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gemstone_color_fk",
            field=models.ForeignKey(
                blank=True,
                help_text="Gemstone color from master",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="raw_material_purchases_gemstone_color",
                to="core.gemstonecolormaster",
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gemstone_clarity_fk",
            field=models.ForeignKey(
                blank=True,
                help_text="Gemstone clarity from master",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="raw_material_purchases_gemstone_clarity",
                to="core.gemstoneclaritymaster",
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gemstone_treatment_fk",
            field=models.ForeignKey(
                blank=True,
                help_text="Gemstone treatment from master",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="raw_material_purchases_gemstone_treatment",
                to="core.gemstonetreatmentmaster",
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="origin_fk",
            field=models.ForeignKey(
                blank=True,
                help_text="Origin from master",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="raw_material_purchases_origin",
                to="core.originmaster",
            ),
        ),
    ]
