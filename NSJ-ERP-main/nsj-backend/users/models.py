import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import EmailValidator
from django.db import models


class CustomUserManager(BaseUserManager):
    """Manager for custom user model"""

    def create_user(self, email, username, password=None, **extra_fields):
        """Create and save a regular user with given email and password"""
        if not email:
            raise ValueError("The Email field must be set")
        if not username:
            raise ValueError("The Username field must be set")

        self._ensure_company(extra_fields)

        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        """Create and save a superuser"""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, username, password, **extra_fields)

    def _ensure_company(self, extra_fields):
        if extra_fields.get("company"):
            return

        from core.models import Company

        company = Company.objects.first()
        if company is None:
            company = Company.objects.create(name="NSJ Main", display_name="NSJ Main")

        extra_fields["company"] = company


class User(AbstractBaseUser, PermissionsMixin):
    """Employee login record - User model"""

    ROLE_CHOICES = [
        ("SUPER_ADMIN", "Super Admin"),
        ("ADMIN", "Admin"),
        ("EMPLOYEE", "Employee"),
    ]

    # Task Management Role Choices
    TASK_ROLE_CHOICES = [
        ("FOUNDER", "Founder"),  # Global view - can see all tasks
        ("DEPT_HEAD", "Department Head"),  # Can see all tasks in their department
        ("SUB_DEPT_HEAD", "Sub-Department Head"),  # Can see tasks in their sub-department
        ("INDIVIDUAL", "Individual Contributor"),  # Can only see their own tasks
    ]

    # Department Choices (same as Task model)
    DEPARTMENT_CHOICES = [
        ("PRODUCT_DESIGN", "Product Design"),
        ("SALES", "Sales"),
        ("SOURCING", "Sourcing"),
        ("FOUNDER", "Founder"),
        ("ACCOUNTS", "Accounts"),
        ("RAW_MATERIAL_INVENTORY", "Raw Material Inventory"),
        ("ADMINISTRATION", "Administration"),
        ("PRODUCTION", "Production"),
        ("PRODUCT_INVENTORY", "Product Inventory"),
        ("LOGISTICS", "Logistics"),
    ]

    # Sub-Department Choices (same as Task model)
    SUB_DEPARTMENT_CHOICES = [
        # Product Design
        ("2D_DESIGN", "2D Design"),
        ("R_AND_D", "R&D"),
        # Sales
        ("CLIENT_SERVICING", "Client Servicing"),
        ("CATALOGUE", "Catalogue"),
        # Sourcing
        ("DIAMOND_SOURCING", "Diamond Sourcing"),
        ("GOLD_SOURCING", "Gold Sourcing"),
        ("GEMSTONE_SOURCING", "Gemstone Sourcing"),
        # Founder
        ("STRATEGY", "Strategy"),
        ("OPERATIONS", "Operations"),
        ("INTEGRATION", "Integration"),
        ("TECH_INFRA", "Tech Infra"),
        ("HIRING", "Hiring"),
        ("LEGAL", "Legal"),
        ("BRANDING_PR", "Branding & PR"),
        ("GRAPHIC_DESIGN", "Graphic Design"),
        ("BUSINESS_DEVELOPMENT", "Business Development"),
        ("OFFLINE_MARKETING", "Offline Marketing"),
        # Accounts
        ("BILLING", "Billing"),
        ("GST", "GST"),
        ("BOOKKEEPING", "Bookkeeping"),
        ("CASH_BOOKS", "Cash Books"),
        # Raw Material Inventory
        ("DIAMOND_BOOKS", "Diamond Books"),
        ("GOLD_BOOKS", "Gold Books"),
        ("DAILY_IN_OUT", "Daily In Out"),
        ("BAGGING", "Bagging"),
        # Administration
        ("ERP", "ERP"),
        ("PHYSICAL_STOCK_KEEPING", "Physical Stock Keeping"),
        # Production
        ("VENDOR_HANDLING", "Vendor Handling"),
        ("REPAIRS", "Repairs"),
        ("STOCK_JEWELLERY", "Stock Jewellery"),
        ("CUSTOM_JEWELLERY", "Custom Jewellery"),
        # Logistics
        ("LOCAL", "Local"),
        ("SHIPPING", "Shipping"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Tenant scoping - using string references to avoid circular imports
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE, related_name="users")
    branch = models.ForeignKey(
        "core.Branch", on_delete=models.SET_NULL, null=True, blank=True, related_name="users"
    )

    # User details
    name = models.TextField()  # Employee full name
    email = models.TextField(unique=True, validators=[EmailValidator()])  # Login email
    username = models.TextField(unique=True)  # Unique username
    role = models.CharField(
        max_length=20, choices=ROLE_CHOICES, default="EMPLOYEE"
    )  # Fixed to EMPLOYEE for profiles

    # Task Management Fields
    task_role = models.CharField(
        max_length=20,
        choices=TASK_ROLE_CHOICES,
        default="INDIVIDUAL",
        help_text="Role for task management access control",
    )
    department = models.CharField(
        max_length=50,
        choices=DEPARTMENT_CHOICES,
        blank=True,
        null=True,
        help_text="Department the user belongs to",
    )
    sub_department = models.CharField(
        max_length=50,
        choices=SUB_DEPARTMENT_CHOICES,
        blank=True,
        null=True,
        help_text="Sub-department the user belongs to",
    )

    # Department Dashboard Fields
    departments = models.ManyToManyField(
        "core.Department",
        related_name="assigned_users",
        blank=True,
        help_text="Departments this user can access (for dashboard switching)",
    )
    current_active_department = models.ForeignKey(
        "core.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="active_users",
        help_text="Currently selected department view",
    )

    # Status flags
    is_active = models.BooleanField(default=True, help_text="Whether user can sign in")
    is_staff = models.BooleanField(default=False)  # Django admin access
    is_superuser = models.BooleanField(default=False)  # Django superuser
    plain_password = models.CharField(max_length=255, blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"  # Login with email
    REQUIRED_FIELDS = ["username", "name"]

    class Meta:
        db_table = "users"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.email})"

    def get_full_name(self):
        return self.name

    def get_short_name(self):
        return self.name.split()[0] if self.name else self.username

    def is_founder(self):
        """Check if user has founder-level access"""
        return self.task_role == "FOUNDER"

    def is_dept_head(self):
        """Check if user is a department head"""
        return self.task_role == "DEPT_HEAD"

    def is_sub_dept_head(self):
        """Check if user is a sub-department head"""
        return self.task_role == "SUB_DEPT_HEAD"

    def can_view_all_tasks(self):
        """Check if user can view all tasks globally"""
        return self.task_role == "FOUNDER" or self.role in ["ADMIN", "SUPER_ADMIN"]

    def can_view_department_tasks(self):
        """Check if user can view all tasks in their department"""
        return self.task_role in ["FOUNDER", "DEPT_HEAD"] or self.role in ["ADMIN", "SUPER_ADMIN"]

    def can_view_sub_department_tasks(self):
        """Check if user can view all tasks in their sub-department"""
        return self.task_role in ["FOUNDER", "DEPT_HEAD", "SUB_DEPT_HEAD"] or self.role in [
            "ADMIN",
            "SUPER_ADMIN",
        ]
