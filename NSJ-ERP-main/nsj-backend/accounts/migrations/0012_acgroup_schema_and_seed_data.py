import django.db.models.deletion
from django.db import migrations, models


def update_acgroup_masters_data(apps, schema_editor):
    """Seed / update ACGroupMaster with standard account group classifications."""
    ACGroupMaster = apps.get_model("accounts", "ACGroupMaster")

    new_data = [
        {
            "name": "CASH",
            "tally_parent_group": "Cash-in-Hand",
            "financial_statement": "Balance Sheet",
            "universal_nature": "Asset",
            "normal_balance": "Dr",
            "status": "Active",
        },
        {
            "name": "BANK",
            "tally_parent_group": "Bank Accounts",
            "financial_statement": "Balance Sheet",
            "universal_nature": "Asset",
            "normal_balance": "Dr",
            "status": "Active",
        },
        {
            "name": "CUSTOMER",
            "tally_parent_group": "Sundry Debtors",
            "financial_statement": "Balance Sheet",
            "universal_nature": "Asset",
            "normal_balance": "Dr",
            "status": "Active",
        },
        {
            "name": "SUPPLIER",
            "tally_parent_group": "Sundry Creditors",
            "financial_statement": "Balance Sheet",
            "universal_nature": "Liability",
            "normal_balance": "Cr",
            "status": "Active",
        },
        {
            "name": "KARIGAR",
            "tally_parent_group": "Sundry Creditors",
            "financial_statement": "Balance Sheet",
            "universal_nature": "Liability",
            "normal_balance": "Cr",
            "status": "Active",
        },
        {
            "name": "CAPITAL",
            "tally_parent_group": "Capital Account",
            "financial_statement": "Balance Sheet",
            "universal_nature": "Capital",
            "normal_balance": "Cr",
            "status": "Active",
        },
        {
            "name": "CURRENT ASSETS",
            "tally_parent_group": "Current Assets",
            "financial_statement": "Balance Sheet",
            "universal_nature": "Asset",
            "normal_balance": "Dr",
            "status": "Active",
        },
        {
            "name": "FIXED ASSETS",
            "tally_parent_group": "Fixed Assets",
            "financial_statement": "Balance Sheet",
            "universal_nature": "Asset",
            "normal_balance": "Dr",
            "status": "Active",
        },
        {
            "name": "ADVANCES PAID",
            "tally_parent_group": "Loans & Advances (Asset)",
            "financial_statement": "Balance Sheet",
            "universal_nature": "Asset",
            "normal_balance": "Dr",
            "status": "Active",
        },
        {
            "name": "ADVANCES RECEIVED",
            "tally_parent_group": "Current Liabilities",
            "financial_statement": "Balance Sheet",
            "universal_nature": "Liability",
            "normal_balance": "Cr",
            "status": "Active",
        },
        {
            "name": "RECEIVABLES",
            "tally_parent_group": "Sundry Debtors",
            "financial_statement": "Balance Sheet",
            "universal_nature": "Asset",
            "normal_balance": "Dr",
            "status": "Active",
        },
        {
            "name": "SUNDRY DEBTORS",
            "tally_parent_group": "Sundry Debtors",
            "financial_statement": "Balance Sheet",
            "universal_nature": "Asset",
            "normal_balance": "Dr",
            "status": "Active",
        },
        {
            "name": "SUNDRY CREDITORS",
            "tally_parent_group": "Sundry Creditors",
            "financial_statement": "Balance Sheet",
            "universal_nature": "Liability",
            "normal_balance": "Cr",
            "status": "Active",
        },
        {
            "name": "DUTIES & TAXES",
            "tally_parent_group": "Duties & Taxes",
            "financial_statement": "Balance Sheet",
            "universal_nature": "Liability",
            "normal_balance": "Cr",
            "status": "Active",
        },
        {
            "name": "DEPOSITS (LIABILITIES)",
            "tally_parent_group": "Current Liabilities",
            "financial_statement": "Balance Sheet",
            "universal_nature": "Liability",
            "normal_balance": "Cr",
            "status": "Active",
        },
        {
            "name": "DEPOSITS (ASSETS)",
            "tally_parent_group": "Deposits (Asset)",
            "financial_statement": "Balance Sheet",
            "universal_nature": "Asset",
            "normal_balance": "Dr",
            "status": "Active",
        },
        {
            "name": "EXPENSES DIRECT",
            "tally_parent_group": "Direct Expenses",
            "financial_statement": "Profit & Loss",
            "universal_nature": "Expense",
            "normal_balance": "Dr",
            "status": "Active",
        },
        {
            "name": "EXPENSES INDIRECT",
            "tally_parent_group": "Indirect Expenses",
            "financial_statement": "Profit & Loss",
            "universal_nature": "Expense",
            "normal_balance": "Dr",
            "status": "Active",
        },
        {
            "name": "SALARY",
            "tally_parent_group": "Indirect Expenses",
            "financial_statement": "Profit & Loss",
            "universal_nature": "Expense",
            "normal_balance": "Dr",
            "status": "Active",
        },
        {
            "name": "SALARY PAYABLE",
            "tally_parent_group": "Current Liabilities",
            "financial_statement": "Balance Sheet",
            "universal_nature": "Liability",
            "normal_balance": "Cr",
            "status": "Active",
        },
        {
            "name": "INCOMES DIRECT",
            "tally_parent_group": "Direct Incomes",
            "financial_statement": "Profit & Loss",
            "universal_nature": "Income",
            "normal_balance": "Cr",
            "status": "Active",
        },
        {
            "name": "INCOMES INDIRECT",
            "tally_parent_group": "Indirect Incomes",
            "financial_statement": "Profit & Loss",
            "universal_nature": "Income",
            "normal_balance": "Cr",
            "status": "Active",
        },
        {
            "name": "PURCHASE",
            "tally_parent_group": "Purchase Accounts",
            "financial_statement": "Profit & Loss",
            "universal_nature": "Expense",
            "normal_balance": "Dr",
            "status": "Active",
        },
        {
            "name": "SALE",
            "tally_parent_group": "Sales Accounts",
            "financial_statement": "Profit & Loss",
            "universal_nature": "Income",
            "normal_balance": "Cr",
            "status": "Active",
        },
        {
            "name": "TRADING",
            "tally_parent_group": "Stock-in-Hand",
            "financial_statement": "Balance Sheet",
            "universal_nature": "Asset",
            "normal_balance": "Dr",
            "status": "Restricted",
        },
        {
            "name": "PROFIT & LOSS",
            "tally_parent_group": "Profit & Loss A/c",
            "financial_statement": "Profit & Loss",
            "universal_nature": "Capital",
            "normal_balance": "Cr",
            "status": "Restricted",
        },
        {
            "name": "LOANS (LIABILITY)",
            "tally_parent_group": "Loans (Liability)",
            "financial_statement": "Balance Sheet",
            "universal_nature": "Liability",
            "normal_balance": "Cr",
            "status": "Active",
        },
        {
            "name": "LOANS & ADVANCES (ASSET)",
            "tally_parent_group": "Loans & Advances (Asset)",
            "financial_statement": "Balance Sheet",
            "universal_nature": "Asset",
            "normal_balance": "Dr",
            "status": "Active",
        },
    ]

    ACGroup = apps.get_model('accounts', 'ACGroup')

    existing_records = list(ACGroupMaster.objects.all())
    existing_by_name = {record.name: record for record in existing_records}
    new_names = {data["name"] for data in new_data}

    # Upsert canonical records
    for data in new_data:
        name = data["name"]
        if name in existing_by_name:
            record = existing_by_name[name]
            record.tally_parent_group = data["tally_parent_group"]
            record.financial_statement = data["financial_statement"]
            record.universal_nature = data["universal_nature"]
            record.normal_balance = data["normal_balance"]
            record.status = data["status"]
            record.save()
        else:
            ACGroupMaster.objects.create(**data)

    for record in existing_records:
        if record.name not in new_names:
            try:
                ACGroup.objects.filter(ac_group=record).delete()
                record.delete()
            except Exception:
                pass


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0011_add_cash_bank_group_choices"),
    ]

    operations = [
        # ── Model options ──────────────────────────────────────────────────────
        migrations.AlterModelOptions(
            name="acgroup",
            options={
                "ordering": ["-created_at"],
                "verbose_name": "Account Group",
                "verbose_name_plural": "Account Groups",
            },
        ),
        migrations.AlterModelOptions(
            name="acgroupmaster",
            options={
                "ordering": ["name"],
                "verbose_name": "Account Group Master",
                "verbose_name_plural": "Account Group Masters",
            },
        ),
        # ── ACGroup new fields ─────────────────────────────────────────────────
        migrations.AddField(
            model_name="acgroup",
            name="export_rule",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="acgroup",
            name="financial_statement",
            field=models.CharField(
                choices=[("Balance Sheet", "Balance Sheet"), ("Profit & Loss", "Profit & Loss")],
                default="Balance Sheet",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="acgroup",
            name="ledger_examples",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="acgroup",
            name="name",
            field=models.CharField(
                default="Unnamed", help_text="Spark Account Group", max_length=255
            ),
        ),
        migrations.AddField(
            model_name="acgroup",
            name="normal_balance",
            field=models.CharField(
                choices=[("Dr", "Debit"), ("Cr", "Credit")], default="Dr", max_length=2
            ),
        ),
        migrations.AddField(
            model_name="acgroup",
            name="status",
            field=models.CharField(
                choices=[("Active", "Active"), ("Restricted", "Restricted")],
                default="Active",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="acgroup",
            name="tally_parent_group",
            field=models.CharField(
                blank=True, default="", help_text="Tally Parent Group", max_length=255
            ),
        ),
        migrations.AddField(
            model_name="acgroup",
            name="universal_nature",
            field=models.CharField(
                choices=[
                    ("Asset", "Asset"),
                    ("Liability", "Liability"),
                    ("Income", "Income"),
                    ("Expense", "Expense"),
                    ("Capital", "Capital"),
                ],
                default="Asset",
                max_length=20,
            ),
        ),
        # ── ACGroupMaster new fields ───────────────────────────────────────────
        migrations.AddField(
            model_name="acgroupmaster",
            name="export_rule",
            field=models.TextField(blank=True, help_text="Rule for exporting to Tally", null=True),
        ),
        migrations.AddField(
            model_name="acgroupmaster",
            name="financial_statement",
            field=models.CharField(
                choices=[("Balance Sheet", "Balance Sheet"), ("Profit & Loss", "Profit & Loss")],
                default="Balance Sheet",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="acgroupmaster",
            name="ledger_examples",
            field=models.TextField(blank=True, help_text="Examples: Cash, Petty Cash", null=True),
        ),
        migrations.AddField(
            model_name="acgroupmaster",
            name="normal_balance",
            field=models.CharField(
                choices=[("Dr", "Debit"), ("Cr", "Credit")], default="Dr", max_length=2
            ),
        ),
        migrations.AddField(
            model_name="acgroupmaster",
            name="status",
            field=models.CharField(
                choices=[("Active", "Active"), ("Restricted", "Restricted")],
                default="Active",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="acgroupmaster",
            name="tally_parent_group",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Tally Parent Group (e.g., Cash-in-Hand, Bank Accounts)",
                max_length=255,
            ),
        ),
        migrations.AddField(
            model_name="acgroupmaster",
            name="universal_nature",
            field=models.CharField(
                choices=[
                    ("Asset", "Asset"),
                    ("Liability", "Liability"),
                    ("Income", "Income"),
                    ("Expense", "Expense"),
                    ("Capital", "Capital"),
                ],
                default="Asset",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="acgroupmaster",
            name="use_in_spark",
            field=models.CharField(
                choices=[("YES", "YES"), ("NO", "NO")], default="YES", max_length=3
            ),
        ),
        migrations.AlterField(
            model_name="acgroupmaster",
            name="name",
            field=models.CharField(
                help_text="Spark Account Group (e.g., CASH, BANK, CUSTOMER)",
                max_length=255,
                unique=True,
            ),
        ),
        # ── Account new fields ─────────────────────────────────────────────────
        migrations.AddField(
            model_name="account",
            name="bill_wise_required",
            field=models.CharField(
                choices=[("YES", "YES"), ("NO", "NO")], default="NO", max_length=3
            ),
        ),
        migrations.AddField(
            model_name="account",
            name="cost_centre_required",
            field=models.CharField(
                choices=[("YES", "YES"), ("NO", "NO")], default="NO", max_length=3
            ),
        ),
        migrations.AddField(
            model_name="account",
            name="export_to_tally",
            field=models.CharField(
                choices=[("YES", "YES"), ("NO", "NO")], default="YES", max_length=3
            ),
        ),
        migrations.AddField(
            model_name="account",
            name="financial_statement",
            field=models.CharField(
                blank=True,
                choices=[("Balance Sheet", "Balance Sheet"), ("Profit & Loss", "Profit & Loss")],
                max_length=20,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="account",
            name="gst_registration_type",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="account",
            name="ledger_role",
            field=models.CharField(
                blank=True, help_text="Ledger role/category", max_length=100, null=True
            ),
        ),
        migrations.AddField(
            model_name="account",
            name="normal_balance",
            field=models.CharField(
                blank=True, choices=[("Dr", "Debit"), ("Cr", "Credit")], max_length=2, null=True
            ),
        ),
        migrations.AddField(
            model_name="account",
            name="party_category",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="account",
            name="spark_account_group",
            field=models.ForeignKey(
                blank=True,
                help_text="Spark Account Group for Tally export mapping",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="accounts",
                to="accounts.acgroupmaster",
            ),
        ),
        migrations.AddField(
            model_name="account",
            name="tally_ledger_name_override",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="account",
            name="tally_parent_group",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="account",
            name="team_notice",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="account",
            name="validation_status",
            field=models.CharField(blank=True, default="Pending", max_length=50, null=True),
        ),
        # ── Seed data (runs after all schema changes above) ────────────────────
        migrations.RunPython(
            update_acgroup_masters_data,
            reverse_code=migrations.RunPython.noop,  # safe no-op on rollback
        ),
    ]
