# Generated migration for adding selected_estimate to Sale model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("vouchers", "0037_add_sale_to_estimate"),
    ]

    operations = [
        migrations.AddField(
            model_name="sale",
            name="selected_estimate",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="selected_for_sales",
                to="vouchers.estimatevoucher",
            ),
        ),
    ]
