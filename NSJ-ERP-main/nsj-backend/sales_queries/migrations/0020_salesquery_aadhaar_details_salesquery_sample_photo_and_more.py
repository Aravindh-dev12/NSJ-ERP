from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("sales_queries", "0019_merge_20260216_2038"),
    ]

    operations = [
        migrations.AddField(
            model_name="salesquery",
            name="aadhaar_details",
            field=models.CharField(
                blank=True,
                help_text="Aadhaar number or PAN details",
                max_length=255,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="salesquery",
            name="sample_photo",
            field=models.FileField(
                blank=True,
                help_text="Photo attachment for sample reference",
                null=True,
                upload_to="sales_query_samples/",
            ),
        ),
        migrations.AlterField(
            model_name="salesquery",
            name="client_delivery_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("HOME", "Home Delivery"),
                    ("PICKUP", "Pickup"),
                    ("INSTORE", "In-Store"),
                    ("LOCAL_PARCEL", "Local Parcel"),
                    ("JAY_AMBE", "Jay Ambe Express Logistics"),
                    ("MAA_BHAWANI", "Maa Bhawani Logistics"),
                    ("BVC", "BVC Logistics"),
                    ("SEQUEL", "Sequel Logistics"),
                ],
                help_text="Delivery type: Home, Pickup, or In-Store",
                max_length=20,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="salesquery",
            name="pan_gstin",
            field=models.CharField(blank=True, max_length=12, null=True),
        ),
    ]
