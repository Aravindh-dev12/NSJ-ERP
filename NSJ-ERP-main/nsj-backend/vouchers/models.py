import uuid
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone


class OrderSequence(models.Model):
    """
    Tracks sequential numbering for each order type prefix.
    Ensures thread-safe, concurrent order ID generation.
    """

    ORDER_TYPE_CHOICES = [
        ("STOCK_JEWELRY", "Stock Jewelry"),
        ("BESPOKE_NATURAL", "Bespoke Natural Jewelry"),
        ("BESPOKE_CVD", "Bespoke CVD Jewelry"),
        ("LOOSE_DIAMONDS", "Loose Diamonds"),
        ("STOCK_PURCHASE", "Stock Purchase (Raw Material)"),
    ]

    order_type = models.CharField(
        max_length=50,
        choices=ORDER_TYPE_CHOICES,
        unique=True,
        help_text="Order type or material sequence key (e.g. STOCK_JEWELRY, MAT_DIA, MAT_GEM)",
    )
    current_sequence = models.PositiveIntegerField(
        default=0, help_text="Current sequence number for this order type"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "order_sequences"
        verbose_name = "Order Sequence"
        verbose_name_plural = "Order Sequences"

    def __str__(self):
        prefix_mapping = {
            "STOCK_JEWELRY": "A",
            "BESPOKE_NATURAL": "B",
            "BESPOKE_CVD": "C",
            "LOOSE_DIAMONDS": "D",
        }
        prefix = prefix_mapping.get(self.order_type, "?")
        return f"{self.get_order_type_display()} ({prefix}) - Next: {prefix}{self.current_sequence + 1:04d}"


class Order(models.Model):
    # Choices mirror the frontend "Add Order" (voucher) form dropdowns
    SERIES_CHOICES = [
        ("DEFAULT", "Default"),
        ("S1", "S1"),
        ("S2", "S2"),
    ]

    STAMP_CHOICES = [
        ("", "None"),
        ("22K", "22K"),
        ("18K", "18K"),
    ]

    BASE_METAL_CHOICES = [
        ("YELLOW_GOLD", "Yellow Gold"),
        ("WHITE_GOLD", "White Gold"),
        ("ROSE_GOLD", "Rose Gold"),
        ("SILVER_ALLOY", "Silver Alloy"),
        ("PLATINUM", "Platinum"),
        ("TITANIUM", "Titanium"),
    ]

    # Order Type choices for auto-generated Order ID prefixes
    ORDER_TYPE_CHOICES = [
        ("STOCK_JEWELRY", "Stock Jewelry"),
        ("BESPOKE_NATURAL", "Bespoke Natural Jewelry"),
        ("BESPOKE_CVD", "Bespoke CVD Jewelry"),
        ("LOOSE_DIAMONDS", "Loose Diamonds"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Tenant scoping
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE, related_name="vouchers")
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vouchers",
    )

    # Basic fields requested
    series = models.CharField(max_length=32, null=True, blank=True, choices=SERIES_CHOICES)
    date = models.DateField(null=True, blank=True)
    bill_no = models.CharField(max_length=64, null=True, blank=True, unique=True)

    # Order Type for auto-generated Order ID (NEW FIELD)
    order_type = models.CharField(
        max_length=20,
        choices=ORDER_TYPE_CHOICES,
        default="STOCK_JEWELRY",
        help_text="Order type determines the Order ID prefix (A/B/C/D)",
    )

    item_name = models.TextField(null=True, blank=True)
    design = models.TextField(null=True, blank=True)
    job_no = models.CharField(max_length=64, null=True, blank=True, unique=True)
    # Optional uploaded file (image / pdf) attached to the order
    upload_file = models.FileField(upload_to="order_uploads/", null=True, blank=True)
    # Stamp values are backed by dynamic masters (StampMaster) returned to the frontend.
    # Keep this as a simple CharField so frontend-provided stamp names/codes (e.g. "BEADS")
    # can be stored without triggering Django/DRF choices validation failures.
    stamp = models.CharField(max_length=64, null=True, blank=True)

    gold_rate = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    # Base metal is provided from BaseMetalMaster. Store as free text to allow
    # display names (e.g. "Yellow Gold") or codes from the frontend without
    # failing model-level choice validation.
    base_metal = models.CharField(max_length=64, null=True, blank=True)
    # rhodium_instruction removed: not used by frontend Add Order form
    size = models.CharField(max_length=64, null=True, blank=True)

    number_of_pieces = models.IntegerField(default=1, validators=[MinValueValidator(1)])

    # New order line / weight fields (added for improved Order Add UI)
    # Keep these nullable to remain backward-compatible with existing records.
    item_name_fk = models.ForeignKey(
        "core.ItemNameMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders_itemname",
    )
    stamp_fk = models.ForeignKey(
        "core.StampMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders_stamp",
    )
    size_fk = models.ForeignKey(
        "core.SizeMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders_size",
    )
    pc = models.IntegerField(null=True, blank=True)
    wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    unit = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    rate_item = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    discount = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, default=0)
    value_item = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    estimated_gross_weight = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    estimated_gold_weight = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    estimated_diamond_weight = models.DecimalField(max_digits=12, decimal_places=3, default=0)

    tunch_percent = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    average_diamond_rate = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    gemstone_stone_weight = models.DecimalField(max_digits=12, decimal_places=3, default=0)

    craftsmanship_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Advance payment: store as a simple choice YES/NO to match frontend dropdown
    ADVANCE_CHOICES = [
        ("YES", "Yes"),
        ("NO", "No"),
    ]

    advance_payment_received = models.CharField(
        max_length=3, choices=ADVANCE_CHOICES, null=True, blank=True, default="NO"
    )

    # Audit
    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_vouchers"
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_vouchers",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # keep existing DB table name to avoid an automatic table rename/migration
        db_table = "vouchers"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order {self.bill_no or self.id}"

    def to_dict(self):
        """Serialize to dict for API responses"""
        return {
            "id": str(self.id),
            "bill_no": self.bill_no,
            "job_no": self.job_no,
            "item_name": self.item_name,
            "account": {
                "id": str(self.account.id),
                "account_name": self.account.account_name,
            }
            if self.account
            else None,
            "item_name_fk": {
                "id": str(self.item_name_fk.id),
                "name": self.item_name_fk.name,
            }
            if self.item_name_fk
            else None,
            "date": self.date.isoformat() if self.date else None,
            "gold_rate": float(self.gold_rate),
            "base_metal": self.base_metal,
            "size": self.size,
            "advance_payment_received": self.advance_payment_received,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def save(self, *args, **kwargs):
        # Auto-detect order type based on item name if not explicitly set
        if not hasattr(self, "_order_type_manually_set") and self.item_name:
            from .order_type_detector import OrderTypeDetector

            detected_type = OrderTypeDetector.detect_order_type(self.item_name)

            # Only auto-set if order_type is still default or empty
            if not self.order_type or self.order_type == "STOCK_JEWELRY":
                self.order_type = detected_type

        # Auto-generate Order ID (bill_no) using production-safe sequence generator
        if not self.bill_no:
            from .order_id_generator import OrderIDGenerator

            try:
                # Generate Order ID based on order_type (now auto-detected)
                self.bill_no = OrderIDGenerator.generate_order_id(self.order_type)
            except Exception as e:
                # Fallback to old method if auto-generation fails
                import logging

                logger = logging.getLogger(__name__)
                logger.error(f"Order ID auto-generation failed: {str(e)}. Using fallback method.")

                prefix = (
                    getattr(self.company, "code", "V") if getattr(self, "company", None) else "V"
                )
                import uuid as _uuid

                self.bill_no = f"{prefix}-{_uuid.uuid4().hex[:10].upper()}"

        # Auto-generate job_no if not provided (keep existing logic)
        if not self.job_no:
            # Ensure job_no is unique even when multiple orders are created in the same second.
            # Use a UUID4-based suffix rather than relying on timestamp alone.
            import uuid as _uuid

            self.job_no = f"JOB-{_uuid.uuid4().hex[:12].upper()}"

        # advance_payment_received is optional for sales; do not enforce presence here.

        super().save(*args, **kwargs)


# Backwards compatibility: some code imports `Voucher` elsewhere. Keep a name pointing to the same model class.
Voucher = Order


class Archives(models.Model):
    """Archived orders for entries where advance_payment_received = NO.

    This mirrors the `Order` model so archived records keep the same shape
    while being stored separately from active orders.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Tenant scoping
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE, related_name="archives")
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="archives",
    )

    series = models.CharField(max_length=32, null=True, blank=True, choices=Order.SERIES_CHOICES)
    date = models.DateField(null=True, blank=True)
    bill_no = models.CharField(max_length=64, null=True, blank=True)

    item_name = models.TextField(null=True, blank=True)
    design = models.TextField(null=True, blank=True)
    job_no = models.CharField(max_length=64, null=True, blank=True)
    stamp = models.CharField(max_length=64, null=True, blank=True)
    # Optional uploaded file (image / pdf) attached to the archived order
    upload_file = models.FileField(upload_to="order_uploads/", null=True, blank=True)

    gold_rate = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    base_metal = models.CharField(max_length=64, null=True, blank=True)
    size = models.CharField(max_length=64, null=True, blank=True)

    number_of_pieces = models.IntegerField(default=1, validators=[MinValueValidator(1)])

    estimated_gross_weight = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    estimated_gold_weight = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    estimated_diamond_weight = models.DecimalField(max_digits=12, decimal_places=3, default=0)

    tunch_percent = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    average_diamond_rate = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    gemstone_stone_weight = models.DecimalField(max_digits=12, decimal_places=3, default=0)

    craftsmanship_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    ADVANCE_CHOICES = [
        ("YES", "Yes"),
        ("NO", "No"),
    ]

    advance_payment_received = models.CharField(
        max_length=3, choices=ADVANCE_CHOICES, null=True, blank=True, default="NO"
    )

    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_archives"
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_archives",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "archives"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Archive {self.bill_no or self.id}"


class Sale(models.Model):
    """Backend model for Sales section (matches frontend Sales Add New form)."""

    # These options are now backed by backend-manageable master tables.
    # Keep the DB storage flexible (CharField) so values added in admin
    # can be stored without model-level choices validation.

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    company = models.ForeignKey("core.Company", on_delete=models.CASCADE, related_name="sales")
    # Optional account link kept for parity with other models
    account = models.ForeignKey(
        "accounts.Account", on_delete=models.SET_NULL, null=True, blank=True, related_name="sales"
    )

    tag_no = models.CharField(max_length=64, null=True, blank=True)
    item_name = models.CharField(max_length=128, null=True, blank=True)
    shape = models.CharField(max_length=64, null=True, blank=True)
    clarity = models.CharField(max_length=32, null=True, blank=True)
    order_no = models.CharField(max_length=64, null=True, blank=True)
    # stamp values are backed by core.StampMaster; store as free text
    stamp = models.CharField(max_length=64, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    batch = models.CharField(max_length=64, null=True, blank=True)
    unit = models.CharField(max_length=32, null=True, blank=True)

    piece = models.IntegerField(null=True, blank=True)
    gr_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    net_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    rate = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    # Selected estimate for this sale (for estimate comparison workflow)
    selected_estimate = models.ForeignKey(
        "vouchers.EstimateVoucher",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="selected_for_sales",
    )

    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_sales"
    )
    updated_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="updated_sales"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sales"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Sale {self.order_no or self.id}"


class ApprovalLooseM(models.Model):
    """Payment -> Approval Loose M entries for Purchase workflows."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="approval_loose_m"
    )
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approval_loose_m",
    )
    item_name = models.ForeignKey(
        "core.ItemNameMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approval_loose_m",
    )
    order_number = models.CharField(max_length=128, null=True, blank=True)
    stamp = models.ForeignKey(
        "core.StampMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approval_loose_m",
    )
    remark = models.TextField(null=True, blank=True)

    piece = models.IntegerField(null=True, blank=True)
    gross_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    net_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    unit = models.ForeignKey(
        "core.UnitMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approval_loose_m",
    )
    tunch = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    rate = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_approval_loose_m"
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_approval_loose_m",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "approval_loose_m"
        ordering = ["-created_at"]

    def __str__(self):
        return f"ApprovalLooseM {self.order_number or self.id}"


class ApprovalTagM(models.Model):
    """Payment -> Approval Tag M entries for Purchase workflows."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="approval_tag_m"
    )
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approval_tag_m",
    )
    item_name = models.ForeignKey(
        "core.ItemNameMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approval_tag_m",
    )
    order_number = models.CharField(max_length=128, null=True, blank=True)
    stamp = models.ForeignKey(
        "core.StampMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approval_tag_m",
    )
    remark = models.TextField(null=True, blank=True)
    design = models.CharField(max_length=256, null=True, blank=True)

    unit = models.ForeignKey(
        "core.UnitMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approval_tag_m",
    )
    piece = models.IntegerField(null=True, blank=True)
    gross_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    net_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    tunch = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    rate = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_approval_tag_m"
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_approval_tag_m",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "approval_tag_m"
        ordering = ["-created_at"]

    def __str__(self):
        return f"ApprovalTagM {self.order_number or self.id}"


class PurAndApprovalM(models.Model):
    """Payment -> Pur and Approval M entries for Purchase workflows."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="pur_and_approval_m"
    )
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pur_and_approval_m",
    )
    tag_no = models.CharField(max_length=128, null=True, blank=True)
    item_name = models.ForeignKey(
        "core.ItemNameMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pur_and_approval_m",
    )
    order_no = models.CharField(max_length=128, null=True, blank=True)
    remark = models.TextField(null=True, blank=True)

    unit = models.ForeignKey(
        "core.UnitMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pur_and_approval_m",
    )
    piece = models.IntegerField(null=True, blank=True)
    shape = models.ForeignKey(
        "core.ShapeMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pur_and_approval_m",
    )
    gross_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    net_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    divide = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    tunch = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    wstg = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    rate = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_pur_and_approval_m",
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_pur_and_approval_m",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pur_and_approval_m"
        ordering = ["-created_at"]

    def __str__(self):
        return f"PurAndApprovalM {self.order_no or self.id}"


class PurReturn(models.Model):
    """Purchase Return records used by the Pur. Return frontend module.

    Fields are chosen to match the frontend Add-New form and follow existing
    voucher patterns: tenant-scoped company, optional account FK, audit fields,
    and readable FK references to core master tables.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="pur_returns"
    )
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pur_returns",
    )

    tag_no = models.CharField(max_length=128, null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    # Link to ItemNameMaster so frontend-selected item ids map cleanly
    item_name = models.ForeignKey(
        "core.ItemNameMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pur_returns",
    )
    order_no = models.CharField(max_length=128, null=True, blank=True)
    stamp = models.ForeignKey(
        "core.StampMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pur_returns",
    )
    remark = models.TextField(null=True, blank=True)

    unit = models.ForeignKey(
        "core.UnitMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pur_returns",
    )
    piece = models.IntegerField(null=True, blank=True)
    gr_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    net_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    divide = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    tunch = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    wstg = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    rate = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    mrp = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    shape = models.ForeignKey(
        "core.ShapeMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pur_returns",
    )
    clarity = models.ForeignKey(
        "core.ClarityMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pur_returns",
    )
    category = models.CharField(max_length=256, null=True, blank=True)

    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_pur_returns"
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_pur_returns",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pur_return"
        ordering = ["-created_at"]

    def __str__(self):
        return f"PurReturn {self.order_no or self.tag_no or self.id}"


class SalesReturn(models.Model):
    """Sales Return records used by the Sales Return frontend module.

    This mirrors `PurReturn` exactly but is stored in a separate DB table
    (`sales_return`) and uses distinct related_name values so it remains
    fully isolated from PurReturn and other voucher models.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="sales_returns"
    )
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_returns",
    )

    tag_no = models.CharField(max_length=128, null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    item_name = models.ForeignKey(
        "core.ItemNameMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_returns",
    )
    order_no = models.CharField(max_length=128, null=True, blank=True)
    stamp = models.ForeignKey(
        "core.StampMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_returns",
    )
    remark = models.TextField(null=True, blank=True)

    unit = models.ForeignKey(
        "core.UnitMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_returns",
    )
    piece = models.IntegerField(null=True, blank=True)
    gr_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    net_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    divide = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    tunch = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    wstg = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    rate = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    mrp = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    shape = models.ForeignKey(
        "core.ShapeMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_returns",
    )
    clarity = models.ForeignKey(
        "core.ClarityMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_returns",
    )
    category = models.CharField(max_length=256, null=True, blank=True)

    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_sales_returns"
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_sales_returns",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sales_return"
        ordering = ["-created_at"]

    def __str__(self):
        return f"SalesReturn {self.order_no or self.tag_no or self.id}"


class Receive(models.Model):
    """Receive records for the Receive section (tenant-scoped)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE, related_name="receives")
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="receives",
    )

    date = models.DateField(null=True, blank=True)
    tag_no = models.CharField(max_length=128, null=True, blank=True)
    # Link to ItemNameMaster so frontend-selected item ids map cleanly
    item_name = models.ForeignKey(
        "core.ItemNameMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="receives",
    )
    remark = models.TextField(null=True, blank=True)
    stamp = models.ForeignKey(
        "core.StampMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="receives",
    )

    unit = models.ForeignKey(
        "core.UnitMaster", on_delete=models.SET_NULL, null=True, blank=True, related_name="receives"
    )
    pc = models.IntegerField(null=True, blank=True)
    gr_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    net_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    tunch = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    wstg = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    rate = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    total = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_receives"
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_receives",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "receive"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Receive {self.tag_no or self.id}"


class PurchaseM(models.Model):
    """Purchase M entries (similar to PurAndApprovalM)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE, related_name="purchase_m")
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_m",
    )
    tag_no = models.CharField(max_length=128, null=True, blank=True)
    item_name = models.ForeignKey(
        "core.ItemNameMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_m",
    )
    order_no = models.CharField(max_length=128, null=True, blank=True)
    stamp = models.ForeignKey(
        "core.StampMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_m",
    )
    remark = models.TextField(null=True, blank=True)

    piece = models.IntegerField(null=True, blank=True)
    gr_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    net_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    unit = models.ForeignKey(
        "core.UnitMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_m",
    )
    tunch = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    rate = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    bill_no = models.CharField(max_length=128, null=True, blank=True)
    proof_image = models.ImageField(upload_to="purchase_proofs/", null=True, blank=True)

    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_purchase_m"
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_purchase_m",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "purchase_m"
        ordering = ["-created_at"]

    def __str__(self):
        return f"PurchaseM {self.order_no or self.id}"


class PurchaseTagwiseM(models.Model):
    """Purchase Tagwise M entries"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="purchase_tagwise_m"
    )
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_tagwise_m",
    )
    item_name = models.ForeignKey(
        "core.ItemNameMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_tagwise_m",
    )
    order_no = models.CharField(max_length=128, null=True, blank=True)
    stamp = models.ForeignKey(
        "core.StampMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_tagwise_m",
    )
    remark = models.TextField(null=True, blank=True)
    design = models.CharField(max_length=256, null=True, blank=True)

    unit = models.ForeignKey(
        "core.UnitMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_tagwise_m",
    )
    piece = models.IntegerField(null=True, blank=True)
    gr_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    net_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    tunch = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    rate = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    supplier_name = models.CharField(max_length=256, null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    bill_no = models.CharField(max_length=128, null=True, blank=True)
    proof_image = models.ImageField(upload_to="purchase_proofs/", null=True, blank=True)

    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_purchase_tagwise_m",
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_purchase_tagwise_m",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "purchase_tagwise_m"
        ordering = ["-created_at"]

    def __str__(self):
        return f"PurchaseTagwiseM {self.order_no or self.id}"


class PurchaseDiamond(models.Model):
    """Payment -> Purchase Diamond entries for Purchase workflows."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="purchase_diamond"
    )
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_diamond",
    )
    item_name = models.ForeignKey(
        "core.ItemNameMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_diamond",
    )
    batch = models.CharField(max_length=128, null=True, blank=True)
    shape = models.ForeignKey(
        "core.ShapeMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_diamond",
    )
    size = models.ForeignKey(
        "core.SizeMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_diamond",
    )
    colour = models.ForeignKey(
        "core.ColourMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_diamond",
    )
    clarity = models.ForeignKey(
        "core.ClarityMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_diamond",
    )

    piece = models.IntegerField(null=True, blank=True)
    wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    less_percent = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)
    ex_rate = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    remark = models.TextField(null=True, blank=True)
    inr_ct = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    lab = models.ForeignKey(
        "core.LabMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_diamond",
    )
    proof_image = models.ImageField(upload_to="purchase_proofs/", null=True, blank=True)

    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_purchase_diamond"
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_purchase_diamond",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "purchase_diamond"
        ordering = ["-created_at"]

    def __str__(self):
        return f"PurchaseDiamond {self.batch or self.id}"


class Repair(models.Model):
    """Repair records (similar shape to Order/Sale)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE, related_name="repairs")
    account = models.ForeignKey(
        "accounts.Account", on_delete=models.SET_NULL, null=True, blank=True, related_name="repairs"
    )
    date = models.DateField(null=True, blank=True)
    type = models.CharField(max_length=128, null=True, blank=True)
    tag_no = models.CharField(max_length=128, null=True, blank=True)
    item_name = models.ForeignKey(
        "core.ItemNameMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="repairs",
    )
    remark = models.CharField(max_length=512, null=True, blank=True)
    stamp = models.ForeignKey(
        "core.StampMaster", on_delete=models.SET_NULL, null=True, blank=True, related_name="repairs"
    )

    gr_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    net_wt = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    rate = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    piece = models.IntegerField(null=True, blank=True)
    total = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    supplier = models.CharField(max_length=256, null=True, blank=True)

    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_repairs"
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_repairs",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "repairs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Repair {self.tag_no or self.id}"


class PaymentEntry(models.Model):
    """Generic payment voucher entry used by the frontend Payment module."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE, related_name="payments")
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )
    date = models.DateField(null=True, blank=True)
    # Cr/Dr
    TYPE_CHOICES = [("Cr", "Cr"), ("Dr", "Dr")]
    type = models.CharField(max_length=2, choices=TYPE_CHOICES, null=True, blank=True)
    # party (another account)
    party = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments_as_party",
    )
    # optional sub-account (link to SubAccount if available)
    sub_account = models.ForeignKey(
        "accounts.SubAccount",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )

    balance = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    dr = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    cr = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    narration = models.TextField(null=True, blank=True)
    total = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    proof_image = models.ImageField(upload_to="payment_proofs/", null=True, blank=True)

    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_payments"
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_payments",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payments_entries"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Payment {self.id} ({self.date})"


class JournalEntry(models.Model):
    """Generic journal voucher entry used by the frontend Journal module."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE, related_name="journals")
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="journals",
    )
    date = models.DateField(null=True, blank=True)
    TYPE_CHOICES = [("Cr", "Cr"), ("Dr", "Dr")]
    type = models.CharField(max_length=2, choices=TYPE_CHOICES, null=True, blank=True)
    party = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="journals_as_party",
    )
    sub_account = models.ForeignKey(
        "accounts.SubAccount",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="journals",
    )

    balance = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    dr = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    cr = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    narration = models.TextField(null=True, blank=True)
    total = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_journals"
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_journals",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "journals_entries"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Journal {self.id} ({self.date})"


class Receipt(models.Model):
    """Receipt voucher header. Credit side = one party from Accounts master."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE, related_name="receipts")

    # Voucher metadata
    voucher_no = models.CharField(max_length=50, null=True, blank=True)
    series = models.CharField(max_length=50, null=True, blank=True, default="RECEIPT M")
    date = models.DateField(null=True, blank=True)

    # Credit party (Accounts master)
    party_name = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="receipts_as_party",
    )
    # Credit amount & balance for the credit row
    cr = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    balance = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    # Common narration
    narration = models.TextField(null=True, blank=True)

    # Legacy single-row fields kept for backward compat
    type = models.CharField(
        max_length=2, choices=[("Cr", "Cr"), ("Dr", "Dr")], null=True, blank=True
    )
    dr = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_receipts"
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_receipts",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "receipt"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Receipt {self.voucher_no or self.id}"


class ReceiptDebitEntry(models.Model):
    """One debit row in a receipt voucher (Cash / Bank account)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    receipt = models.ForeignKey(Receipt, on_delete=models.CASCADE, related_name="debit_entries")

    # Debit party – Cash or Bank account from Accounts master
    party = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="receipt_debit_entries",
    )
    balance = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    dr = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    narration = models.TextField(null=True, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "receipt_debit_entry"
        ordering = ["order"]

    def __str__(self):
        return f"DebitEntry {self.id} Dr={self.dr}"


# ---------------------------------------------------------------------------
# Voucher Sequence – single counter per voucher type per company
# ---------------------------------------------------------------------------


class VoucherSequence(models.Model):
    """Tracks the highest voucher number ever issued per type per company.
    Never decrements, so deletions don't reset the counter.
    """

    VOUCHER_TYPES = [
        ("RECEIPT", "Receipt"),
        ("PAYMENT", "Payment"),
        ("JOURNAL", "Journal"),
        ("CONTRA", "Contra"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="voucher_sequences"
    )
    voucher_type = models.CharField(max_length=20, choices=VOUCHER_TYPES)
    last_number = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "voucher_sequence"
        unique_together = [["company", "voucher_type"]]

    @classmethod
    def next(cls, company, voucher_type):
        """Atomically increment and return the next voucher number.
        Uses F() expression to avoid select_for_update which locks SQLite.
        """
        from django.db import transaction

        with transaction.atomic():
            updated = cls.objects.filter(company=company, voucher_type=voucher_type).update(
                last_number=models.F("last_number") + 1
            )
            if not updated:
                cls.objects.get_or_create(
                    company=company,
                    voucher_type=voucher_type,
                    defaults={"last_number": 1},
                )
            return cls.objects.get(company=company, voucher_type=voucher_type).last_number

    @classmethod
    def peek(cls, company, voucher_type):
        """Return what the next number will be WITHOUT consuming it (safe read-only)."""
        obj = cls.objects.filter(company=company, voucher_type=voucher_type).first()
        return (obj.last_number if obj else 0) + 1

    def __str__(self):
        return f"{self.voucher_type} seq={self.last_number}"


# ---------------------------------------------------------------------------
# Payment voucher (header = one Dr party; multiple Cr entries)
# ---------------------------------------------------------------------------


class PaymentVoucher(models.Model):
    """Payment voucher header. Debit side = one party from Accounts master."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="payment_vouchers"
    )
    voucher_no = models.CharField(max_length=50, null=True, blank=True)
    series = models.CharField(max_length=50, null=True, blank=True, default="PAYMENT M")
    date = models.DateField(null=True, blank=True)
    # Debit party (Accounts master)
    party_name = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payment_vouchers_as_party",
    )
    dr = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    balance = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    narration = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_payment_vouchers"
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_payment_vouchers",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payment_voucher"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Payment {self.voucher_no or self.id}"


class PaymentCreditEntry(models.Model):
    """One credit row in a payment voucher (Cash / Bank account)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.ForeignKey(
        PaymentVoucher, on_delete=models.CASCADE, related_name="credit_entries"
    )
    party = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payment_credit_entries",
    )
    balance = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    cr = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    narration = models.TextField(null=True, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "payment_credit_entry"
        ordering = ["order"]

    def __str__(self):
        return f"PaymentCrEntry {self.id} Cr={self.cr}"


# ---------------------------------------------------------------------------
# Journal voucher (header = one Dr party; multiple Cr entries)
# ---------------------------------------------------------------------------


class JournalVoucher(models.Model):
    """Journal voucher header. Debit side = one party from Accounts master."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="journal_vouchers"
    )
    voucher_no = models.CharField(max_length=50, null=True, blank=True)
    series = models.CharField(max_length=50, null=True, blank=True, default="JOURNAL M")
    date = models.DateField(null=True, blank=True)
    # Debit party (Accounts master)
    party_name = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="journal_vouchers_as_party",
    )
    dr = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    balance = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    narration = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_journal_vouchers"
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_journal_vouchers",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "journal_voucher"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Journal {self.voucher_no or self.id}"


class JournalCreditEntry(models.Model):
    """One credit row in a journal voucher (any Accounts master party)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    journal = models.ForeignKey(
        JournalVoucher, on_delete=models.CASCADE, related_name="credit_entries"
    )
    party = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="journal_credit_entries",
    )
    balance = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    cr = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    narration = models.TextField(null=True, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "journal_credit_entry"
        ordering = ["order"]

    def __str__(self):
        return f"JournalCrEntry {self.id} Cr={self.cr}"


# ---------------------------------------------------------------------------
# Contra voucher (Cash/Bank ↔ Cash/Bank; multiple Cr entries)
# ---------------------------------------------------------------------------


class ContraVoucher(models.Model):
    """Contra voucher header. Debit side = Cash or Bank (internal, no account master link)."""

    ACCOUNT_TYPE_CHOICES = [("CASH", "Cash"), ("BANK", "Bank")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="contra_vouchers"
    )
    voucher_no = models.CharField(max_length=50, null=True, blank=True)
    series = models.CharField(max_length=50, null=True, blank=True, default="CONTRA M")
    date = models.DateField(null=True, blank=True)
    # Debit side: Cash or Bank (from Accounts master)
    party_name = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contra_debit_vouchers",
    )
    dr = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    balance = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    narration = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_contra_vouchers"
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_contra_vouchers",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "contra_voucher"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Contra {self.voucher_no or self.id}"


class ContraCreditEntry(models.Model):
    """One credit row in a contra voucher (Cash or Bank, internal choice)."""

    ACCOUNT_TYPE_CHOICES = [("CASH", "Cash"), ("BANK", "Bank")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contra = models.ForeignKey(
        ContraVoucher, on_delete=models.CASCADE, related_name="credit_entries"
    )
    party = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contra_credit_entries",
    )
    balance = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    cr = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    narration = models.TextField(null=True, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "contra_credit_entry"
        ordering = ["order"]

    def __str__(self):
        return f"ContraCrEntry {self.id} Cr={self.cr}"


class EstimateVoucher(models.Model):
    """Estimate Voucher for jewelry cost estimates with multiple line items."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="estimate_vouchers"
    )
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="estimate_vouchers",
    )
    # Link to sub account for detailed customer tracking
    sub_account_record = models.ForeignKey(
        "accounts.SubAccount",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="estimate_vouchers",
        help_text="Sub account for detailed customer tracking",
    )
    # Link to sales query for multiple estimates per query
    sales_query = models.ForeignKey(
        "sales_queries.SalesQuery",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="estimates",
    )
    # Link to sale for estimates created from Sale form
    sale = models.ForeignKey(
        "vouchers.Sale",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="estimates",
    )
    item_name = models.CharField(max_length=255)
    date = models.DateField()
    total_taxable_value = models.DecimalField(max_digits=14, decimal_places=2)
    gst_amount = models.DecimalField(max_digits=14, decimal_places=2)
    grand_total = models.DecimalField(max_digits=14, decimal_places=2)

    # Customer details for PDF generation (copied from sale/sales_query at creation)
    sub_account = models.CharField(max_length=255, blank=True, null=True)
    phone_number = models.CharField(max_length=50, blank=True, null=True)
    sales_person_name = models.CharField(max_length=255, blank=True, null=True)
    
    # NSJ Representative field to track who created the estimate
    nsj_representative = models.CharField(max_length=255, blank=True, null=True)
    
    # Expiry date for the estimate
    expiry_date = models.DateField(null=True, blank=True)

    # Jewellery details from sales query
    jewellery_type = models.CharField(max_length=255, blank=True, null=True)
    gold_quality = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text="Gold purity in KT (e.g., 18KT, 22KT, 24KT) - supports hardcoded dropdown or custom input",
    )
    size_details = models.TextField(blank=True, null=True)

    # Estimate status for workflow
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("sent", "Sent to Customer"),
        ("selected", "Selected"),
        ("rejected", "Rejected"),
        ("archived", "Archived"),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")

    # Soft delete flag for archiving
    is_archived = models.BooleanField(default=False)

    # Product image for estimate (optional)
    product_image = models.ImageField(
        upload_to="estimate_images/",
        null=True,
        blank=True,
        help_text="Product image for the estimate",
    )

    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_estimates"
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_estimates",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "estimate_vouchers"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Estimate {self.item_name} - {self.id}"


class EstimateLineItem(models.Model):
    """Line items for estimate vouchers."""

    UNIT_CHOICES = [
        ("CT", "Carat"),
        ("GM", "Gram"),
        ("PC", "Piece"),
    ]

    RAW_MATERIAL_CHOICES = [
        ("Diamond", "Diamond"),
        ("Gemstone", "Gemstone"),
        ("Gold", "Gold"),
        ("Craftsmanship", "Craftsmanship Fee"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    estimate = models.ForeignKey(
        EstimateVoucher,
        on_delete=models.CASCADE,
        related_name="line_items",
    )
    particulars = models.CharField(max_length=255)
    shape = models.CharField(max_length=50, blank=True)
    colour = models.CharField(max_length=50, blank=True)
    clarity = models.CharField(max_length=50, blank=True)
    pc = models.IntegerField(null=True, blank=True)  # Piece count
    weight = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
    )
    unit = models.CharField(
        max_length=10,
        choices=UNIT_CHOICES,
        blank=True,
    )
    rate = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    order = models.IntegerField(default=0)  # For maintaining order

    # New fields for raw material tracking and compulsory items
    is_compulsory = models.BooleanField(
        default=False
    )  # Flag for permanent line items (Gold, Craftsmanship)
    raw_material = models.CharField(
        max_length=20,
        choices=RAW_MATERIAL_CHOICES,
        blank=True,
        null=True,
    )  # Raw material type for auto-unit selection

    class Meta:
        db_table = "estimate_line_items"
        ordering = ["order"]

    def __str__(self):
        return f"{self.particulars} - {self.amount}"


class RawMaterialPurchase(models.Model):
    """Raw Material Purchase entries for all material types (Diamond, Gemstone, Gold, etc.)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="raw_material_purchases"
    )

    # Date and Supplier
    date = models.DateField(null=True, blank=True)
    supplier = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="raw_material_purchases_as_supplier",
    )

    # Order ID and DIA. ID
    order_id = models.CharField(max_length=128, null=True, blank=True)
    dia_id = models.CharField(max_length=128, null=True, blank=True)  # Auto-generated by ERP

    # Material Type (Diamond, Gemstone, Metal, Other)
    material_type = models.ForeignKey(
        "core.MetalTypeMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="raw_material_purchases",
        help_text="Type of material: Diamond, Gemstone, Metal, etc.",
    )

    # Common fields for all material types
    master_size = models.CharField(
        max_length=128, null=True, blank=True, help_text="Master size details"
    )
    master_size_fk = models.ForeignKey(
        "core.SizeMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="raw_material_purchases_master_size",
        help_text="Master size from SizeMaster",
    )
    origin = models.CharField(max_length=128, null=True, blank=True, help_text="Origin of material")
    carat_weight = models.DecimalField(
        max_digits=12, decimal_places=3, null=True, blank=True, help_text="Carat weight"
    )
    number_of_pieces = models.IntegerField(null=True, blank=True, help_text="Number of pieces")
    certificate_number = models.CharField(
        max_length=128, null=True, blank=True, help_text="Certificate number"
    )
    additional_details = models.TextField(null=True, blank=True, help_text="Additional details")
    size = models.CharField(max_length=128, null=True, blank=True, help_text="Size details")
    fluorescence = models.CharField(
        max_length=128, null=True, blank=True, help_text="Fluorescence details"
    )
    purchase_budget_total = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True, help_text="Purchase budget total"
    )
    purchase_budget_per_carat = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Purchase budget per carat",
    )
    suggested_supplier = models.CharField(
        max_length=256, null=True, blank=True, help_text="Suggested supplier"
    )

    # Diamond specifications (existing fields)
    shape = models.ForeignKey(
        "core.ShapeMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="raw_material_purchases",
    )
    carat = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    colour = models.ForeignKey(
        "core.ColourMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="raw_material_purchases",
    )
    clarity = models.ForeignKey(
        "core.ClarityMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="raw_material_purchases",
    )
    cut = models.CharField(max_length=128, null=True, blank=True)
    pol = models.CharField(max_length=128, null=True, blank=True)
    sym = models.CharField(max_length=128, null=True, blank=True)
    flouro = models.CharField(max_length=128, null=True, blank=True)

    # FK versions of cut/pol/sym for proper master data linking
    cut_fk = models.ForeignKey(
        "core.CutMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="raw_material_purchases_cut",
        help_text="Cut grade from master",
    )
    pol_fk = models.ForeignKey(
        "core.PolishMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="raw_material_purchases_pol",
        help_text="Polish grade from master",
    )
    sym_fk = models.ForeignKey(
        "core.SymmetryMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="raw_material_purchases_sym",
        help_text="Symmetry grade from master",
    )

    # Lab and Certificate (existing fields)
    lab = models.ForeignKey(
        "core.LabMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="raw_material_purchases",
    )
    cert_no = models.CharField(max_length=128, null=True, blank=True)

    # Gemstone specific fields
    gemstone_type = models.CharField(
        max_length=128, null=True, blank=True, help_text="Type of gemstone"
    )
    gemstone_shape = models.CharField(
        max_length=128, null=True, blank=True, help_text="Gemstone shape"
    )
    gemstone_carat_weight = models.DecimalField(
        max_digits=12, decimal_places=3, null=True, blank=True, help_text="Gemstone carat weight"
    )
    gemstone_number_of_pieces = models.IntegerField(
        null=True, blank=True, help_text="Number of gemstone pieces"
    )
    gemstone_color = models.CharField(
        max_length=128, null=True, blank=True, help_text="Gemstone color"
    )
    gemstone_clarity = models.CharField(
        max_length=128, null=True, blank=True, help_text="Gemstone clarity"
    )
    gemstone_treatment = models.CharField(
        max_length=128, null=True, blank=True, help_text="Gemstone treatment"
    )
    gemstone_lab = models.CharField(max_length=128, null=True, blank=True, help_text="Gemstone lab")
    gemstone_lab_fk = models.ForeignKey(
        "core.LabMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="raw_material_purchases_gemstone_lab",
        help_text="Gemstone lab from LabMaster",
    )
    gemstone_certificate_number = models.CharField(
        max_length=128, null=True, blank=True, help_text="Gemstone certificate number"
    )
    gemstone_additional_details = models.TextField(
        null=True, blank=True, help_text="Gemstone additional details"
    )
    gemstone_cut = models.CharField(max_length=128, null=True, blank=True, help_text="Gemstone cut")
    gemstone_size = models.CharField(
        max_length=128, null=True, blank=True, help_text="Gemstone size"
    )
    gemstone_purchase_budget_total = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Gemstone purchase budget total",
    )
    gemstone_purchase_budget_per_carat = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Gemstone purchase budget per carat",
    )
    gemstone_suggested_supplier = models.CharField(
        max_length=256, null=True, blank=True, help_text="Gemstone suggested supplier"
    )

    # Gold specific fields
    gold_purity = models.CharField(
        max_length=128, null=True, blank=True, help_text="Gold purity (e.g., 24K, 22K, 18K)"
    )
    gold_weight = models.DecimalField(
        max_digits=12, decimal_places=3, null=True, blank=True, help_text="Gold weight in grams"
    )
    gold_mode = models.CharField(
        max_length=128, null=True, blank=True, help_text="Gold mode (Cast, Mill, etc.)"
    )
    gold_suggested_supplier = models.CharField(
        max_length=256, null=True, blank=True, help_text="Gold suggested supplier"
    )

    # Unified metal fields (for Gold, Silver, Platinum)
    metal_weight_grams = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        null=True,
        blank=True,
        help_text="Metal weight in grams (unified field)",
    )
    metal_purity = models.CharField(
        max_length=128,
        null=True,
        blank=True,
        help_text="Metal purity details (e.g., 999, 925, 99.9%)",
    )
    price_per_gram = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Price per gram from live rates",
    )
    total_metal_value = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Total metal value (weight × price per gram)",
    )

    # Enhanced purity fields
    kt_value = models.IntegerField(
        null=True, blank=True, help_text="KT value for gold (24, 22, 18, etc.)"
    )
    purity_percent = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, help_text="Purity percentage"
    )
    purity_notes = models.TextField(null=True, blank=True, help_text="Additional purity notes")

    # Cut dimensions (for gemstones and diamonds)
    cut_length = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True, help_text="Cut length in mm"
    )
    cut_width = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True, help_text="Cut width in mm"
    )
    cut_height = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True, help_text="Cut height in mm"
    )

    # Mode selection (for metals)
    mode_cash = models.BooleanField(default=False, help_text="Cash mode selected")
    mode_bill = models.BooleanField(default=False, help_text="Bill mode selected")

    # Origin type
    origin_type = models.CharField(
        max_length=100, null=True, blank=True, help_text="Origin type (Natural/CVD/Synthetic)"
    )

    # MISSING DIAMOND FIELDS - Adding based on requirements
    sieve_size = models.CharField(
        max_length=128, null=True, blank=True, help_text="Sieve size for diamonds"
    )
    color_additional_info = models.TextField(
        null=True, blank=True, help_text="Additional color information beyond D-Z scale"
    )

    # Enhanced diamond-specific fields
    diamond_number_of_pieces = models.IntegerField(
        null=True, blank=True, help_text="Number of diamond pieces (whole numbers only)"
    )
    diamond_additional_details = models.TextField(
        null=True, blank=True, help_text="Additional details for diamonds"
    )
    diamond_size = models.CharField(
        max_length=128, null=True, blank=True, help_text="Diamond size/sieve size"
    )

    # Enhanced budget fields with USD conversion
    purchase_budget_total_usd = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Purchase budget total in USD (converted from INR)",
    )
    purchase_budget_per_carat_usd = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Purchase budget per carat in USD (auto-calculated)",
    )

    # MISSING GEMSTONE FIELDS - Adding based on requirements
    gemstone_size_mm = models.CharField(
        max_length=128, null=True, blank=True, help_text="Gemstone size in mm"
    )

    # Foreign key references to new master tables
    gemstone_type_fk = models.ForeignKey(
        "core.GemstoneMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="raw_material_purchases_gemstone_type",
        help_text="Gemstone type from master",
    )
    gemstone_shape_fk = models.ForeignKey(
        "core.GemstoneShapeMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="raw_material_purchases_gemstone_shape",
        help_text="Gemstone shape from master",
    )
    gemstone_color_fk = models.ForeignKey(
        "core.GemstoneColorMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="raw_material_purchases_gemstone_color",
        help_text="Gemstone color from master",
    )
    gemstone_clarity_fk = models.ForeignKey(
        "core.GemstoneClarityMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="raw_material_purchases_gemstone_clarity",
        help_text="Gemstone clarity from master",
    )
    gemstone_treatment_fk = models.ForeignKey(
        "core.GemstoneTreatmentMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="raw_material_purchases_gemstone_treatment",
        help_text="Gemstone treatment from master",
    )
    origin_fk = models.ForeignKey(
        "core.OriginMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="raw_material_purchases_origin",
        help_text="Origin from master",
    )

    # Pricing (existing fields)
    rap = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)  # RAP ($)
    discount = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )  # Percentage
    price_per_ct_usd = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True
    )  # PRICE/CT ($)
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_per_ct_inr = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True
    )  # Auto-calculated
    total = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True
    )  # Auto-calculated

    # Proof image
    proof_image = models.ImageField(upload_to="raw_material_proofs/", null=True, blank=True)

    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_raw_material_purchases",
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_raw_material_purchases",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "raw_material_purchases"
        ordering = ["-created_at"]

    def __str__(self):
        return f"RawMaterialPurchase {self.dia_id or self.id}"

    def get_material_specific_fields(self):
        """Return fields relevant to the selected material type."""
        if not self.material_type:
            return {}

        material_name = self.material_type.name.lower()

        if material_name == "diamond":
            return {
                "shape": self.shape,
                "carat": self.carat,
                "colour": self.colour,
                "clarity": self.clarity,
                "cut": self.cut,
                "pol": self.pol,
                "sym": self.sym,
                "flouro": self.flouro,
                "lab": self.lab,
                "cert_no": self.cert_no,
                "rap": self.rap,
                "discount": self.discount,
                "price_per_ct_usd": self.price_per_ct_usd,
                "fluorescence": self.fluorescence,
                # NEW: Added missing diamond fields
                "diamond_number_of_pieces": self.diamond_number_of_pieces,
                "diamond_additional_details": self.diamond_additional_details,
                "diamond_size": self.diamond_size,
                "sieve_size": self.sieve_size,
                "purchase_budget_total_usd": self.purchase_budget_total_usd,
                "purchase_budget_per_carat_usd": self.purchase_budget_per_carat_usd,
            }
        elif material_name == "gemstone":
            return {
                "gemstone_type": self.gemstone_type,
                "gemstone_shape": self.gemstone_shape,
                "gemstone_carat_weight": self.gemstone_carat_weight,
                "gemstone_number_of_pieces": self.gemstone_number_of_pieces,
                "gemstone_color": self.gemstone_color,
                "gemstone_clarity": self.gemstone_clarity,
                "gemstone_treatment": self.gemstone_treatment,
                "gemstone_lab": self.gemstone_lab,
                "gemstone_certificate_number": self.gemstone_certificate_number,
                "gemstone_cut": self.gemstone_cut,
                "gemstone_size": self.gemstone_size,
                "gemstone_purchase_budget_total": self.gemstone_purchase_budget_total,
                "gemstone_purchase_budget_per_carat": self.gemstone_purchase_budget_per_carat,
                "gemstone_suggested_supplier": self.gemstone_suggested_supplier,
                "gemstone_additional_details": self.gemstone_additional_details,
            }
        elif material_name == "gold":
            return {
                "gold_purity": self.gold_purity,
                "gold_weight": self.gold_weight,
                "gold_mode": self.gold_mode,
                "gold_suggested_supplier": self.gold_suggested_supplier,
            }

        return {}

    def save(self, *args, **kwargs):
        # Auto-generate dia_id if not provided
        if not self.dia_id:
            try:
                from .order_id_generator import OrderIDGenerator

                if self.material_type and self.material_type.name:
                    self.dia_id = OrderIDGenerator.generate_material_purchase_id(
                        self.material_type.name
                    )
                else:
                    self.dia_id = OrderIDGenerator.generate_order_id("STOCK_PURCHASE")
            except Exception:
                import uuid

                self.dia_id = f"RMP-{uuid.uuid4().hex[:8].upper()}"

        # Auto-fetch exchange rate if not provided but price_per_ct_usd is provided
        if self.price_per_ct_usd and not self.exchange_rate:
            self.exchange_rate = self.get_current_exchange_rate()

        # Auto-calculate price_per_ct_inr if not set
        if self.price_per_ct_usd and self.exchange_rate and not self.price_per_ct_inr:
            from decimal import Decimal

            # Convert exchange_rate to Decimal to avoid float/Decimal multiplication error
            exchange_rate_decimal = Decimal(str(self.exchange_rate))
            self.price_per_ct_inr = self.price_per_ct_usd * exchange_rate_decimal

        # Auto-calculate total if not set
        if self.carat and self.price_per_ct_inr and not self.total:
            self.total = self.carat * self.price_per_ct_inr

        # NEW: Auto-calculate purchase budget per carat for diamonds
        if (
            self.purchase_budget_total
            and self.diamond_number_of_pieces
            and self.carat
            and not self.purchase_budget_per_carat
        ):
            from decimal import Decimal

            total_carats = Decimal(str(self.diamond_number_of_pieces)) * self.carat
            if total_carats > 0:
                self.purchase_budget_per_carat = self.purchase_budget_total / total_carats

        # NEW: Auto-convert purchase budget to USD
        if self.purchase_budget_total and self.exchange_rate and not self.purchase_budget_total_usd:
            from decimal import Decimal

            exchange_rate_decimal = Decimal(str(self.exchange_rate))
            self.purchase_budget_total_usd = self.purchase_budget_total / exchange_rate_decimal

        # NEW: Auto-calculate purchase budget per carat in USD
        if (
            self.purchase_budget_per_carat
            and self.exchange_rate
            and not self.purchase_budget_per_carat_usd
        ):
            from decimal import Decimal

            exchange_rate_decimal = Decimal(str(self.exchange_rate))
            self.purchase_budget_per_carat_usd = (
                self.purchase_budget_per_carat / exchange_rate_decimal
            )

        # NEW: Auto-calculate gemstone budget per carat
        if (
            self.gemstone_purchase_budget_total
            and self.gemstone_number_of_pieces
            and self.gemstone_carat_weight
            and not self.gemstone_purchase_budget_per_carat
        ):
            from decimal import Decimal

            total_carats = Decimal(str(self.gemstone_number_of_pieces)) * self.gemstone_carat_weight
            if total_carats > 0:
                self.gemstone_purchase_budget_per_carat = (
                    self.gemstone_purchase_budget_total / total_carats
                )

        # NEW: Auto-convert gemstone budget to USD (use shared USD fields)
        if (
            self.gemstone_purchase_budget_total
            and self.exchange_rate
            and not self.purchase_budget_total_usd
        ):
            from decimal import Decimal

            exchange_rate_decimal = Decimal(str(self.exchange_rate))
            self.purchase_budget_total_usd = (
                self.gemstone_purchase_budget_total / exchange_rate_decimal
            )

        # NEW: Auto-calculate gemstone budget per carat in USD
        if (
            self.gemstone_purchase_budget_per_carat
            and self.exchange_rate
            and not self.purchase_budget_per_carat_usd
        ):
            from decimal import Decimal

            exchange_rate_decimal = Decimal(str(self.exchange_rate))
            self.purchase_budget_per_carat_usd = (
                self.gemstone_purchase_budget_per_carat / exchange_rate_decimal
            )

        # NEW: Gold calculation implementation
        # Auto-calculate gold total based on weight and price per gram
        if self.gold_weight and not self.total:
            # Get live gold rate based on KT value or use manual price per gram
            price_per_gram = None

            # Try to get live rate based on KT value
            if self.kt_value:
                live_rates = self.get_live_material_rate()
                if live_rates:
                    if self.kt_value == 24:
                        price_per_gram = live_rates.get("24k", 7900)
                    elif self.kt_value == 22:
                        price_per_gram = live_rates.get("22k", 7200)
                    elif self.kt_value == 18:
                        price_per_gram = live_rates.get("18k", 5900)
                    else:
                        # For other KT values, calculate proportionally from 24K
                        base_24k = live_rates.get("24k", 7900)
                        price_per_gram = base_24k * (self.kt_value / 24)

            # If no live rate available, use fallback rates
            if not price_per_gram:
                if self.kt_value == 24:
                    price_per_gram = 7900  # Fallback 24K rate
                elif self.kt_value == 22:
                    price_per_gram = 7200  # Fallback 22K rate
                elif self.kt_value == 18:
                    price_per_gram = 5900  # Fallback 18K rate
                else:
                    price_per_gram = 7900 * (self.kt_value / 24) if self.kt_value else 7900

            # Calculate total: Weight × Price Per Gram
            if price_per_gram:
                from decimal import Decimal

                price_decimal = Decimal(str(price_per_gram))
                self.total = self.gold_weight * price_decimal

        # NEW: Silver calculation implementation
        if (
            self.material_type
            and self.material_type.name.lower() == "silver"
            and self.gold_weight
            and not self.total
        ):
            # Get live silver rate or use fallback
            live_rates = self.get_live_material_rate()
            price_per_gram = (
                live_rates if isinstance(live_rates, (int, float)) else 95.50
            )  # Fallback silver rate

            from decimal import Decimal

            price_decimal = Decimal(str(price_per_gram))
            self.total = self.gold_weight * price_decimal

        # NEW: Platinum calculation implementation
        if (
            self.material_type
            and self.material_type.name.lower() == "platinum"
            and self.gold_weight
            and not self.total
        ):
            # Get live platinum rate or use fallback
            live_rates = self.get_live_material_rate()
            price_per_gram = (
                live_rates if isinstance(live_rates, (int, float)) else 3200
            )  # Fallback platinum rate

            from decimal import Decimal

            price_decimal = Decimal(str(price_per_gram))
            self.total = self.gold_weight * price_decimal

        super().save(*args, **kwargs)

    def get_current_exchange_rate(self):
        """Get current USD to INR exchange rate from live API or cache"""
        try:
            from django.core.cache import cache
            import requests

            # Try cache first
            cached_rate = cache.get("usd_inr_exchange")
            if cached_rate:
                return cached_rate.get("usd_to_inr", 83.0)

            # Fetch from API
            response = requests.get("https://api.exchangerate-api.com/v4/latest/USD", timeout=5)
            if response.status_code == 200:
                data = response.json()
                rate = data.get("rates", {}).get("INR", 83.0)

                # Cache for 10 minutes
                cache_data = {"usd_to_inr": rate, "cached": False}
                cache.set("usd_inr_exchange", cache_data, 600)

                return rate
        except Exception:
            pass

        # Fallback rate
        return 83.0

    def get_live_material_rate(self):
        """Get live rate for the material type"""
        if not self.material_type:
            return None

        try:
            from django.core.cache import cache
            import requests

            material_name = self.material_type.name.lower()

            if material_name == "gold":
                # Get gold rate
                cached_rate = cache.get("gold_rate_24k")
                if cached_rate:
                    return {
                        "24k": cached_rate.get("price_per_gram_24k", 7900),
                        "22k": cached_rate.get("price_per_gram_24k", 7900) * 0.916,  # Approximate
                        "18k": cached_rate.get("price_per_gram_24k", 7900) * 0.750,  # Approximate
                    }

                # Fetch fresh rate
                response = requests.get(
                    "https://www.goldapi.io/api/XAU/INR",
                    headers={"x-access-token": "goldapi-h03osmjmslj39-io"},
                    timeout=5,
                )
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "24k": data.get("price_gram_24k", 7900),
                        "22k": data.get("price_gram_22k", 7200),
                        "18k": data.get("price_gram_18k", 5900),
                    }

            elif material_name in ["silver", "platinum"]:
                # Get comprehensive rates
                live_rates = cache.get("live_rates_comprehensive")
                if live_rates:
                    return live_rates.get(material_name, {}).get("price_per_gram", 0)

        except Exception:
            pass

        return None


class RawMaterialInventory(models.Model):
    """
    Tracks current inventory levels for raw materials.
    Updated automatically when purchases are made or materials are issued.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="raw_material_inventory"
    )

    # Link to the original purchase
    purchase = models.OneToOneField(
        "RawMaterialPurchase",
        on_delete=models.CASCADE,
        related_name="inventory_record",
    )

    # Current available quantity (carat)
    available_carat = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    # Total issued quantity
    issued_carat = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    # Original purchased quantity
    original_carat = models.DecimalField(max_digits=12, decimal_places=3, default=0)

    # Status
    STATUS_CHOICES = [
        ("AVAILABLE", "Available"),
        ("PARTIALLY_ISSUED", "Partially Issued"),
        ("FULLY_ISSUED", "Fully Issued"),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="AVAILABLE")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "raw_material_inventory"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Inventory {self.purchase.dia_id} - {self.available_carat} ct available"

    def update_status(self):
        """Update status based on available quantity."""
        if self.available_carat <= 0:
            self.status = "FULLY_ISSUED"
        elif self.issued_carat > 0:
            self.status = "PARTIALLY_ISSUED"
        else:
            self.status = "AVAILABLE"
        self.save()


class RawMaterialIssuance(models.Model):
    """
    Records when raw materials are issued from inventory.
    Enforces no-negative-stock rule.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="raw_material_issuances"
    )

    # Link to inventory record
    inventory = models.ForeignKey(
        "RawMaterialInventory",
        on_delete=models.CASCADE,
        related_name="issuances",
    )

    # Job/Order this material is issued to
    job = models.ForeignKey(
        "Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="raw_material_issuances",
    )
    job_no = models.CharField(max_length=128, null=True, blank=True)

    # Quantity issued
    issued_carat = models.DecimalField(max_digits=12, decimal_places=3)

    # Issue details
    date = models.DateField()
    purpose = models.TextField(null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)

    # Audit
    issued_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="raw_material_issuances",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "raw_material_issuances"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Issuance {self.id} - {self.issued_carat} ct to {self.job_no or 'N/A'}"

    def save(self, *args, **kwargs):
        # Enforce no-negative-stock rule
        if not self.pk:  # New issuance
            if self.issued_carat > self.inventory.available_carat:
                raise ValueError(
                    f"Cannot issue {self.issued_carat} ct. Only {self.inventory.available_carat} ct available."
                )
        super().save(*args, **kwargs)


class DailyBookClose(models.Model):
    """
    Tracks daily book closing status.
    Prevents transactions after daily close.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="daily_book_closes"
    )

    date = models.DateField()
    is_closed = models.BooleanField(default=False)
    closed_at = models.DateTimeField(null=True, blank=True)
    closed_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="closed_books",
    )

    # Summary data at close
    total_purchases = models.IntegerField(default=0)
    total_issuances = models.IntegerField(default=0)
    total_purchase_value = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_tasks_completed = models.IntegerField(default=0)
    total_orders = models.IntegerField(default=0)

    notes = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "daily_book_closes"
        unique_together = ["company", "date"]
        ordering = ["-date"]

    def __str__(self):
        status = "Closed" if self.is_closed else "Open"
        return f"Books for {self.date} - {status}"


class DailyReport(models.Model):
    """
    Individual user daily reports submitted at end of day.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="daily_reports"
    )

    date = models.DateField()
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="daily_reports",
    )

    # Report content
    tasks_completed = models.IntegerField(default=0)
    tasks_pending = models.IntegerField(default=0)
    orders_processed = models.IntegerField(default=0)
    materials_issued = models.IntegerField(default=0)

    summary = models.TextField(null=True, blank=True)
    challenges = models.TextField(null=True, blank=True)
    next_day_plan = models.TextField(null=True, blank=True)

    is_submitted = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "daily_reports"
        unique_together = ["company", "date", "user"]
        ordering = ["-date", "user__name"]

    def __str__(self):
        return f"Report by {self.user.name} for {self.date}"


class ThreeDDesign(models.Model):
    """
    3D Design records for sales department.
    Tracks account/order ID, 3D design image, and approved design image.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="three_d_designs"
    )

    # Account & Order ID (text field that matches with DB)
    account_order_id = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="Account & Order ID matching database records",
    )

    # 3D Design Image
    design_image = models.ImageField(
        upload_to="3d_designs/", null=True, blank=True, help_text="3D Design Image"
    )

    # Approved 3D Design Image
    approved_design_image = models.ImageField(
        upload_to="3d_designs/approved/",
        null=True,
        blank=True,
        help_text="Approved 3D Design Image",
    )

    # Draft flag — True means saved without full validation (Save as Draft)
    is_draft = models.BooleanField(
        default=False,
        help_text="True when saved as draft (incomplete); False when fully saved",
    )

    selected_log_group = models.UUIDField(
        null=True,
        blank=True,
        help_text="Log group chosen as the final set of images (design)",
    )
    selected_secondary_log_group = models.UUIDField(
        null=True,
        blank=True,
        help_text="Log group chosen as the final set of images (approved)",
    )

    # Audit fields
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_three_d_designs",
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_three_d_designs",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "three_d_designs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"3D Design {self.account_order_id or self.id}"


class ThreeDPrintingCAM(models.Model):
    """
    3D Printing/CAM Piece records.
    Sales department creates, Production department has read-only access.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="three_d_printing_cam"
    )

    # Account & Order ID - validated against Order model
    account_order_id = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="Account & Order ID matching database records",
    )

    # Link to actual Order for validation
    order = models.ForeignKey(
        "Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="three_d_printing_cam_records",
        help_text="Validated order reference",
    )

    # Draft flag — True means saved without full validation (Save as Draft)
    is_draft = models.BooleanField(
        default=False,
        help_text="True when saved as draft (incomplete); False when fully saved",
    )

    # CAM Piece Image
    cam_piece_image = models.ImageField(
        upload_to="3d_printing_cam/", null=True, blank=True, help_text="CAM Piece Image"
    )

    # CAM Piece Quality Check
    cam_piece_quality_check = models.BooleanField(
        default=False, help_text="Yes/No checkbox for quality check"
    )

    # Steps if QC is No (list of reasons)
    qc_failure_reasons = models.TextField(
        null=True, blank=True, help_text="List of reasons if quality check fails"
    )

    # Approved CAM Piece
    approved_cam_piece = models.ImageField(
        upload_to="3d_printing_cam/approved/",
        null=True,
        blank=True,
        help_text="Approved CAM Piece Image",
    )

    # Carry-Forward Image
    carry_forward_image = models.ImageField(
        upload_to="3d_printing_cam/carry_forward/",
        null=True,
        blank=True,
        help_text="Carry-Forward Image",
    )

    selected_log_group = models.UUIDField(
        null=True,
        blank=True,
        help_text="Log group chosen as the final set of images (cam_piece)",
    )
    selected_secondary_log_group = models.UUIDField(
        null=True,
        blank=True,
        help_text="Log group chosen as the final set of images (approved_cam)",
    )

    # Audit fields
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_three_d_printing_cam",
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_three_d_printing_cam",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "three_d_printing_cam"
        ordering = ["-created_at"]

    def __str__(self):
        return f"3D Printing/CAM {self.account_order_id or self.id}"


class GhatApproval(models.Model):
    """
    Ghat Approval records.
    Tracks account/order ID and approval status with image.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="ghat_approvals"
    )

    # Account & Order ID - validated against Order model
    account_order_id = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="Account & Order ID matching database records",
    )

    # Link to actual Order for validation
    order = models.ForeignKey(
        "Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ghat_approvals",
        help_text="Validated order reference",
    )

    # Ghat Approval checkbox
    ghat_approval = models.BooleanField(
        default=False, help_text="Yes/No checkbox for ghat approval"
    )

    # Draft flag — True means saved without full validation (Save as Draft)
    is_draft = models.BooleanField(
        default=False,
        help_text="True when saved as draft (incomplete); False when fully saved",
    )

    # Carry-Forward Image
    carry_forward_image = models.ImageField(
        upload_to="ghat_approvals/", null=True, blank=True, help_text="Carry-Forward Image"
    )

    selected_log_group = models.UUIDField(
        null=True,
        blank=True,
        help_text="Log group chosen as the final set of images",
    )

    # Audit fields
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_ghat_approvals",
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_ghat_approvals",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ghat_approvals"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Ghat Approval {self.account_order_id or self.id}"


class GhatQualityCheck(models.Model):
    """
    Ghat Quality Check records for Production department.
    Tracks account/order ID and carry-forward image.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="ghat_quality_checks"
    )

    # Account & Order ID - validated against Order model
    account_order_id = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="Account & Order ID matching database records",
    )

    # Link to actual Order for validation
    order = models.ForeignKey(
        "Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ghat_quality_checks",
        help_text="Validated order reference",
    )

    # Carry-Forward Image
    carry_forward_image = models.ImageField(
        upload_to="ghat_quality_checks/", null=True, blank=True, help_text="Carry-Forward Image"
    )

    # Draft flag — True means saved without full validation (Save as Draft)
    is_draft = models.BooleanField(
        default=False,
        help_text="True when saved as draft (incomplete); False when fully saved",
    )

    selected_log_group = models.UUIDField(
        null=True,
        blank=True,
        help_text="Log group chosen as the final set of images",
    )

    # Audit fields
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_ghat_quality_checks",
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_ghat_quality_checks",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ghat_quality_checks"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Ghat Quality Check {self.account_order_id or self.id}"


class StoneDemandToBagging(models.Model):
    """
    Stone Demand to Bagging records for Production department.
    Tracks stone details with dropdowns and approved bagging list.
    """

    # Shape choices
    SHAPE_CHOICES = [
        ("ROUND", "Round"),
        ("PRINCESS", "Princess"),
        ("OVAL", "Oval"),
        ("CUSHION", "Cushion"),
        ("EMERALD", "Emerald"),
        ("PEAR", "Pear"),
        ("MARQUISE", "Marquise"),
        ("RADIANT", "Radiant"),
        ("ASSCHER", "Asscher"),
        ("HEART", "Heart"),
        ("TRILLION", "Trillion"),
        ("BAGUETTE", "Baguette"),
        ("ROSE_CUT", "Rose Cut"),
        ("OLD_MINE_CUT", "Old Mine Cut"),
        ("OLD_EUROPEAN_CUT", "Old European Cut"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="stone_demand_to_bagging"
    )

    # Account & Order ID - validated against Order model
    account_order_id = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="Account & Order ID matching database records",
    )

    # Link to actual Order for validation
    order = models.ForeignKey(
        "Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stone_demand_to_bagging",
        help_text="Validated order reference",
    )

    # New fields based on requirements
    diamond_color_stone = models.CharField(
        max_length=256, null=True, blank=True, help_text="Diamond/Color Stone"
    )

    batch_id = models.CharField(
        max_length=128, null=True, blank=True, help_text="Batch ID from Batch ID Master"
    )

    master_size = models.CharField(max_length=128, null=True, blank=True, help_text="Master Size")

    shape = models.CharField(
        max_length=64, choices=SHAPE_CHOICES, null=True, blank=True, help_text="Shape of the stone"
    )

    mm_size = models.CharField(max_length=64, null=True, blank=True, help_text="MM Size")

    no_of_pieces = models.IntegerField(null=True, blank=True, help_text="Number of pieces (1-100)")

    estimated_total_carat_weight = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        help_text="Estimated Total Carat Weight",
    )

    # Keep legacy JSON fields for backward compatibility
    measurement_details = models.JSONField(
        null=True, blank=True, help_text="Legacy: Multiple measurement details"
    )
    sent = models.JSONField(null=True, blank=True, help_text="Legacy: Multiple sent records")
    total = models.JSONField(null=True, blank=True, help_text="Legacy: Multiple total records")

    # Approved Bagging List Image
    approved_bagging_list = models.ImageField(
        upload_to="stone_demand_bagging/",
        null=True,
        blank=True,
        help_text="Approved Bagging List Image",
    )

    # Draft flag — True means saved without full validation (Save as Draft)
    is_draft = models.BooleanField(
        default=False,
        help_text="True when saved as draft (incomplete); False when fully saved",
    )

    # Carry-Forward Image (legacy, kept for compatibility)
    carry_forward_image = models.ImageField(
        upload_to="stone_demand_bagging/carry_forward/",
        null=True,
        blank=True,
        help_text="Carry-Forward Image",
    )

    selected_log_group = models.UUIDField(
        null=True,
        blank=True,
        help_text="Log group chosen as the final set of images (approved_bagging)",
    )
    selected_secondary_log_group = models.UUIDField(
        null=True,
        blank=True,
        help_text="Log group chosen as the final set of images (carry_forward)",
    )

    # Audit fields
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_stone_demand_to_bagging",
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_stone_demand_to_bagging",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "stone_demand_to_bagging"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Stone Demand to Bagging {self.account_order_id or self.id}"


class PreRhodiumQualityCheck(models.Model):
    """
    Pre-Rhodium Quality Check records for Production department.
    Tracks quality check status with image upload.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="pre_rhodium_quality_checks"
    )

    # Account & Order ID - validated against Order model
    account_order_id = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="Account & Order ID matching database records",
    )

    # Link to actual Order for validation
    order = models.ForeignKey(
        "Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pre_rhodium_quality_checks",
        help_text="Validated order reference",
    )

    # Quality Check - Yes/No checkbox
    quality_check = models.BooleanField(default=False, help_text="Quality Check (Yes/No)")

    # Quality Check Image
    quality_check_image = models.ImageField(
        upload_to="pre_rhodium_quality_checks/",
        null=True,
        blank=True,
        help_text="Quality Check Image",
    )

    # Draft flag — True means saved without full validation (Save as Draft)
    is_draft = models.BooleanField(
        default=False,
        help_text="True when saved as draft (incomplete); False when fully saved",
    )

    selected_log_group = models.UUIDField(
        null=True,
        blank=True,
        help_text="Log group chosen as the final set of images",
    )

    # Audit fields
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_pre_rhodium_quality_checks",
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_pre_rhodium_quality_checks",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pre_rhodium_quality_checks"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Pre-Rhodium Quality Check {self.account_order_id or self.id}"


class FinalQualityCheck(models.Model):
    """
    Final Quality Check records for Production department.
    Tracks final quality check status with image upload.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="final_quality_checks"
    )

    # Account & Order ID - validated against Order model
    account_order_id = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="Account & Order ID matching database records",
    )

    # Link to actual Order for validation
    order = models.ForeignKey(
        "Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="final_quality_checks",
        help_text="Validated order reference",
    )

    # Final Quality Check - Yes/No checkbox
    final_quality_check = models.BooleanField(
        default=False, help_text="Final Quality Check (Yes/No)"
    )

    # Final Quality Check Image
    final_quality_check_image = models.ImageField(
        upload_to="final_quality_checks/",
        null=True,
        blank=True,
        help_text="Final Quality Check Image",
    )

    # Draft flag — True means saved without full validation (Save as Draft)
    is_draft = models.BooleanField(
        default=False,
        help_text="True when saved as draft (incomplete); False when fully saved",
    )

    # Audit fields
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_final_quality_checks",
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_final_quality_checks",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "final_quality_checks"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Final Quality Check {self.account_order_id or self.id}"


class ItemFinalPackingList(models.Model):
    """
    Item with Final Packing List records for Production department.
    Tracks jewellery piece image for final packing.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="item_final_packing_lists"
    )

    # Account & Order ID - validated against Order model
    account_order_id = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="Account & Order ID matching database records",
    )

    # Link to actual Order for validation
    order = models.ForeignKey(
        "Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="item_final_packing_lists",
        help_text="Validated order reference",
    )

    # Jewellery Piece Image
    jewellery_piece_image = models.ImageField(
        upload_to="item_final_packing_lists/",
        null=True,
        blank=True,
        help_text="Jewellery Piece Image",
    )

    # Draft flag — True means saved without full validation (Save as Draft)
    is_draft = models.BooleanField(
        default=False,
        help_text="True when saved as draft (incomplete); False when fully saved",
    )

    selected_log_group = models.UUIDField(
        null=True,
        blank=True,
        help_text="Log group chosen as the final set of images",
    )

    # Audit fields
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_item_final_packing_lists",
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_item_final_packing_lists",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "item_final_packing_lists"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Item Final Packing List {self.account_order_id or self.id}"


class RawMaterialTally(models.Model):
    """
    Raw Material Tally records for Production department.
    Tracks raw material movement with carry-forward image.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="raw_material_tallies"
    )

    # Account & Order ID - validated against Order model
    account_order_id = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="Account & Order ID matching database records",
    )

    # Link to actual Order for validation
    order = models.ForeignKey(
        "Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="raw_material_tallies",
        help_text="Validated order reference",
    )

    # Carry-Forward Image
    carry_forward_image = models.ImageField(
        upload_to="raw_material_tallies/carry_forward/",
        null=True,
        blank=True,
        help_text="Carry-Forward Image",
    )

    # Raw Material Movement - stored as JSON for multiple entries
    # Format: [{"material": "Gold", "quantity": 10, "unit": "grams"}, ...]
    raw_material_movement = models.JSONField(
        null=True, blank=True, help_text="Multiple raw material movement records"
    )

    # Draft flag — True means saved without full validation (Save as Draft)
    is_draft = models.BooleanField(
        default=False,
        help_text="True when saved as draft (incomplete); False when fully saved",
    )

    selected_log_group = models.UUIDField(
        null=True,
        blank=True,
        help_text="Log group chosen as the final set of images",
    )

    # Audit fields
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_raw_material_tallies",
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_raw_material_tallies",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "raw_material_tallies"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Raw Material Tally {self.account_order_id or self.id}"


class MetalIssue(models.Model):
    """
    Metal Issue records for Raw Material department (Jinu Bhai).
    Tracks metal issue with carry-forward image.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="metal_issues"
    )

    # Account & Order ID - validated against Order model
    account_order_id = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="Account & Order ID matching database records",
    )

    # Link to actual Order for validation
    order = models.ForeignKey(
        "Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="metal_issues",
        help_text="Validated order reference",
    )

    # Carry-Forward Image
    carry_forward_image = models.ImageField(
        upload_to="metal_issues/carry_forward/",
        null=True,
        blank=True,
        help_text="Carry-Forward Image",
    )

    # Draft flag — True means saved without full validation (Save as Draft)
    is_draft = models.BooleanField(
        default=False,
        help_text="True when saved as draft (incomplete); False when fully saved",
    )

    # Audit fields
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_metal_issues",
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_metal_issues",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "metal_issues"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Metal Issue {self.account_order_id or self.id}"


class BaggingReady(models.Model):
    """
    Bagging Ready records for Raw Material department (Jinu Bhai - write access)
    and Production department (Sanjana - read access).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="bagging_ready"
    )

    # Account & Order ID - validated against Order model
    account_order_id = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="Account & Order ID matching database records",
    )

    # Link to actual Order for validation
    order = models.ForeignKey(
        "Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bagging_ready",
        help_text="Validated order reference",
    )

    # Carry-Forward Image
    carry_forward_image = models.ImageField(
        upload_to="bagging_ready/carry_forward/",
        null=True,
        blank=True,
        help_text="Carry-Forward Image",
    )

    # Draft flag — True means saved without full validation (Save as Draft)
    is_draft = models.BooleanField(
        default=False,
        help_text="True when saved as draft (incomplete); False when fully saved",
    )

    # Audit fields
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_bagging_ready",
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_bagging_ready",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bagging_ready"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Bagging Ready {self.account_order_id or self.id}"


class DiamondPurchaseIssue(models.Model):
    """
    Diamond Purchase/Issue records for Raw Material department (Jinu Bhai - write access)
    and Production department (Sanjana - read access).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="diamond_purchase_issue"
    )

    # Account & Order ID - validated against Order model
    account_order_id = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="Account & Order ID matching database records",
    )

    # Link to actual Order for validation
    order = models.ForeignKey(
        "Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="diamond_purchase_issue",
        help_text="Validated order reference",
    )

    # Carry-Forward Image
    carry_forward_image = models.ImageField(
        upload_to="diamond_purchase_issue/carry_forward/",
        null=True,
        blank=True,
        help_text="Carry-Forward Image",
    )

    # Draft flag — True means saved without full validation (Save as Draft)
    is_draft = models.BooleanField(
        default=False,
        help_text="True when saved as draft (incomplete); False when fully saved",
    )

    # Audit fields
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_diamond_purchase_issue",
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_diamond_purchase_issue",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "diamond_purchase_issue"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Diamond Purchase/Issue {self.account_order_id or self.id}"


class GemstonePurchaseIssue(models.Model):
    """
    Gemstone Purchase/Issue records for Raw Material department (Jinu Bhai - write access)
    and Production department (Sanjana - read access).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="gemstone_purchase_issue"
    )

    # Account & Order ID - validated against Order model
    account_order_id = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="Account & Order ID matching database records",
    )

    # Link to actual Order for validation
    order = models.ForeignKey(
        "Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gemstone_purchase_issue",
        help_text="Validated order reference",
    )

    # Carry-Forward Image
    carry_forward_image = models.ImageField(
        upload_to="gemstone_purchase_issue/carry_forward/",
        null=True,
        blank=True,
        help_text="Carry-Forward Image",
    )

    # Draft flag — True means saved without full validation (Save as Draft)
    is_draft = models.BooleanField(
        default=False,
        help_text="True when saved as draft (incomplete); False when fully saved",
    )

    # Audit fields
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_gemstone_purchase_issue",
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_gemstone_purchase_issue",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "gemstone_purchase_issue"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Gemstone Purchase/Issue {self.account_order_id or self.id}"


# ============================================================================
# INVOICE MODELS
# ============================================================================


class InvoiceSequence(models.Model):
    """
    Tracks sequential numbering for invoices per company.
    Ensures thread-safe, concurrent invoice number generation.
    """

    company = models.OneToOneField(
        "core.Company", on_delete=models.CASCADE, related_name="invoice_sequence"
    )
    current_sequence = models.PositiveIntegerField(
        default=0, help_text="Current sequence number for invoices"
    )
    prefix = models.CharField(
        max_length=10, default="INV", help_text="Prefix for invoice numbers (e.g., INV, BILL)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "invoice_sequences"
        verbose_name = "Invoice Sequence"
        verbose_name_plural = "Invoice Sequences"

    def __str__(self):
        return f"{self.company.name} - Next: {self.prefix}{self.current_sequence + 1:06d}"

    def get_next_invoice_number(self):
        """Generate next invoice number and increment sequence"""
        from django.db import transaction

        with transaction.atomic():
            # Lock the row for update
            sequence = InvoiceSequence.objects.select_for_update().get(id=self.id)
            sequence.current_sequence += 1
            sequence.save()
            return f"{sequence.prefix}{sequence.current_sequence:06d}"


class Invoice(models.Model):
    """
    Invoice model for completed sales.
    Pulls data from Sale, Estimate, and SalesQuery.
    """

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("sent", "Sent to Customer"),
        ("paid", "Paid"),
        ("partially_paid", "Partially Paid"),
        ("overdue", "Overdue"),
        ("cancelled", "Cancelled"),
    ]

    PAYMENT_TERMS_CHOICES = [
        ("immediate", "Immediate"),
        ("net_7", "Net 7 Days"),
        ("net_15", "Net 15 Days"),
        ("net_30", "Net 30 Days"),
        ("net_60", "Net 60 Days"),
        ("net_90", "Net 90 Days"),
        ("custom", "Custom"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Company and account
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE, related_name="invoices")
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices",
    )

    # Links to related records
    sale = models.ForeignKey(
        "Sale",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices",
        help_text="Link to the sale record",
    )
    estimate = models.ForeignKey(
        "EstimateVoucher",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices",
        help_text="Link to the estimate used",
    )
    sales_query = models.ForeignKey(
        "sales_queries.SalesQuery",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices",
        help_text="Link to the original sales query",
    )

    # Invoice identification
    invoice_number = models.CharField(
        max_length=50, unique=True, help_text="Auto-generated invoice number (e.g., INV000001)"
    )
    invoice_date = models.DateField(help_text="Date the invoice was issued")
    due_date = models.DateField(help_text="Payment due date")
    payment_terms = models.CharField(max_length=20, choices=PAYMENT_TERMS_CHOICES, default="net_30")

    # Customer information (copied from sales query for PDF generation)
    customer_name = models.CharField(max_length=255)
    sub_account = models.CharField(max_length=255, blank=True, null=True)
    phone_number = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    pan_gstin = models.CharField(max_length=50, blank=True, null=True)

    # Item details (from estimate)
    item_name = models.CharField(max_length=255)
    jewellery_type = models.CharField(max_length=255, blank=True, null=True)
    size_details = models.TextField(blank=True, null=True)

    # Sales person
    sales_person_name = models.CharField(max_length=255, blank=True, null=True)

    # Financial details
    subtotal = models.DecimalField(
        max_digits=14, decimal_places=2, validators=[MinValueValidator(0)]
    )
    gst_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=3.00, help_text="GST rate percentage"
    )
    gst_amount = models.DecimalField(
        max_digits=14, decimal_places=2, validators=[MinValueValidator(0)]
    )
    total_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Grand total including GST",
    )

    # Payment tracking
    amount_paid = models.DecimalField(
        max_digits=14, decimal_places=2, default=0.00, validators=[MinValueValidator(0)]
    )
    balance_due = models.DecimalField(
        max_digits=14, decimal_places=2, default=0.00, validators=[MinValueValidator(0)]
    )

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")

    # Additional information
    notes = models.TextField(blank=True, null=True, help_text="Internal notes (not shown on PDF)")
    terms_and_conditions = models.TextField(
        blank=True, null=True, help_text="Terms and conditions shown on invoice"
    )

    # Product image (optional)
    product_image = models.ImageField(
        upload_to="invoice_images/",
        null=True,
        blank=True,
        help_text="Product image for the invoice",
    )

    # Audit fields
    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_invoices"
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_invoices",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Soft delete
    is_deleted = models.BooleanField(default=False)

    class Meta:
        db_table = "invoices"
        ordering = ["-invoice_date", "-created_at"]
        indexes = [
            models.Index(fields=["invoice_number"]),
            models.Index(fields=["invoice_date"]),
            models.Index(fields=["status"]),
            models.Index(fields=["company", "invoice_date"]),
        ]

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.customer_name}"

    def save(self, *args, **kwargs):
        # Auto-generate invoice number if not set
        if not self.invoice_number:
            sequence, created = InvoiceSequence.objects.get_or_create(
                company=self.company, defaults={"prefix": "INV"}
            )
            self.invoice_number = sequence.get_next_invoice_number()

        # Calculate balance due
        self.balance_due = self.total_amount - self.amount_paid

        # Update status based on payment
        if self.amount_paid >= self.total_amount:
            self.status = "paid"
        elif self.amount_paid > 0:
            self.status = "partially_paid"
        elif self.status != "cancelled" and self.due_date:
            from django.utils import timezone

            if timezone.now().date() > self.due_date and self.status not in ["paid", "cancelled"]:
                self.status = "overdue"

        super().save(*args, **kwargs)


class InvoiceLineItem(models.Model):
    """
    Line items for invoices.
    Copied from estimate line items.
    """

    UNIT_CHOICES = [
        ("CT", "Carat"),
        ("GM", "Gram"),
        ("PC", "Piece"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="line_items")

    # Item details
    particulars = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    # Specifications
    shape = models.CharField(max_length=50, blank=True, null=True)
    colour = models.CharField(max_length=50, blank=True, null=True)
    clarity = models.CharField(max_length=50, blank=True, null=True)

    # Quantity and measurements
    quantity = models.IntegerField(
        default=1, validators=[MinValueValidator(1)], help_text="Piece count"
    )
    weight = models.DecimalField(
        max_digits=10, decimal_places=3, null=True, blank=True, help_text="Weight of the item"
    )
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, blank=True, null=True)

    # Pricing
    rate = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Rate per unit",
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Total amount for this line item",
    )

    # Display order
    order = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "invoice_line_items"
        ordering = ["order", "created_at"]

    def __str__(self):
        return f"{self.particulars} - ₹{self.amount}"

    def save(self, *args, **kwargs):
        # Auto-calculate amount if not set
        if self.rate and self.weight:
            self.amount = self.rate * self.weight
        elif self.rate and self.quantity:
            self.amount = self.rate * self.quantity

        super().save(*args, **kwargs)


class InvoicePayment(models.Model):
    """
    Payment records for invoices.
    Tracks all payments made against an invoice.
    """

    PAYMENT_METHOD_CHOICES = [
        ("cash", "Cash"),
        ("cheque", "Cheque"),
        ("bank_transfer", "Bank Transfer"),
        ("upi", "UPI"),
        ("card", "Credit/Debit Card"),
        ("other", "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")

    # Payment details
    payment_date = models.DateField()
    amount = models.DecimalField(
        max_digits=14, decimal_places=2, validators=[MinValueValidator(0.01)]
    )
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    reference_number = models.CharField(
        max_length=100, blank=True, null=True, help_text="Cheque number, transaction ID, etc."
    )
    notes = models.TextField(blank=True, null=True)

    # Audit
    recorded_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="recorded_payments"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "invoice_payments"
        ordering = ["-payment_date", "-created_at"]

    def __str__(self):
        return f"Payment ₹{self.amount} for {self.invoice.invoice_number}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        # Update invoice amount_paid
        from django.db.models import Sum

        total_paid = self.invoice.payments.aggregate(total=Sum("amount"))["total"] or 0

        self.invoice.amount_paid = total_paid
        self.invoice.save()


# ==================== Order Process Management Models ====================
# Query → Order Conversion Workflow
#
# BUSINESS FLOW:
# Query → Advance Received → Conversion Form → Process Step Confirmation → Order Creation
#
# CORE RULES:
# 1. Process steps must be finalized BEFORE order creation
# 2. Steps are editable ONLY during confirmation stage (before order)
# 3. After order creation: Steps are LOCKED_FOR_EDIT
# 4. After courier dispatch: Steps are FULLY_LOCKED
# 5. Auto status management: PENDING → IN_PROGRESS → COMPLETED


# Default 29 process steps (matching frontend TASK_ROUTES)
DEFAULT_ORDER_PROCESS_STEPS = [
    {
        "position": 1,
        "name": "Advance Received",
        "description": "Advance payment received from customer",
        "department": "Accounts",
    },
    {
        "position": 2,
        "name": "Generate Order ID",
        "description": "Generate unique order ID",
        "department": "Admin",
    },
    {
        "position": 3,
        "name": "2D Design Approval",
        "description": "Customer approves 2D design",
        "department": "Design",
    },
    {
        "position": 4,
        "name": "Estimate Approval",
        "description": "Customer approves estimate",
        "department": "Sales",
    },
    {
        "position": 5,
        "name": "Order Issue to Karigar",
        "description": "Issue order to karigar",
        "department": "Production",
    },
    {
        "position": 6,
        "name": "3D Design",
        "description": "Create 3D design model",
        "department": "Design",
    },
    {
        "position": 7,
        "name": "3D Design Approval",
        "description": "Customer approves 3D design",
        "department": "Design",
    },
    {
        "position": 8,
        "name": "3D Printing/CAM Piece",
        "description": "3D printing or CAM processing",
        "department": "Production",
    },
    {
        "position": 9,
        "name": "CAM Piece QC",
        "description": "Quality check for CAM piece",
        "department": "QC",
    },
    {
        "position": 10,
        "name": "CAM Piece Trial Approval",
        "description": "Customer trial approval for CAM piece",
        "department": "Sales",
    },
    {
        "position": 11,
        "name": "Stone Demand to Bagging",
        "description": "Stone demand to bagging department",
        "department": "Purchase",
    },
    {
        "position": 12,
        "name": "Metal Issue",
        "description": "Issue metal for production",
        "department": "Inventory",
    },
    {
        "position": 13,
        "name": "Casting",
        "description": "Metal casting process",
        "department": "Production",
    },
    {"position": 14, "name": "Ghat QC", "description": "Ghat quality check", "department": "QC"},
    {
        "position": 15,
        "name": "Ghat Trial Approval",
        "description": "Customer trial approval for ghat",
        "department": "Sales",
    },
    {
        "position": 16,
        "name": "Bagging Ready",
        "description": "Item ready for bagging",
        "department": "Production",
    },
    {
        "position": 17,
        "name": "Diamond Purchase/Issue",
        "description": "Diamond procurement and issue",
        "department": "Purchase",
    },
    {
        "position": 18,
        "name": "Gemstone Purchase/Issue",
        "description": "Gemstone procurement and issue",
        "department": "Purchase",
    },
    {
        "position": 19,
        "name": "Stone Setting",
        "description": "Set stones in jewelry",
        "department": "Production",
    },
    {
        "position": 20,
        "name": "Pre Rhodium QC",
        "description": "Quality check before rhodium",
        "department": "QC",
    },
    {
        "position": 21,
        "name": "Rhodium + Stamping",
        "description": "Rhodium plating and stamping",
        "department": "Production",
    },
    {
        "position": 22,
        "name": "Item with Final Packing List In",
        "description": "Item with final packing list",
        "department": "Packing",
    },
    {
        "position": 23,
        "name": "Raw Material Tally",
        "description": "Tally raw materials used",
        "department": "Inventory",
    },
    {
        "position": 24,
        "name": "Photo/Video for Catalogue",
        "description": "Product photography and videography",
        "department": "Marketing",
    },
    {
        "position": 25,
        "name": "Tagging",
        "description": "Tag the jewelry item",
        "department": "Admin",
    },
    {
        "position": 26,
        "name": "Certification",
        "description": "Generate authenticity certificate",
        "department": "Compliance",
    },
    {
        "position": 27,
        "name": "Invoice",
        "description": "Generate invoice",
        "department": "Accounts",
    },
    {
        "position": 28,
        "name": "Payment",
        "description": "Receive final payment",
        "department": "Accounts",
    },
    {
        "position": 29,
        "name": "Delivery",
        "description": "Deliver to customer",
        "department": "Logistics",
    },
]


class OrderDraft(models.Model):
    """
    Temporary draft during Query → Order conversion

    STAGE: Between "Conversion Form" and "Order Creation"
    PURPOSE: Hold data during process step confirmation
    """

    STATUS_CHOICES = [
        ("pending_confirmation", "Pending Confirmation"),  # User reviewing process steps
        ("confirmed", "Confirmed"),  # Order created
        ("cancelled", "Cancelled"),  # User cancelled
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source_sale = models.ForeignKey(
        "Sale", on_delete=models.CASCADE, related_name="order_drafts", null=True, blank=True
    )
    # Direct link to SalesQuery for easier lookup
    sales_query_id = models.UUIDField(
        null=True, blank=True, help_text="ID of the source Sales Query"
    )
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE)
    created_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True)

    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="pending_confirmation")

    # Receipt voucher (advance payment)
    receipt_voucher = models.ForeignKey(
        "Receipt", on_delete=models.SET_NULL, null=True, blank=True, related_name="order_drafts"
    )
    advance_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    advance_notes = models.TextField(blank=True)

    # Order data from conversion form
    order_data = models.JSONField(default=dict, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    # Link to final order (after confirmation)
    final_order = models.OneToOneField(
        "Order", on_delete=models.SET_NULL, null=True, blank=True, related_name="source_draft"
    )

    class Meta:
        db_table = "order_drafts"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["source_sale", "status"]),
            models.Index(fields=["company", "status"]),
        ]

    def __str__(self):
        return f"Draft for Sale {self.source_sale.id if self.source_sale else 'Direct'} - {self.status}"


class OrderProcessStep(models.Model):
    """
    Individual process step

    BUSINESS RULES:
    - Editable when attached to OrderDraft (before order creation)
    - Locked when attached to Order (after confirmation)
    - Auto status management: PENDING → IN_PROGRESS → COMPLETED
    """

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Can belong to either draft OR order (not both)
    order_draft = models.ForeignKey(
        OrderDraft, on_delete=models.CASCADE, related_name="process_steps", null=True, blank=True
    )
    order = models.ForeignKey(
        "Order", on_delete=models.CASCADE, related_name="process_steps", null=True, blank=True
    )

    # Step details
    step_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    department = models.CharField(max_length=100, blank=True)
    position = models.IntegerField()

    # Status tracking (AUTO-MANAGED)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    notes = models.TextField(blank=True)

    # Reference to related record (e.g., 3D Design ID, Receipt ID, etc.)
    reference_id = models.UUIDField(
        null=True, blank=True, help_text="ID of the related record (e.g., 3D Design, Receipt)"
    )

    # Save → Mark as Done tracking
    saved_at = models.DateTimeField(
        null=True, blank=True, help_text="When the step was saved (IN_PROGRESS)"
    )
    saved_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="saved_process_steps",
        help_text="User who saved the step",
    )
    marked_done_at = models.DateTimeField(
        null=True, blank=True, help_text="When the step was marked as done (COMPLETED)"
    )
    marked_done_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="completed_process_steps",
        help_text="User who marked the step as done",
    )

    # Next-step task assignment (set when marking this step as done)
    next_step_deadline = models.DateField(
        null=True,
        blank=True,
        help_text="Deadline for the next process step (set when marking this step done)",
    )
    next_step_assignee = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="next_step_assignments",
        help_text="User assigned to the next process step",
    )
    next_step_task = models.ForeignKey(
        "tasks.Task",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="triggered_by_step",
        help_text="Task created for the next step when this step was marked done",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "order_process_steps"
        ordering = ["position"]
        indexes = [
            models.Index(fields=["order_draft", "position"]),
            models.Index(fields=["order", "position"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        parent = f"Draft {self.order_draft.id}" if self.order_draft else f"Order {self.order.id}"
        return f"{parent} - Step {self.position}: {self.step_name}"


class OrderProcessLock(models.Model):
    """
    Lock mechanism for process steps

    LOCK LEVELS:
    1. LOCKED_FOR_EDIT: After order creation (no add/remove/reorder)
    2. FULLY_LOCKED: After courier dispatch (no changes at all)
    """

    LOCK_LEVEL_CHOICES = [
        ("UNLOCKED", "Unlocked"),  # During draft stage
        ("LOCKED_FOR_EDIT", "Locked for Edit"),  # After order creation
        ("FULLY_LOCKED", "Fully Locked"),  # After courier dispatch
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField("Order", on_delete=models.CASCADE, related_name="process_lock")

    lock_level = models.CharField(
        max_length=20, choices=LOCK_LEVEL_CHOICES, default="LOCKED_FOR_EDIT"
    )

    # Timestamps
    locked_at = models.DateTimeField(auto_now_add=True)
    locked_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True)

    # Courier dispatch tracking
    courier_dispatched = models.BooleanField(default=False)
    courier_dispatched_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "order_process_locks"

    def __str__(self):
        return f"Lock for Order {self.order.id} - {self.lock_level}"

    def upgrade_to_fully_locked(self):
        """Upgrade lock level when courier is dispatched"""
        self.lock_level = "FULLY_LOCKED"
        self.courier_dispatched = True
        self.courier_dispatched_at = timezone.now()


# ============================================================================
# IMAGE MODELS FOR MULTI-IMAGE SUPPORT
# ============================================================================


class ThreeDDesignImage(models.Model):
    """Image records for 3D Design - supports multiple images per field"""

    FIELD_TYPE_CHOICES = [
        ("design", "3D Design Image"),
        ("approved", "Approved 3D Design Image"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    three_d_design = models.ForeignKey(
        ThreeDDesign, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="3d_designs/multi/")
    field_type = models.CharField(max_length=20, choices=FIELD_TYPE_CHOICES)
    is_final_design = models.BooleanField(
        default=False, help_text="Is this the final design image?"
    )
    is_final_approved = models.BooleanField(
        default=False, help_text="Is this the final approved image?"
    )
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE)
    uploaded_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    log_group = models.UUIDField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Groups images saved in the same upload session",
    )

    class Meta:
        db_table = "three_d_design_images"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"3D Design Image - {self.field_type} ({self.three_d_design.account_order_id})"


class ThreeDPrintingCAMImage(models.Model):
    """Image records for 3D Printing/CAM - supports multiple images per field"""

    FIELD_TYPE_CHOICES = [
        ("cam_piece", "CAM Piece Image"),
        ("approved_cam", "Approved CAM Piece"),
        ("carry_forward", "Carry Forward Image"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    three_d_printing_cam = models.ForeignKey(
        ThreeDPrintingCAM, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="3d_printing_cam/multi/")
    field_type = models.CharField(max_length=20, choices=FIELD_TYPE_CHOICES)
    is_final = models.BooleanField(
        default=False, help_text="Is this the final image for this field?"
    )
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE)
    uploaded_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    log_group = models.UUIDField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Groups images saved in the same upload session",
    )

    class Meta:
        db_table = "three_d_printing_cam_images"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"3D Printing CAM Image - {self.field_type}"


class GhatApprovalImage(models.Model):
    """Image records for Ghat Approval"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ghat_approval = models.ForeignKey(GhatApproval, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="ghat_approvals/multi/")
    is_final = models.BooleanField(default=False)
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE)
    uploaded_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    log_group = models.UUIDField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Groups images saved in the same upload session",
    )

    class Meta:
        db_table = "ghat_approval_images"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"Ghat Approval Image"


class GhatQualityCheckImage(models.Model):
    """Image records for Ghat Quality Check"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ghat_quality_check = models.ForeignKey(
        GhatQualityCheck, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="ghat_quality_checks/multi/")
    is_final = models.BooleanField(default=False)
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE)
    uploaded_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    log_group = models.UUIDField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Groups images saved in the same upload session",
    )

    class Meta:
        db_table = "ghat_quality_check_images"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"Ghat QC Image"


class StoneDemandToBaggingImage(models.Model):
    """Image records for Stone Demand to Bagging - supports multiple images per field"""

    FIELD_TYPE_CHOICES = [
        ("approved_bagging", "Approved Bagging List"),
        ("carry_forward", "Carry Forward Image"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    stone_demand = models.ForeignKey(
        StoneDemandToBagging, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="stone_demand_bagging/multi/")
    field_type = models.CharField(max_length=20, choices=FIELD_TYPE_CHOICES)
    is_final = models.BooleanField(default=False)
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE)
    uploaded_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    log_group = models.UUIDField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Groups images saved in the same upload session",
    )

    class Meta:
        db_table = "stone_demand_to_bagging_images"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"Stone Demand Image - {self.field_type}"


class PreRhodiumQualityCheckImage(models.Model):
    """Image records for Pre Rhodium Quality Check"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pre_rhodium_qc = models.ForeignKey(
        PreRhodiumQualityCheck, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="pre_rhodium_quality_checks/multi/")
    is_final = models.BooleanField(default=False)
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE)
    uploaded_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    log_group = models.UUIDField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Groups images saved in the same upload session",
    )

    class Meta:
        db_table = "pre_rhodium_quality_check_images"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"Pre Rhodium QC Image"


class ItemFinalPackingListImage(models.Model):
    """Image records for Item Final Packing List"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    packing_list = models.ForeignKey(
        ItemFinalPackingList, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="item_final_packing_lists/multi/")
    is_final = models.BooleanField(default=False)
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE)
    uploaded_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    log_group = models.UUIDField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Groups images saved in the same upload session",
    )

    class Meta:
        db_table = "item_final_packing_list_images"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"Packing List Image"


class RawMaterialTallyImage(models.Model):
    """Image records for Raw Material Tally"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    raw_material_tally = models.ForeignKey(
        RawMaterialTally, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="raw_material_tallies/multi/")
    is_final = models.BooleanField(default=False)
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE)
    uploaded_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    log_group = models.UUIDField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Groups images saved in the same upload session",
    )

    class Meta:
        db_table = "raw_material_tally_images"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"Raw Material Tally Image"


class TwoDDesign(models.Model):
    """
    2D Design records - parallel to ThreeDDesign.
    Tracks account/order ID, 2D design image, and approved design image.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, related_name="two_d_designs"
    )

    # Account & Order ID (text field that matches with DB)
    account_order_id = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="Account & Order ID matching database records",
    )

    # Link to Order for validation
    order = models.ForeignKey(
        "Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="two_d_designs",
        help_text="Order reference",
    )

    # Draft flag — True means saved without full validation (Save as Draft)
    is_draft = models.BooleanField(
        default=False,
        help_text="True when saved as draft (incomplete); False when fully saved",
    )

    selected_log_group = models.UUIDField(
        null=True,
        blank=True,
        help_text="Log group chosen as the final set of images (design)",
    )
    selected_secondary_log_group = models.UUIDField(
        null=True,
        blank=True,
        help_text="Log group chosen as the final set of images (approved)",
    )

    # Audit fields
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_two_d_designs",
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_two_d_designs",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "two_d_designs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"2D Design {self.account_order_id or self.id}"


class TwoDDesignImage(models.Model):
    """Image records for 2D Design - supports multiple images per field"""

    FIELD_TYPE_CHOICES = [
        ("design", "2D Design Image"),
        ("approved", "Approved 2D Design Image"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    two_d_design = models.ForeignKey(TwoDDesign, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="2d_designs/multi/")
    field_type = models.CharField(max_length=20, choices=FIELD_TYPE_CHOICES)
    is_final_design = models.BooleanField(
        default=False, help_text="Is this the final design image?"
    )
    is_final_approved = models.BooleanField(
        default=False, help_text="Is this the final approved image?"
    )
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE)
    uploaded_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    log_group = models.UUIDField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Groups images saved in the same upload session",
    )

    class Meta:
        db_table = "two_d_design_images"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"2D Design Image - {self.field_type} ({self.two_d_design.account_order_id})"
