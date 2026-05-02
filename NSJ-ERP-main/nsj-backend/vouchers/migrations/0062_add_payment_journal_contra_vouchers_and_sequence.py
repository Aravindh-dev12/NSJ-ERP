import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0010_accountcontact_city_master_and_more"),
        ("core", "0015_add_gold_quality_master_to_sales_query"),
        ("vouchers", "0061_add_receipt_debit_entries_and_voucher_fields"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ContraVoucher",
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
                ("voucher_no", models.CharField(blank=True, max_length=50, null=True)),
                (
                    "series",
                    models.CharField(blank=True, default="CONTRA M", max_length=50, null=True),
                ),
                ("is_pdc", models.BooleanField(default=False)),
                ("date", models.DateField(blank=True, null=True)),
                (
                    "dr",
                    models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True),
                ),
                (
                    "balance",
                    models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True),
                ),
                ("narration", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="contra_vouchers",
                        to="core.company",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_contra_vouchers",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "party_name",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="contra_vouchers_as_party",
                        to="accounts.account",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_contra_vouchers",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "contra_voucher",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="ContraCreditEntry",
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
                    "cr",
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
                        related_name="contra_credit_entries",
                        to="accounts.account",
                    ),
                ),
                (
                    "contra",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="credit_entries",
                        to="vouchers.contravoucher",
                    ),
                ),
            ],
            options={
                "db_table": "contra_credit_entry",
                "ordering": ["order"],
            },
        ),
        migrations.CreateModel(
            name="JournalVoucher",
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
                ("voucher_no", models.CharField(blank=True, max_length=50, null=True)),
                (
                    "series",
                    models.CharField(blank=True, default="JOURNAL M", max_length=50, null=True),
                ),
                ("is_pdc", models.BooleanField(default=False)),
                ("date", models.DateField(blank=True, null=True)),
                (
                    "dr",
                    models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True),
                ),
                (
                    "balance",
                    models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True),
                ),
                ("narration", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="journal_vouchers",
                        to="core.company",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_journal_vouchers",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "party_name",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="journal_vouchers_as_party",
                        to="accounts.account",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_journal_vouchers",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "journal_voucher",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="JournalCreditEntry",
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
                    "cr",
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
                        related_name="journal_credit_entries",
                        to="accounts.account",
                    ),
                ),
                (
                    "journal",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="credit_entries",
                        to="vouchers.journalvoucher",
                    ),
                ),
            ],
            options={
                "db_table": "journal_credit_entry",
                "ordering": ["order"],
            },
        ),
        migrations.CreateModel(
            name="PaymentVoucher",
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
                ("voucher_no", models.CharField(blank=True, max_length=50, null=True)),
                (
                    "series",
                    models.CharField(blank=True, default="PAYMENT M", max_length=50, null=True),
                ),
                ("is_pdc", models.BooleanField(default=False)),
                ("date", models.DateField(blank=True, null=True)),
                (
                    "dr",
                    models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True),
                ),
                (
                    "balance",
                    models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True),
                ),
                ("narration", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="payment_vouchers",
                        to="core.company",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_payment_vouchers",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "party_name",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="payment_vouchers_as_party",
                        to="accounts.account",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_payment_vouchers",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "payment_voucher",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="PaymentCreditEntry",
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
                    "cr",
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
                        related_name="payment_credit_entries",
                        to="accounts.account",
                    ),
                ),
                (
                    "payment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="credit_entries",
                        to="vouchers.paymentvoucher",
                    ),
                ),
            ],
            options={
                "db_table": "payment_credit_entry",
                "ordering": ["order"],
            },
        ),
        migrations.CreateModel(
            name="VoucherSequence",
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
                    "voucher_type",
                    models.CharField(
                        choices=[
                            ("RECEIPT", "Receipt"),
                            ("PAYMENT", "Payment"),
                            ("JOURNAL", "Journal"),
                            ("CONTRA", "Contra"),
                        ],
                        max_length=20,
                    ),
                ),
                ("last_number", models.PositiveIntegerField(default=0)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="voucher_sequences",
                        to="core.company",
                    ),
                ),
            ],
            options={
                "db_table": "voucher_sequence",
                "unique_together": {("company", "voucher_type")},
            },
        ),
    ]
