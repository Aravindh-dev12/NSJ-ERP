
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0016_add_raw_material_dropdown_masters"),
        ("vouchers", "0063_remove_contravoucher_is_pdc_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="cut_fk",
            field=models.ForeignKey(
                blank=True,
                help_text="Cut grade from master",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="raw_material_purchases_cut",
                to="core.cutmaster",
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="gemstone_lab_fk",
            field=models.ForeignKey(
                blank=True,
                help_text="Gemstone lab from LabMaster",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="raw_material_purchases_gemstone_lab",
                to="core.labmaster",
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="master_size_fk",
            field=models.ForeignKey(
                blank=True,
                help_text="Master size from SizeMaster",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="raw_material_purchases_master_size",
                to="core.sizemaster",
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="pol_fk",
            field=models.ForeignKey(
                blank=True,
                help_text="Polish grade from master",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="raw_material_purchases_pol",
                to="core.polishmaster",
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialpurchase",
            name="sym_fk",
            field=models.ForeignKey(
                blank=True,
                help_text="Symmetry grade from master",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="raw_material_purchases_sym",
                to="core.symmetrymaster",
            ),
        ),
    ]
