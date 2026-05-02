# Manual migration to add missing receipt_voucher_id column
# NOTE: This field was already added in migration 0052, so this is now a no-op migration
# to maintain migration history consistency
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("vouchers", "0052_orderdraft_orderprocesslock_orderprocessstep_and_more"),
    ]

    operations = [
        # No operations - field already exists in migration 0052
        # This migration is kept for dependency chain consistency
    ]
