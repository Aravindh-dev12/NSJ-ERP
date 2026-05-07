import uuid
from django.db import models
from django.conf import settings


class Task(models.Model):
    """Task model for task management"""

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("COMPLETED", "Completed"),
        ("STUCK", "Stuck"),
        ("NEED_FOUNDER", "Need Founder Intervention"),
        ("TRANSFERRED", "Transferred to Another Department"),
    ]

    URGENCY_CHOICES = [
        ("LOW", "Low"),
        ("MEDIUM", "Medium"),
        ("HIGH", "High"),
        ("URGENT", "Urgent"),
    ]

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
    company = models.ForeignKey("core.Company", on_delete=models.CASCADE, related_name="tasks")

    # Task details
    title = models.CharField(max_length=255)
    description = models.TextField()
    deadline = models.DateField()
    urgency = models.CharField(max_length=20, choices=URGENCY_CHOICES, default="MEDIUM")
    output_medium = models.TextField(blank=True, help_text="Expected output format/medium")
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)
    sub_department = models.CharField(
        max_length=50,
        choices=SUB_DEPARTMENT_CHOICES,
        blank=True,
        null=True,
        help_text="Sub-department within the main department",
    )

    # Assignment fields
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
    )
    assignees = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="assigned_tasks_multiple",
    )
    assigned_to_name = models.CharField(max_length=255, blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_tasks",
    )

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")

    # File attachments
    attachment = models.FileField(upload_to="task_attachments/", null=True, blank=True)
    requires_completion_proof = models.BooleanField(default=False)
    completion_proof = models.FileField(upload_to="task_completion_proofs/", null=True, blank=True)
    completion_notes = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "tasks"
        ordering = ["-created_at"]

    def __str__(self):
        assignee_names = self.get_assignee_names()
        if assignee_names:
            return f"{self.title} - {', '.join(assignee_names)}"
        return f"{self.title} - Unassigned"

    def get_assignee_names(self):
        """Get list of all assignee names (both single and multiple)"""
        names = []

        try:
            if self.assignees.exists():
                names.extend([user.name for user in self.assignees.all()])
        except Exception:
            pass

        if self.assigned_to and self.assigned_to.name not in names:
            names.append(self.assigned_to.name)

        if self.assigned_to_name and self.assigned_to_name not in names:
            names.append(self.assigned_to_name)

        return names

    def get_all_assignees(self):
        """Get all assigned users (both single and multiple)"""
        try:
            assignees = list(self.assignees.all())
        except Exception:
            assignees = []

        if self.assigned_to and self.assigned_to not in assignees:
            assignees.append(self.assigned_to)

        return assignees

    def is_assigned_to_user(self, user):
        """Check if a user is assigned to this task (either single or multiple)"""
        if self.assigned_to == user:
            return True
        try:
            if self.assignees.filter(id=user.id).exists():
                return True
        except Exception:
            pass
        if self.assigned_to_name == user.name:
            return True
        return False


class TaskStatusHistory(models.Model):
    """Track status changes for tasks"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="status_history")
    old_status = models.CharField(max_length=20, choices=Task.STATUS_CHOICES, null=True, blank=True)
    new_status = models.CharField(max_length=20, choices=Task.STATUS_CHOICES)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="status_changes",
    )
    changed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, help_text="Optional notes about the status change")

    class Meta:
        db_table = "task_status_history"
        ordering = ["-changed_at"]

    def __str__(self):
        return f"Task {self.task.title}: {self.old_status} → {self.new_status}"


class TaskNotification(models.Model):
    """Notification model for task assignments and updates"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="task_notifications"
    )
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="notifications")
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "task_notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notification for {self.user.name}: {self.message[:50]}..."
