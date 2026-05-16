import uuid
from django.db import models
from django.utils import timezone


class Query(models.Model):
    """Query model - initial customer inquiry before advance payment"""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("converted_to_order", "Converted to Order"),
        ("archived", "Archived"),
        ("rejected", "Rejected"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Customer information
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.CASCADE,
        related_name="queries",
    )
    subaccount = models.CharField(
        max_length=255, blank=True, null=True
    )  # Optional subaccount text field

    # Item details
    item_name = models.ForeignKey(
        "core.ItemNameMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="queries",
    )
    item_name_custom = models.CharField(
        max_length=255, blank=True, null=True
    )  # Custom item name when "Other" is selected
    gold_carat = models.CharField(max_length=50)  # e.g., "22K", "24K", "18K"
    gender = models.CharField(
        max_length=50, blank=True, null=True
    )  # e.g., "Man", "Woman", "Unisex"
    size = models.CharField(max_length=255)  # e.g., size in inches

    # Delivery information
    location = models.CharField(max_length=255, blank=True, null=True)
    delivery_type = models.CharField(
        max_length=100, blank=True, null=True
    )  # e.g., "Home Delivery", "Pickup"

    # Timeline
    query_in_date = models.DateField()
    expiry_date = models.DateField(blank=True, null=True)

    reference_image = models.FileField(upload_to="query_references/", blank=True, null=True)

    linked_estimate_id = models.UUIDField(
        null=True,
        blank=True,
        help_text="UUID of the EstimateVoucher linked to this query before order creation",
    )

    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    # Metadata
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_queries",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "queries"
        ordering = ["-created_at"]
        verbose_name = "Query"
        verbose_name_plural = "Queries"
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["status"]),
            models.Index(fields=["account"]),
            models.Index(fields=["expiry_date"]),
        ]

    def __str__(self) -> str:
        account_name = self.account.account_name if self.account else "Unknown"
        item_name = self.item_name.name if self.item_name else "Item"
        return f"Query: {account_name} - {item_name}"

    def is_expired(self) -> bool:
        """Check if query has passed its expiry date"""
        if self.expiry_date:
            return timezone.now().date() > self.expiry_date
        return False

    def auto_archive_if_expired(self) -> bool:
        """Automatically archive query if past expiry date"""
        if self.is_expired() and self.status == "pending":
            self.status = "archived"
            self.save(update_fields=["status"])
            return True
        return False

    def to_dict(self):
        """Serialize to dict for API responses"""
        return {
            "id": str(self.id),
            "account": {
                "id": str(self.account.id),
                "account_name": self.account.account_name,
                "name": self.account.account_name,
            }
            if self.account
            else None,
            "item_name": {
                "id": str(self.item_name.id),
                "name": self.item_name.name,
            }
            if self.item_name
            else None,
            "gold_carat": self.gold_carat,
            "gender": self.gender,
            "size": self.size,
            "location": self.location,
            "delivery_type": self.delivery_type,
            "query_in_date": self.query_in_date.isoformat(),
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
            "reference_image": self.reference_image.url if self.reference_image else None,
            "status": self.status,
            "is_expired": self.is_expired(),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class OrderIssue(models.Model):
    """Order Issue model - Manufacturing instructions for orders"""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("resolved", "Resolved"),
        ("closed", "Closed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Foreign key to original order (optional - can create standalone)
    order = models.ForeignKey(
        "vouchers.Order",
        on_delete=models.CASCADE,
        related_name="order_issues",
        null=True,
        blank=True,
    )

    # Denormalized fields from order (for quick access)
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_issues",
    )
    item_name = models.ForeignKey(
        "core.ItemNameMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_issues",
    )

    # Manufacturing specifications
    metal = models.CharField(
        max_length=50, blank=True, null=True, help_text="Gold Karat (e.g., 22K, 18K)"
    )
    total_size = models.CharField(
        max_length=100, blank=True, null=True, help_text="Size/Dimensions"
    )
    base_metal_colour = models.CharField(
        max_length=100, blank=True, null=True, help_text="Base Metal Color"
    )
    rhodium_instructions = models.TextField(
        blank=True, null=True, help_text="Rhodium plating instructions"
    )
    prong_style = models.CharField(max_length=100, blank=True, null=True, help_text="Prong style")
    locking_system = models.CharField(
        max_length=100, blank=True, null=True, help_text="Locking system"
    )
    final_finish = models.CharField(
        max_length=100, blank=True, null=True, help_text="Final finish type"
    )
    additional_notes = models.TextField(
        blank=True, null=True, help_text="Additional manufacturing notes"
    )

    # Legacy fields
    order_ref = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    description = models.TextField(blank=True, null=True)

    # Metadata
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_order_issues",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "order_issues"
        ordering = ["-created_at"]
        verbose_name = "Order Issue"
        verbose_name_plural = "Order Issues"
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["status"]),
            models.Index(fields=["order"]),
        ]

    def __str__(self) -> str:
        bill_no = self.order.bill_no if self.order else "Unknown"
        return f"Order Issue: {bill_no}"

    def to_dict(self):
        """Serialize to dict for API responses"""
        return {
            "id": str(self.id),
            "order": {
                "id": str(self.order.id),
                "bill_no": self.order.bill_no,
            }
            if self.order
            else None,
            "account": {
                "id": str(self.account.id),
                "account_name": self.account.account_name,
                "name": self.account.account_name,
            }
            if self.account
            else None,
            "item_name": {
                "id": str(self.item_name.id),
                "name": self.item_name.name,
            }
            if self.item_name
            else None,
            "order_ref": self.order_ref,
            "status": self.status,
            "description": self.description,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class RepairIssue(models.Model):
    """Repair Issue records under Issues app"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="repair_issues"
    )
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="repair_issues",
    )
    tag_no = models.TextField(null=True, blank=True)
    item_name = models.ForeignKey(
        "core.ItemNameMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="repair_issues",
    )
    piece = models.IntegerField(null=True, blank=True)
    remark = models.TextField(null=True, blank=True)
    stamp = models.ForeignKey(
        "core.StampMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="repair_issues",
    )

    gr_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    net_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    tunch = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    wstg = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    rate = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    total = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_repair_issues"
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_repair_issues",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "repair_issues"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"RepairIssue {self.tag_no or str(self.id)}"
