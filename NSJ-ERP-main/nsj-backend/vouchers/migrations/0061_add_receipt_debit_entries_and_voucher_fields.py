import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0010_accountcontact_city_master_and_more"),
        ("vouchers", "0060_remove_gold_quality_master"),
    ]

    operations = [
        migrations.AddField(
            model_name="receipt",
            name="is_pdc",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="receipt",
            name="series",
            field=models.CharField(blank=True, default="RECEIPT M", max_length=50, null=True),
        ),
        migrations.AddField(
            model_name="receipt",
            name="voucher_no",
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.CreateModel(
            name="ReceiptDebitEntry",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "balance",
                    models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True),
                ),
                (
                    "dr",
                    models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True),
                ),
                ("narration", models.TextField(blank=True, null=True)),
                ("order", models.PositiveIntegerField(default=0)),
                (
                    "party",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="receipt_debit_entries",
                        to="accounts.account",
                    ),
                ),
                (
                    "receipt",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="debit_entries",
                        to="vouchers.receipt",
                    ),
                ),
            ],
            options={
                "db_table": "receipt_debit_entry",
                "ordering": ["order"],
            },
        ),
    ]
