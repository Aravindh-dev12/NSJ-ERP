from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        (
            "sales_queries",
            "0020_salesquery_aadhaar_details_salesquery_sample_photo_and_more",
        ),
    ]

    operations = [
        migrations.RemoveField(
            model_name="salesquery",
            name="aadhaar_details",
        ),
    ]
