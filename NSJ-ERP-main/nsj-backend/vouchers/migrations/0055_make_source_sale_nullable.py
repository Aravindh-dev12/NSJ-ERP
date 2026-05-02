# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("vouchers", "0054_recreate_order_process_locks"),
    ]

    operations = [
        migrations.AlterField(
            model_name="orderdraft",
            name="source_sale",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="order_drafts",
                to="vouchers.sale",
            ),
        ),
    ]
