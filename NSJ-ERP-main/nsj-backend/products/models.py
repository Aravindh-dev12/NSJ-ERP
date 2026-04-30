import uuid
from django.db import models
from django.core.validators import MinValueValidator


class Product(models.Model):
    """Products master - Employee Read lists for search/selection"""

    METAL_CHOICES = [
        ("Gold", "Gold"),
        ("Silver", "Silver"),
        ("Platinum", "Platinum"),
    ]

    STATUS_CHOICES = [
        ("ACTIVE", "Active"),
        ("INACTIVE", "Inactive"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Tenant scoping
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE, related_name="products")
    branch = models.ForeignKey(
        "core.Branch", on_delete=models.SET_NULL, null=True, blank=True, related_name="products"
    )

    # Product details
    sku = models.TextField()  # Unique within company
    name = models.TextField()
    category = models.TextField()  # Ring/Necklace/Bangle/...
    metal_type = models.TextField()
    karat = models.TextField(null=True, blank=True)  # 24K/22K/18K etc

    # Weight details
    gross_weight = models.DecimalField(
        max_digits=12, decimal_places=3, default=0, validators=[MinValueValidator(0)]
    )
    net_weight = models.DecimalField(
        max_digits=12, decimal_places=3, default=0, validators=[MinValueValidator(0)]
    )

    # Additional details
    stone_type = models.TextField(null=True, blank=True)  # Primary stone (e.g., Diamond)
    making_charges = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )

    # Stock and pricing
    stock_quantity = models.IntegerField(default=0)
    price = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ACTIVE")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "products"
        unique_together = [["company", "sku"]]
        ordering = ["name"]

    def __str__(self):
        return f"{self.sku} - {self.name}"

    def clean(self):
        """Validate that net_weight <= gross_weight"""
        from django.core.exceptions import ValidationError

        if self.net_weight and self.gross_weight and self.net_weight > self.gross_weight:
            raise ValidationError({"net_weight": "Net weight cannot be greater than gross weight"})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
