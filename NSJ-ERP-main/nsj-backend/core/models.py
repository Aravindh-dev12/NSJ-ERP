import uuid
from decimal import Decimal
from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base model for created_at and updated_at timestamps"""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class CountryMaster(models.Model):
    """Country master data"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=3, unique=True, null=True, blank=True)  # ISO country code

    class Meta:
        db_table = "country_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class StateMaster(models.Model):
    """State master data"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, null=True, blank=True)
    country = models.ForeignKey(CountryMaster, on_delete=models.CASCADE, related_name="states")

    class Meta:
        db_table = "state_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class CityMaster(models.Model):
    """City master data"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, null=True, blank=True)
    state = models.ForeignKey(StateMaster, on_delete=models.CASCADE, related_name="cities")

    class Meta:
        db_table = "city_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class LocationMaster(models.Model):
    """Location master for accounts"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="locations", null=True, blank=True
    )

    class Meta:
        db_table = "location_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class SeriesMaster(models.Model):
    """Series master for vouchers/orders"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="series", null=True, blank=True
    )

    class Meta:
        db_table = "series_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class StampMaster(models.Model):
    """Stamp master for vouchers/orders"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, null=True, blank=True)
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="stamps", null=True, blank=True
    )

    class Meta:
        db_table = "stamp_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class BaseMetalMaster(models.Model):
    """Base metal master for vouchers/orders"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, null=True, blank=True)
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="base_metals", null=True, blank=True
    )

    class Meta:
        db_table = "base_metal_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class ItemNameMaster(models.Model):
    """Item name master for sales dropdowns"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, null=True, blank=True)
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="item_names", null=True, blank=True
    )

    class Meta:
        db_table = "item_name_master"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def to_dict(self):
        """Serialize to dict for API responses"""
        return {
            "id": str(self.id),
            "name": self.name,
            "code": self.code,
        }


class GoldQualityMaster(models.Model):
    """Gold quality master for gold purity dropdowns (KT values)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)  # e.g., "18KT", "22KT", "24KT"
    code = models.CharField(max_length=20, null=True, blank=True)
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="gold_qualities", null=True, blank=True
    )

    class Meta:
        db_table = "gold_quality_master"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def to_dict(self):
        """Serialize to dict for API responses"""
        return {
            "id": str(self.id),
            "name": self.name,
            "code": self.code,
        }


class ClarityMaster(models.Model):
    """Clarity master for diamond clarity dropdowns"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, null=True, blank=True)
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="clarities", null=True, blank=True
    )

    class Meta:
        db_table = "clarity_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class ShapeMaster(models.Model):
    """Shape master for gemstone/diamond shapes"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, null=True, blank=True)
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="shapes", null=True, blank=True
    )

    class Meta:
        db_table = "shape_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class UnitMaster(models.Model):
    """Unit master for unit dropdowns (Carat, Gm, Pc, etc)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    code = models.CharField(max_length=20, null=True, blank=True)
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="units", null=True, blank=True
    )

    class Meta:
        db_table = "unit_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class SizeMaster(models.Model):
    """Size master for diamonds/jewellery sizing"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="sizes", null=True, blank=True
    )

    class Meta:
        db_table = "size_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class ColourMaster(models.Model):
    """Colour master for diamonds/gemstones"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="colours", null=True, blank=True
    )

    class Meta:
        db_table = "colour_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class LabMaster(models.Model):
    """Lab master for diamond certification labs"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="labs", null=True, blank=True
    )

    class Meta:
        db_table = "lab_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class GoldCaratMaster(models.Model):
    """Gold carat master for standard carat values"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)  # e.g., "24K", "22K", "18K"
    value = models.IntegerField()  # Numeric value: 24, 22, 18, etc.
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="gold_carats", null=True, blank=True
    )
    is_standard = models.BooleanField(default=False)  # True for 24, 22, 18, 14, 10
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "gold_carat_master"
        ordering = ["-value"]  # Descending order: 24, 22, 18, 14, 10
        unique_together = [["company", "value"]]

    def __str__(self):
        return self.name


class MetalTypeMaster(models.Model):
    """Metal type master (Gold, Silver, Platinum, etc.)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)  # e.g., "Gold", "Silver", "Platinum"
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="metal_types", null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "metal_type_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class GemstoneMaster(models.Model):
    """Gemstone type master (Ruby, Sapphire, Emerald, etc.)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, null=True, blank=True)
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="gemstones", null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "gemstone_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class GemstoneShapeMaster(models.Model):
    """Gemstone shape master (Round, Oval, Pear, etc.)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    code = models.CharField(max_length=20, null=True, blank=True)
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="gemstone_shapes", null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "gemstone_shape_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class GemstoneColorMaster(models.Model):
    """Gemstone color master (Red, Blue, Green, etc.)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    code = models.CharField(max_length=20, null=True, blank=True)
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="gemstone_colors", null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "gemstone_color_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class GemstoneClarityMaster(models.Model):
    """Gemstone clarity master (E, VVS, VS, SI, I)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=10)
    code = models.CharField(max_length=10, null=True, blank=True)
    company = models.ForeignKey(
        "Company",
        on_delete=models.CASCADE,
        related_name="gemstone_clarities",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "gemstone_clarity_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class GemstoneTreatmentMaster(models.Model):
    """Gemstone treatment master (None, Heat, Oil, etc.)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    code = models.CharField(max_length=20, null=True, blank=True)
    company = models.ForeignKey(
        "Company",
        on_delete=models.CASCADE,
        related_name="gemstone_treatments",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "gemstone_treatment_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class OriginMaster(models.Model):
    """Origin master for materials (Natural, CVD, Synthetic, etc.)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    material_type = models.CharField(
        max_length=20,
        choices=[("diamond", "Diamond"), ("gemstone", "Gemstone"), ("all", "All Materials")],
    )
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="origins", null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "origin_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class CutMaster(models.Model):
    """Cut master for diamond cut grades (Excellent, Very Good, Good, Fair, Poor)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, null=True, blank=True)
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="cuts", null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cut_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class PolishMaster(models.Model):
    """Polish master for diamond polish grades (Excellent, Very Good, Good, Fair, Poor)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, null=True, blank=True)
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="polishes", null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "polish_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class SymmetryMaster(models.Model):
    """Symmetry master for diamond symmetry grades (Excellent, Very Good, Good, Fair, Poor)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, null=True, blank=True)
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="symmetries", null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "symmetry_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class MetalColorMaster(models.Model):
    """Metal color master (Rose Gold, White Gold, Yellow Gold, etc.)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)  # e.g., "Rose Gold", "White Gold"
    metal_type = models.ForeignKey(
        MetalTypeMaster, on_delete=models.CASCADE, related_name="colors", null=True, blank=True
    )
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="metal_colors", null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "metal_color_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class ItemGroupMaster(models.Model):
    """Item group master (GOLD METAL, DIAMOND JEWELLERY, etc.)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)  # e.g., "GOLD METAL", "DIAMOND JEWELLERY"
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="item_groups", null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "item_group_master"
        ordering = ["name"]

    def __str__(self):
        return self.name


class MasterDataRequest(models.Model):
    """Request to add new master data entries"""

    MASTER_TYPE_CHOICES = [
        ("item_name", "Item Name"),
        ("gold_carat", "Gold Carat"),
        ("metal_type", "Metal Type"),
        ("metal_color", "Metal Color"),
        ("item_group", "Item Group"),
        ("clarity", "Clarity"),
        ("shape", "Shape"),
        ("colour", "Colour"),
        ("size", "Size"),
        ("unit", "Unit"),
        ("lab", "Lab"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    master_type = models.CharField(max_length=50, choices=MASTER_TYPE_CHOICES)
    requested_value = models.CharField(max_length=200)
    additional_info = models.TextField(
        null=True, blank=True
    )  # For carat value, metal type relation, etc.
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    requested_by = models.ForeignKey(
        "users.User", on_delete=models.CASCADE, related_name="master_requests"
    )
    company = models.ForeignKey("Company", on_delete=models.CASCADE, related_name="master_requests")
    reviewed_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_master_requests",
    )
    rejection_reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "master_data_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_master_type_display()}: {self.requested_value} ({self.status})"


class Company(models.Model):
    """Company/Tenant model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    display_name = models.CharField(max_length=200)
    registration_number = models.CharField(max_length=100, null=True, blank=True)
    gstin = models.CharField(max_length=15, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "companies"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Branch(models.Model):
    """Branch model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="branches")
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "branches"
        ordering = ["name"]

    def __str__(self):
        return f"{self.company.name} - {self.name}"


class GoldPriceFeeding(models.Model):
    """Daily gold price feeding by accountants"""

    UPDATE_TYPE_CHOICES = [
        ("OPENING", "Opening (12 PM)"),
        ("CLOSING", "Closing (Before 10 PM)"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="gold_prices", null=True, blank=True
    )

    # Gold rates
    gold_24k_rate = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="24 Karat gold rate per gram in INR"
    )
    gold_22k_rate = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="22 Karat gold rate per gram in INR"
    )
    silver_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Silver rate per gram in INR",
    )

    # Metadata
    update_type = models.CharField(max_length=10, choices=UPDATE_TYPE_CHOICES, default="OPENING")
    feeding_date = models.DateField(help_text="Date for which this rate is applicable")
    fed_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="gold_price_feedings"
    )
    fed_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Notes
    notes = models.TextField(null=True, blank=True, help_text="Optional notes about the rate")

    class Meta:
        db_table = "gold_price_feeding"
        ordering = ["-feeding_date", "-fed_at"]
        unique_together = [["company", "feeding_date", "update_type"]]
        indexes = [
            models.Index(fields=["feeding_date", "update_type"]),
            models.Index(fields=["company", "feeding_date"]),
        ]

    def __str__(self):
        return f"Gold Price - {self.feeding_date} ({self.update_type})"

    @classmethod
    def get_current_rate(cls, company=None):
        """Get the most recent gold rate"""
        from django.utils import timezone
        from datetime import time

        now = timezone.now()
        current_time = now.time()
        current_date = now.date()

        # Check if we're in locked period (10 PM to 12 PM next day)
        locked_start = time(22, 0)  # 10 PM
        locked_end = time(12, 0)  # 12 PM

        is_locked = current_time >= locked_start or current_time < locked_end

        query = cls.objects.filter(feeding_date=current_date)
        if company:
            query = query.filter(company=company)

        latest = query.order_by("-fed_at").first()

        return {
            "is_locked": is_locked,
            "rate": latest,
            "needs_feeding": latest is None,
        }


class Department(models.Model):
    """Department/Division within the company"""

    DEPARTMENT_TYPES = [
        ("ACCOUNTS", "Accounts"),
        ("PRODUCTION", "Production"),
        ("RAW_MATERIAL", "Raw Material Inventory"),
        ("ADMINISTRATION", "Administration"),
        ("LOGISTICS", "Logistics"),
        ("SALES", "Sales/Query"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="departments", null=True, blank=True
    )

    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, choices=DEPARTMENT_TYPES)
    description = models.TextField(null=True, blank=True)

    # Dashboard configuration
    features = models.JSONField(
        default=list, help_text="List of features/widgets to show on dashboard"
    )

    # Permissions
    can_edit_gold_price = models.BooleanField(default=False)
    can_view_accounting = models.BooleanField(default=False)
    can_view_production = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "departments"
        ordering = ["name"]
        unique_together = [["company", "code"]]

    def __str__(self):
        return f"{self.name}"


class DashboardConfiguration(models.Model):
    """Dashboard layout configuration per department"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    department = models.OneToOneField(
        Department, on_delete=models.CASCADE, related_name="dashboard_config"
    )

    # Widget configuration
    widgets = models.JSONField(
        default=list, help_text="List of widgets to display with their settings"
    )

    # Layout settings
    layout_type = models.CharField(
        max_length=20,
        choices=[
            ("GRID", "Grid Layout"),
            ("LIST", "List Layout"),
            ("CUSTOM", "Custom Layout"),
        ],
        default="GRID",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "dashboard_configurations"

    def __str__(self):
        return f"Dashboard Config - {self.department.name}"


class DailyGoldRate(models.Model):
    """
    Daily Gold Rate Management
    Stores opening, closing, and intermediate rates for each day
    """

    RATE_TYPE_CHOICES = [
        ("OPENING", "Opening Rate"),
        ("INTERMEDIATE", "Intermediate Rate"),
        ("CLOSING", "Closing Rate"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey("Company", on_delete=models.CASCADE, related_name="gold_rates")

    # Date for this rate
    rate_date = models.DateField(db_index=True)

    # Rate type
    rate_type = models.CharField(max_length=20, choices=RATE_TYPE_CHOICES, db_index=True)

    # Manual input rates (24K)
    gold_24k_999 = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="24K Triple 9 (999) gold rate per gram"
    )
    gold_24k_995 = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="24K 995 gold rate per gram"
    )

    # Auto-calculated rates (based on 24K 999)
    gold_22k = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="22K gold rate (0.91 × 24K 999)"
    )
    gold_18k = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="18K gold rate (0.75 × 24K 999)"
    )
    gold_14k = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="14K gold rate (0.6 × 24K 999)"
    )

    # Silver rate (manual input)
    silver_rate = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, help_text="Silver rate per gram"
    )

    # Locking mechanism
    is_locked = models.BooleanField(
        default=False, help_text="Once locked, rate cannot be changed (except by admin override)"
    )

    # Audit trail
    entered_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="entered_gold_rates"
    )
    entered_at = models.DateTimeField(auto_now_add=True)

    # Override tracking
    last_modified_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="modified_gold_rates",
    )
    last_modified_at = models.DateTimeField(null=True, blank=True)

    # Notes for corrections
    correction_notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "daily_gold_rates"
        ordering = ["-rate_date", "entered_at"]
        indexes = [
            models.Index(fields=["company", "rate_date", "rate_type"]),
            models.Index(fields=["rate_date", "rate_type"]),
        ]
        # Ensure only one opening and one closing rate per day per company
        constraints = [
            models.UniqueConstraint(
                fields=["company", "rate_date", "rate_type"],
                condition=models.Q(rate_type__in=["OPENING", "CLOSING"]),
                name="unique_opening_closing_per_day",
            )
        ]

    def __str__(self):
        return f"{self.rate_type} - {self.rate_date} - 24K 999: ₹{self.gold_24k_999}"

    def save(self, *args, **kwargs):
        """Auto-calculate derived rates before saving"""
        # Calculate 22K, 18K, 14K based on 24K 999
        self.gold_22k = self.gold_24k_999 * Decimal("0.91")
        self.gold_18k = self.gold_24k_999 * Decimal("0.75")
        self.gold_14k = self.gold_24k_999 * Decimal("0.6")
        super().save(*args, **kwargs)


class GoldRateChangeLog(models.Model):
    """
    Audit log for all gold rate changes
    Tracks every modification for compliance and dispute resolution
    """

    ACTION_CHOICES = [
        ("CREATE", "Created"),
        ("UPDATE", "Updated"),
        ("LOCK", "Locked"),
        ("OVERRIDE", "Admin Override"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    gold_rate = models.ForeignKey(
        DailyGoldRate, on_delete=models.CASCADE, related_name="change_logs"
    )

    # What changed
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    field_changed = models.CharField(max_length=50, blank=True, null=True)
    old_value = models.CharField(max_length=255, blank=True, null=True)
    new_value = models.CharField(max_length=255, blank=True, null=True)

    # Who and when
    changed_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    # Notes
    notes = models.TextField(blank=True, null=True)

    # IP address for security
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = "gold_rate_change_logs"
        ordering = ["-changed_at"]

    def __str__(self):
        return f"{self.action} - {self.gold_rate.rate_date} by {self.changed_by}"
