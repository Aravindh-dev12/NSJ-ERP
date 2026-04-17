import uuid
from django.db import models


class Account(models.Model):
    """Account master - Party master for customers, suppliers, agents, staff
    
    Spark Accounting Master - Creates and maintains operational accounting masters
    for export to Tally. Analysis happens in Tally, not Spark.
    """

    GROUP_CHOICES = [
        ("CUSTOMER", "Customer"),
        ("SUPPLIER", "Supplier"),
        ("AGENT", "Agent"),
        ("STAFF", "Staff"),
        ("CASH", "Cash"),
        ("BANK", "Bank"),
    ]

    STATUS_CHOICES = [
        ("ACTIVE", "Active"),
        ("INACTIVE", "Inactive"),
    ]

    YES_NO_CHOICES = [
        ("YES", "YES"),
        ("NO", "NO"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Tenant scoping
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE, related_name="accounts")
    branch = models.ForeignKey(
        "core.Branch", on_delete=models.SET_NULL, null=True, blank=True, related_name="accounts"
    )

    # ==========================================
    # 1-3. Basic Account Info (from Excel)
    # ==========================================
    # 1. Spark Account Code (auto-generated, kept as account_no)
    account_no = models.TextField()  # Unique within company - Spark Account Code
    
    # 2. Ledger / Account Name
    account_name = models.TextField()
    
    # 3. Ledger Role
    ledger_role = models.CharField(max_length=100, null=True, blank=True, help_text="Ledger role/category")

    # ==========================================
    # 4-7. Group Information (from Excel)
    # ==========================================
    # 4. Spark Account Group - links to ACGroupMaster for Tally export mapping
    spark_account_group = models.ForeignKey(
        "ACGroupMaster", 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="accounts",
        help_text="Spark Account Group for Tally export mapping"
    )
    
    # Legacy group_code for backward compatibility
    group_code = models.CharField(max_length=20, choices=GROUP_CHOICES)

    # 5. Tally Parent Group - derived from spark_account_group
    # (stored for quick access, copied from ACGroupMaster)
    tally_parent_group = models.CharField(max_length=255, null=True, blank=True)
    
    # 6. Financial Statement - derived from spark_account_group
    FINANCIAL_STATEMENT_CHOICES = [
        ("Balance Sheet", "Balance Sheet"),
        ("Profit & Loss", "Profit & Loss"),
    ]
    
    financial_statement = models.CharField(
        max_length=20, 
        choices=FINANCIAL_STATEMENT_CHOICES,
        null=True, 
        blank=True
    )
    
    # 7. Normal Balance - derived from spark_account_group
    NORMAL_BALANCE_CHOICES = [
        ("Dr", "Debit"),
        ("Cr", "Credit"),
    ]
    
    normal_balance = models.CharField(
        max_length=2,
        choices=NORMAL_BALANCE_CHOICES,
        null=True,
        blank=True
    )

    # ==========================================
    # 8-11. Party & Tax Details (from Excel)
    # ==========================================
    # 8. Party Category
    party_category = models.CharField(max_length=100, null=True, blank=True)
    
    # 9. GST Registration Type
    gst_registration_type = models.CharField(max_length=100, null=True, blank=True)
    
    # 10. GSTN and 11. PAN are in AccountTax model (linked 1:1)
    
    # ==========================================
    # 12-13. Opening Balance (from Excel)
    # ==========================================
    # Stored in AccountOpeningBalance model (linked 1:1)

    # ==========================================
    # 14-17. Settings & Flags (from Excel)
    # ==========================================
    # 14. Bill-wise Required?
    bill_wise_required = models.CharField(max_length=3, choices=YES_NO_CHOICES, default="NO")
    
    # 15. Cost Centre Required?
    cost_centre_required = models.CharField(max_length=3, choices=YES_NO_CHOICES, default="NO")
    
    # 16. Export To Tally
    export_to_tally = models.CharField(max_length=3, choices=YES_NO_CHOICES, default="YES")
    
    # 17. Active (using existing status field)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ACTIVE")

    # ==========================================
    # 18-20. Additional Fields (from Excel)
    # ==========================================
    # 18. Tally Ledger Name Override
    tally_ledger_name_override = models.CharField(max_length=255, null=True, blank=True)
    
    # 19. Team Notice
    team_notice = models.TextField(null=True, blank=True)
    
    # 20. Validation Status
    validation_status = models.CharField(max_length=50, null=True, blank=True, default="Pending")

    # ==========================================
    # Legacy/Other Fields
    # ==========================================
    location = models.ForeignKey(
        "core.LocationMaster", on_delete=models.SET_NULL, null=True, blank=True
    )
    remarks = models.TextField(null=True, blank=True)

    # Audit
    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_accounts"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "accounts"
        unique_together = [["company", "account_no"]]
        ordering = ["account_name"]

    def __str__(self):
        return f"{self.account_no} - {self.account_name}"

    def to_dict(self):
        """Serialize to dict for API responses"""
        return {
            "id": str(self.id),
            "account_no": self.account_no,
            "account_name": self.account_name,
            "ledger_role": self.ledger_role,
            "group_code": self.group_code,
            "spark_account_group_id": str(self.spark_account_group_id) if self.spark_account_group else None,
            "tally_parent_group": self.tally_parent_group,
            "financial_statement": self.financial_statement,
            "normal_balance": self.normal_balance,
            "party_category": self.party_category,
            "gst_registration_type": self.gst_registration_type,
            "bill_wise_required": self.bill_wise_required,
            "cost_centre_required": self.cost_centre_required,
            "export_to_tally": self.export_to_tally,
            "status": self.status,
            "tally_ledger_name_override": self.tally_ledger_name_override,
            "team_notice": self.team_notice,
            "validation_status": self.validation_status,
            "remarks": self.remarks,
        }

    def save(self, *args, **kwargs):
        """Auto-populate derived fields from spark_account_group"""
        if self.spark_account_group:
            self.tally_parent_group = self.spark_account_group.tally_parent_group
            self.financial_statement = self.spark_account_group.financial_statement
            self.normal_balance = self.spark_account_group.normal_balance
            # Also update legacy group_code for compatibility
            self.group_code = self._map_to_legacy_group(self.spark_account_group.name)
        super().save(*args, **kwargs)

    def _map_to_legacy_group(self, spark_group_name):
        """Map Spark Account Group to legacy GROUP_CHOICES"""
        mapping = {
            "CASH": "CASH",
            "BANK": "BANK",
            "CUSTOMER": "CUSTOMER",
            "SUPPLIER": "SUPPLIER",
            "KARIGAR": "SUPPLIER",
            "AGENT": "AGENT",
            "STAFF": "STAFF",
        }
        return mapping.get(spark_group_name, "CUSTOMER")  # Default to CUSTOMER


class AccountContact(models.Model):
    """Account contact details - 1:1 with account"""

    account = models.OneToOneField(
        Account, on_delete=models.CASCADE, primary_key=True, related_name="contact"
    )

    # Address details
    address_line = models.TextField()
    # Keep existing text fields for backward compatibility
    city = models.TextField(null=True, blank=True)
    state = models.TextField(null=True, blank=True)
    country = models.TextField(null=True, blank=True)
    pin_code = models.TextField(null=True, blank=True)

    # New ForeignKey fields for dropdown selection (preferred for new records)
    country_master = models.ForeignKey(
        "core.CountryMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="account_contacts",
    )
    state_master = models.ForeignKey(
        "core.StateMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="account_contacts",
    )
    city_master = models.ForeignKey(
        "core.CityMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="account_contacts",
    )

    # Contact details (frontend only uses phone and email)
    phone = models.TextField(null=True, blank=True)
    email = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "account_contact"

    def __str__(self):
        return f"Contact for {self.account.account_name}"


class AccountBank(models.Model):
    """Account bank details - 1:1 with account"""

    account = models.OneToOneField(
        Account, on_delete=models.CASCADE, primary_key=True, related_name="bank"
    )

    # Frontend only collects bank name, account number and IFSC
    bank_name = models.TextField(null=True, blank=True)
    ifsc = models.TextField(null=True, blank=True)
    account_number = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "account_bank"

    def __str__(self):
        return f"Bank details for {self.account.account_name}"


class AccountTax(models.Model):
    """Account tax details - 1:1 with account"""

    account = models.OneToOneField(
        Account, on_delete=models.CASCADE, primary_key=True, related_name="tax"
    )

    # Frontend collects only GSTIN and PAN
    gstin = models.TextField(null=True, blank=True)
    pan = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "account_tax"

    def __str__(self):
        return f"Tax details for {self.account.account_name}"


class AccountOpeningBalance(models.Model):
    """Account opening balance - 1:1 with account"""

    DRCR_CHOICES = [
        ("Dr", "Debit"),
        ("Cr", "Credit"),
    ]

    account = models.OneToOneField(
        Account, on_delete=models.CASCADE, primary_key=True, related_name="opening_balance"
    )
    # Opening balance - frontend collects only amount and Dr/Cr
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    amount_drcr = models.CharField(max_length=2, choices=DRCR_CHOICES, null=True, blank=True)

    class Meta:
        db_table = "account_opening_balance"

    def __str__(self):
        return f"Opening balance for {self.account.account_name}"


class SubAccount(models.Model):
    """SubAccount - linked to a main Account

    Stores ONLY personal/contact information.
    Item-specific details (ring size, bangle size, etc.) are stored in Orders.
    """

    GENDER_CHOICES = [
        ("MALE", "Male"),
        ("FEMALE", "Female"),
        ("OTHERS", "Others"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Link to main account
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="sub_accounts")

    # Personal Information Only
    sub_account_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=50, null=True, blank=True)
    email = models.EmailField(max_length=254, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True)

    # Audit
    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_subaccounts"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sub_accounts"
        ordering = ["-created_at"]
        verbose_name = "Sub Account"
        verbose_name_plural = "Sub Accounts"

    def __str__(self):
        return f"{self.sub_account_name} ({self.account.account_name})"

    def get_linked_orders(self):
        """Get all orders linked to this sub-account"""
        from vouchers.models import Order, PaymentEntry, JournalEntry

        orders = Order.objects.filter(sub_account=self).select_related("account")
        payments = PaymentEntry.objects.filter(sub_account=self).select_related("account")
        journals = JournalEntry.objects.filter(sub_account=self).select_related("account")

        return {
            "orders": orders,
            "payments": payments,
            "journals": journals,
            "total_count": orders.count() + payments.count() + journals.count(),
        }


class ACGroupMaster(models.Model):
    """Master table for A/C Group dropdown options (editable via admin).
    
    Spark Account Group master - defines accounting masters for Tally export mapping.
    """

    # Choices for dropdown fields
    FINANCIAL_STATEMENT_CHOICES = [
        ("Balance Sheet", "Balance Sheet"),
        ("Profit & Loss", "Profit & Loss"),
    ]

    UNIVERSAL_NATURE_CHOICES = [
        ("Asset", "Asset"),
        ("Liability", "Liability"),
        ("Income", "Income"),
        ("Expense", "Expense"),
        ("Capital", "Capital"),
    ]

    NORMAL_BALANCE_CHOICES = [
        ("Dr", "Debit"),
        ("Cr", "Credit"),
    ]

    YES_NO_CHOICES = [
        ("YES", "YES"),
        ("NO", "NO"),
    ]

    STATUS_CHOICES = [
        ("Active", "Active"),
        ("Restricted", "Restricted"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # 1. Spark Account Group - primary identifier shown in dropdown
    name = models.CharField(max_length=255, unique=True, help_text="Spark Account Group (e.g., CASH, BANK, CUSTOMER)")

    # 2. Tally Parent Group - where this maps in Tally
    tally_parent_group = models.CharField(max_length=255, default="", blank=True, help_text="Tally Parent Group (e.g., Cash-in-Hand, Bank Accounts)")

    # 3. Financial Statement - Balance Sheet or Profit & Loss
    financial_statement = models.CharField(max_length=20, choices=FINANCIAL_STATEMENT_CHOICES, default="Balance Sheet")

    # 4. Universal Nature - Asset, Liability, Income, Expense, Capital
    universal_nature = models.CharField(max_length=20, choices=UNIVERSAL_NATURE_CHOICES, default="Asset")

    # 5. Normal Balance - Dr or Cr
    normal_balance = models.CharField(max_length=2, choices=NORMAL_BALANCE_CHOICES, default="Dr")

    # 6. Use In Spark - YES/NO
    use_in_spark = models.CharField(max_length=3, choices=YES_NO_CHOICES, default="YES")

    # Additional fields from Excel
    ledger_examples = models.TextField(null=True, blank=True, help_text="Examples: Cash, Petty Cash")
    export_rule = models.TextField(null=True, blank=True, help_text="Rule for exporting to Tally")

    # 6. Status - Active/Restricted
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Active")

    class Meta:
        db_table = "ac_group_master"
        ordering = ["name"]
        verbose_name = "Account Group Master"
        verbose_name_plural = "Account Group Masters"

    def __str__(self):
        return f"{self.name} ({self.tally_parent_group})"


class ACGroup(models.Model):
    """A/C Group entries created from the frontend form."""

    YES_NO_CHOICES = [("YES", "YES"), ("NO", "NO")]

    FINANCIAL_STATEMENT_CHOICES = [
        ("Balance Sheet", "Balance Sheet"),
        ("Profit & Loss", "Profit & Loss"),
    ]

    UNIVERSAL_NATURE_CHOICES = [
        ("Asset", "Asset"),
        ("Liability", "Liability"),
        ("Income", "Income"),
        ("Expense", "Expense"),
        ("Capital", "Capital"),
    ]

    NORMAL_BALANCE_CHOICES = [
        ("Dr", "Debit"),
        ("Cr", "Credit"),
    ]

    STATUS_CHOICES = [
        ("Active", "Active"),
        ("Restricted", "Restricted"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # selected A/C group option (FK to master so options can be edited)
    ac_group = models.ForeignKey(ACGroupMaster, on_delete=models.PROTECT, related_name="ac_groups")

    # Core fields from ACGroupMaster (copied for quick access)
    name = models.CharField(max_length=255, default="Unnamed", help_text="Spark Account Group")
    tally_parent_group = models.CharField(max_length=255, default="", blank=True, help_text="Tally Parent Group")
    financial_statement = models.CharField(max_length=20, choices=FINANCIAL_STATEMENT_CHOICES, default="Balance Sheet")
    universal_nature = models.CharField(max_length=20, choices=UNIVERSAL_NATURE_CHOICES, default="Asset")
    normal_balance = models.CharField(max_length=2, choices=NORMAL_BALANCE_CHOICES, default="Dr")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Active")

    # Additional usage flags
    incl_in_sale = models.CharField(max_length=3, choices=YES_NO_CHOICES, default="NO")
    incl_in_pur = models.CharField(max_length=3, choices=YES_NO_CHOICES, default="NO")
    incl_in_out = models.CharField(max_length=3, choices=YES_NO_CHOICES, default="NO")
    incl_in_ir = models.CharField(max_length=3, choices=YES_NO_CHOICES, default="NO")
    address_req = models.CharField(max_length=3, choices=YES_NO_CHOICES, default="NO")
    restrict_credit_facility = models.CharField(max_length=3, choices=YES_NO_CHOICES, default="NO")

    # Ledger examples and export rule
    ledger_examples = models.TextField(null=True, blank=True)
    export_rule = models.TextField(null=True, blank=True)

    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_acgroups"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ac_groups"
        ordering = ["-created_at"]
        verbose_name = "Account Group"
        verbose_name_plural = "Account Groups"

    def __str__(self):
        return f"{self.name} ({self.tally_parent_group})"
