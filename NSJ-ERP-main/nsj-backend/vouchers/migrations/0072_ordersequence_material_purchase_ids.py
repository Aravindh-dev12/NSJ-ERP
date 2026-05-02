from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("vouchers", "0071_ghatapprovalimage_ghatqualitycheckimage_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="ordersequence",
            name="order_type",
            field=models.CharField(
                choices=[
                    ("STOCK_JEWELRY", "Stock Jewelry"),
                    ("BESPOKE_NATURAL", "Bespoke Natural Jewelry"),
                    ("BESPOKE_CVD", "Bespoke CVD Jewelry"),
                    ("LOOSE_DIAMONDS", "Loose Diamonds"),
                    ("STOCK_PURCHASE", "Stock Purchase (Raw Material)"),
                ],
                help_text="Order type or material sequence key (e.g. STOCK_JEWELRY, MAT_DIA, MAT_GEM)",
                max_length=50,
                unique=True,
            ),
        ),
    ]
