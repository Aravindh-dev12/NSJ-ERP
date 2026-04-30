import uuid
from django.db import models
from django.core.validators import MinValueValidator


class PartyRate(models.Model):
    """Per-party metal pricing setup"""

    METAL_CHOICES = [
        ("Gold", "Gold"),
        ("Silver", "Silver"),
        ("Platinum", "Platinum"),
    ]

    RATE_TYPE_CHOICES = [
        ("PER_GRAM", "Per Gram"),
        ("PERCENT", "Percent"),
        ("FIXED", "Fixed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Tenant scoping
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="party_rates"
    )
    account = models.ForeignKey(
        "accounts.Account", on_delete=models.CASCADE, related_name="party_rates"
    )

    # Rate details
    metal_type = models.TextField()
    karat = models.TextField(null=True, blank=True)  # 24K/22K/18K etc (nullable for non-gold)
    rate_type = models.CharField(max_length=20, choices=RATE_TYPE_CHOICES)
    rate_value = models.DecimalField(
        max_digits=12, decimal_places=3, validators=[MinValueValidator(0)]
    )

    # Effective dates
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)  # NULL = active/open-ended

    # Audit
    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_party_rates"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "party_rate"
        unique_together = [["company", "account", "metal_type", "karat", "effective_from"]]
        ordering = ["-effective_from"]

    def __str__(self):
        return f"{self.account.account_name} - {self.metal_type} ({self.rate_type})"


class DailyRate(models.Model):
    """Official daily metal prices for billing and manufacturing"""

    METAL_CHOICES = [
        ("Gold", "Gold"),
        ("Silver", "Silver"),
        ("Platinum", "Platinum"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Tenant scoping
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="daily_rates"
    )

    # Rate details
    rate_date = models.DateField()
    metal_type = models.TextField()
    karat = models.TextField(null=True, blank=True)  # 24K/22K/18K etc
    rate_per_gram = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)]
    )

    # Audit
    created_by = models.ForeignKey(
        "users.User", on_delete=models.CASCADE, related_name="created_daily_rates"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "daily_rate"
        ordering = ["-rate_date"]

    def __str__(self):
        return f"{self.rate_date} - {self.metal_type} @ {self.rate_per_gram}/gram"
