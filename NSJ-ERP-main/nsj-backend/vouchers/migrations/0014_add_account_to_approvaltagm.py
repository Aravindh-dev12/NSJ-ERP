from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("vouchers", "0013_purchasem_purchasetagwisem"),
    ]

    operations = [
        migrations.AddField(
            model_name="approvaltagm",
            name="account",
            field=models.ForeignKey(
                to="accounts.Account",
                on_delete=django.db.models.deletion.SET_NULL,
                null=True,
                blank=True,
                related_name="approval_tag_m",
            ),
        ),
    ]
