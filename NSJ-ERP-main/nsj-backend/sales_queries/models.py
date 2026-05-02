# import uuid
# from django.db import models
# from django.utils import timezone


# class SalesQuery(models.Model):
#     """Sales Query model - Detailed customer inquiry with advanced tracking fields"""

#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

#     # Basic Order Information
#     order_date = models.DateField()
#     sales_person = models.CharField(max_length=255)
#     vendor = models.CharField(max_length=255, blank=True, null=True)

#     # Client Details
#     account = models.ForeignKey(
#         "accounts.Account",
#         on_delete=models.CASCADE,
#         related_name="sales_queries",
#     )
#     sub_account = models.CharField(max_length=255, blank=True, null=True)
#     phone_number = models.CharField(max_length=15, blank=True, null=True)
#     email = models.EmailField(blank=True, null=True)
#     city = models.CharField(max_length=255, blank=True, null=True)
#     client_delivery_type = models.CharField(max_length=255, blank=True, null=True)
#     pan_gstin = models.CharField(max_length=50, blank=True, null=True)

#     # Occasion & Intent
#     occasion = models.JSONField(default=list, blank=True)  # Array of strings like ["Wedding", "Engagement"]
#     required_delivery_date = models.DateField(blank=True, null=True)
#     stock_in_deadline = models.DateField(blank=True, null=True)
#     purpose = models.JSONField(default=list, blank=True)  # Array of strings like ["Self", "Gift"]

#     # Jewellery Details
#     jewellery_type = models.CharField(max_length=255)
#     size_details = models.TextField(blank=True, null=True)
#     fit_details = models.TextField(blank=True, null=True)
#     follow_up_log = models.TextField(blank=True, null=True)
#     style_preference = models.JSONField(default=list, blank=True)  # Array of strings
#     metal_preference = models.JSONField(default=list, blank=True)  # Array of strings

#     # Diamond/Gemstone
#     diamond_shape = models.CharField(max_length=255, blank=True, null=True)
#     color_clarity = models.CharField(max_length=255, blank=True, null=True)
#     origin = models.CharField(max_length=255, blank=True, null=True)
#     diamond_budget = models.CharField(max_length=255, blank=True, null=True)
#     diamond_priority = models.JSONField(default=list, blank=True)  # Array of strings
#     sample_details = models.TextField(blank=True, null=True)
#     gemstone_preference = models.CharField(max_length=255, blank=True, null=True)
#     gemstone_color_clarity = models.CharField(max_length=255, blank=True, null=True)
#     gemstone_origin = models.CharField(max_length=255, blank=True, null=True)
#     other_details = models.TextField(blank=True, null=True)

#     # Budget & Reference
#     budget_range = models.CharField(max_length=255, blank=True, null=True)
#     urgency_level = models.JSONField(default=list, blank=True)  # Array of strings
#     reference_source = models.JSONField(default=list, blank=True)  # Array of strings

#     # Notes
#     must_have = models.TextField(blank=True, null=True)
#     must_avoid = models.TextField(blank=True, null=True)
#     special_instructions = models.TextField(blank=True, null=True)

#     # Advance Handling (Nested Object)
#     advance_handling = models.JSONField(default=dict, blank=True)

#     # Department Instructions (Nested Object)
#     department_instructions = models.JSONField(default=dict, blank=True)

#     # Final Design & Delivery (Nested Object)
#     design_delivery = models.JSONField(default=dict, blank=True)

#     # Ledger Entries (Array of Objects)
#     ledger_entries = models.JSONField(default=list, blank=True)

#     # Status tracking
#     status = models.CharField(max_length=20, default="pending")

#     # Metadata
#     created_by = models.ForeignKey(
#         "users.User",
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         related_name="created_sales_queries",
#     )
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         db_table = "sales_queries"
#         ordering = ["-created_at"]
#         verbose_name = "Sales Query"
#         verbose_name_plural = "Sales Queries"
#         indexes = [
#             models.Index(fields=["-created_at"]),
#             models.Index(fields=["account"]),
#             models.Index(fields=["order_date"]),
#         ]

#     def __str__(self):
#         account_name = self.account.account_name if self.account else "Unknown"
#         return f"Sales Query: {account_name} - {self.jewellery_type}"

#     def to_dict(self):
#         """Serialize to dict for API responses"""
#         return {
#             "id": str(self.id),
#             "order_date": self.order_date.isoformat() if self.order_date else None,
#             "sales_person": self.sales_person,
#             "vendor": self.vendor,
#             "account": {
#                 "id": str(self.account.id),
#                 "account_name": self.account.account_name,
#                 "name": self.account.account_name,
#             } if self.account else None,
#             "sub_account": self.sub_account,
#             "phone_number": self.phone_number,
#             "email": self.email,
#             "city": self.city,
#             "client_delivery_type": self.client_delivery_type,
#             "pan_gstin": self.pan_gstin,
#             "occasion": self.occasion,
#             "required_delivery_date": self.required_delivery_date.isoformat() if self.required_delivery_date else None,
#             "stock_in_deadline": self.stock_in_deadline.isoformat() if self.stock_in_deadline else None,
#             "purpose": self.purpose,
#             "jewellery_type": self.jewellery_type,
#             "size_details": self.size_details,
#             "fit_details": self.fit_details,
#             "follow_up_log": self.follow_up_log,
#             "style_preference": self.style_preference,
#             "metal_preference": self.metal_preference,
#             "diamond_shape": self.diamond_shape,
#             "color_clarity": self.color_clarity,
#             "origin": self.origin,
#             "diamond_budget": self.diamond_budget,
#             "diamond_priority": self.diamond_priority,
#             "sample_details": self.sample_details,
#             "gemstone_preference": self.gemstone_preference,
#             "gemstone_color_clarity": self.gemstone_color_clarity,
#             "gemstone_origin": self.gemstone_origin,
#             "other_details": self.other_details,
#             "budget_range": self.budget_range,
#             "urgency_level": self.urgency_level,
#             "reference_source": self.reference_source,
#             "must_have": self.must_have,
#             "must_avoid": self.must_avoid,
#             "special_instructions": self.special_instructions,
#             "advance_handling": self.advance_handling,
#             "department_instructions": self.department_instructions,
#             "design_delivery": self.design_delivery,
#             "ledger_entries": self.ledger_entries,
#             "status": self.status,
#             "created_at": self.created_at.isoformat(),
#             "updated_at": self.updated_at.isoformat(),
#         }


import uuid
from django.db import models


# Default 29 Process Tasks - Bespoke Jewellery Order Processing Checklist
DEFAULT_PROCESS_TASKS = [
    {
        "position": 1,
        "name": "Advance Received",
        "description": "Client sign on estimate & 35 or 50% advance received",
        "department": "ACCOUNTS",
    },
    {
        "position": 2,
        "name": "Generate Order ID",
        "description": "Generate unique order number",
        "department": "ADMIN",
    },
    {
        "position": 3,
        "name": "2D Design Approval",
        "description": "Handover signed document",
        "department": "DESIGN",
    },
    {
        "position": 4,
        "name": "Estimate Approval",
        "description": "Check karigar/vendor & get sign on physical trade slip",
        "department": "SALES",
    },
    {
        "position": 5,
        "name": "Order Issue to Karigar",
        "description": "Issue order to production karigar",
        "department": "PRODUCTION",
    },
    {
        "position": 6,
        "name": "3D Design",
        "description": "Print and add finally approved CAD",
        "department": "VENDOR",
    },
    {
        "position": 7,
        "name": "3D Design Approval",
        "description": "Signed by Niti/US",
        "department": "SALES",
    },
    {
        "position": 8,
        "name": "3D Printing/CAM Piece",
        "description": "Create physical prototype",
        "department": "VENDOR",
    },
    {
        "position": 9,
        "name": "CAM Piece QC",
        "description": "Quality check of CAM piece",
        "department": "PRODUCTION",
    },
    {
        "position": 10,
        "name": "CAM Piece Trial Approval",
        "description": "Client approval of CAM piece",
        "department": "SALES",
    },
    {
        "position": 11,
        "name": "Stone Demand to Bagging",
        "description": "Request stones for bagging",
        "department": "PRODUCTION",
    },
    {
        "position": 12,
        "name": "Metal Issue",
        "description": "Issue metal for production - memo",
        "department": "RAW MATERIAL",
    },
    {
        "position": 13,
        "name": "Casting",
        "description": "Cast the jewelry piece - photo",
        "department": "VENDOR",
    },
    {
        "position": 14,
        "name": "Ghat QC",
        "description": "Quality check after casting",
        "department": "PRODUCTION",
    },
    {
        "position": 15,
        "name": "Ghat Trial Approval",
        "description": "Signed approval by client",
        "department": "SALES",
    },
    {
        "position": 16,
        "name": "Bagging Ready",
        "description": "Stones ready for setting",
        "department": "RAW MATERIAL + PRODUCTION",
    },
    {
        "position": 17,
        "name": "Diamond Purchase/Issue",
        "description": "Purchase or issue diamonds - memo",
        "department": "RAW MATERIAL + PRODUCTION",
    },
    {
        "position": 18,
        "name": "Gemstone Purchase/Issue",
        "description": "Purchase or issue gemstones - memo",
        "department": "RAW MATERIAL + PRODUCTION",
    },
    {
        "position": 19,
        "name": "Stone Setting",
        "description": "Set stones in jewelry - start date",
        "department": "VENDOR",
    },
    {
        "position": 20,
        "name": "Pre Rhodium QC",
        "description": "Quality check before rhodium",
        "department": "PRODUCTION",
    },
    {
        "position": 21,
        "name": "Rhodium + Stamping",
        "description": "Apply rhodium plating and stamp",
        "department": "VENDOR",
    },
    {
        "position": 22,
        "name": "Item with Final Packing List In",
        "description": "Final packing list prepared",
        "department": "ADMIN",
    },
    {
        "position": 23,
        "name": "Raw Material Tally",
        "description": "Tally raw materials used",
        "department": "RAW MATERIAL",
    },
    {
        "position": 24,
        "name": "Photo/Video for Catalogue",
        "description": "Professional photography",
        "department": "PRODUCTION",
    },
    {
        "position": 25,
        "name": "Tagging",
        "description": "Tag the jewelry item",
        "department": "ADMIN",
    },
    {
        "position": 26,
        "name": "Certification",
        "description": "Get certification - optional",
        "department": "SALES",
    },
    {
        "position": 27,
        "name": "Invoice",
        "description": "Generate invoice - invoice number",
        "department": "SALES",
    },
    {
        "position": 28,
        "name": "Payment",
        "description": "Collect payment from client",
        "department": "SALES",
    },
    {
        "position": 29,
        "name": "Delivery",
        "description": "Deliver to client",
        "department": "LOGISTICS",
    },
]


class SalesQuery(models.Model):
    """Sales Query model - Detailed customer inquiry with advanced tracking fields"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Basic Order Information
    order_date = models.DateField()
    sales_person = models.CharField(max_length=255)
    vendor = models.CharField(max_length=255, blank=True, null=True)

    # Client Details
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.CASCADE,
        related_name="sales_queries",
    )
    # Keep old text field for backward compatibility
    sub_account = models.CharField(max_length=255, blank=True, null=True)
    # New ForeignKey field for proper sub account relationship
    sub_account_record = models.ForeignKey(
        "accounts.SubAccount",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_queries",
        help_text="Sub account for detailed customer tracking",
    )
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    city = models.CharField(max_length=255, blank=True, null=True)

    # Delivery Type Choices
    DELIVERY_TYPE_CHOICES = [
        ("HOME", "Home Delivery"),
        ("PICKUP", "Pickup"),
        ("INSTORE", "In-Store"),
        ("LOCAL_PARCEL", "Local Parcel"),
        ("JAY_AMBE", "Jay Ambe Express Logistics"),
        ("MAA_BHAWANI", "Maa Bhawani Logistics"),
        ("BVC", "BVC Logistics"),
        ("SEQUEL", "Sequel Logistics"),
    ]
    client_delivery_type = models.CharField(
        max_length=20,
        choices=DELIVERY_TYPE_CHOICES,
        blank=True,
        null=True,
        help_text="Delivery type: Home, Pickup, or In-Store",
    )

    pan_gstin = models.CharField(max_length=12, blank=True, null=True)

    # Occasion & Intent
    occasion = models.JSONField(
        default=list, blank=True
    )  # Array of strings like ["Wedding", "Engagement"]
    required_delivery_date = models.DateField(blank=True, null=True)
    stock_in_deadline = models.DateField(blank=True, null=True)
    # Array of strings like ["Self", "Gift"]
    purpose = models.JSONField(default=list, blank=True)

    # Jewellery Details
    jewellery_type = models.CharField(max_length=255)  # Keep for backward compatibility
    jewellery_type_master = models.ForeignKey(
        "core.ItemNameMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_queries",
        help_text="Jewellery type from Item Name Master",
    )
    gold_quality = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text="Gold purity in KT (e.g., 18KT, 22KT, 24KT) - supports hardcoded dropdown or custom input",
    )
    size_details = models.TextField(blank=True, null=True)
    fit_details = models.TextField(blank=True, null=True)
    follow_up_log = models.TextField(blank=True, null=True)
    style_preference = models.JSONField(default=list, blank=True)  # Array of strings
    metal_preference = models.JSONField(default=list, blank=True)  # Array of strings

    # Diamond/Gemstone
    diamond_shape = models.CharField(max_length=255, blank=True, null=True)
    color_clarity = models.CharField(max_length=255, blank=True, null=True)
    origin = models.CharField(max_length=255, blank=True, null=True)
    diamond_budget = models.CharField(max_length=255, blank=True, null=True)
    diamond_priority = models.JSONField(default=list, blank=True)  # Array of strings
    sample_details = models.TextField(blank=True, null=True)
    sample_photo = models.FileField(
        upload_to="sales_query_samples/",
        null=True,
        blank=True,
        help_text="Photo attachment for sample reference",
    )
    gemstone_preference = models.CharField(max_length=255, blank=True, null=True)
    gemstone_color_clarity = models.CharField(max_length=255, blank=True, null=True)
    gemstone_origin = models.CharField(max_length=255, blank=True, null=True)
    other_details = models.TextField(blank=True, null=True)

    # Budget & Reference
    budget_range = models.CharField(max_length=255, blank=True, null=True)
    urgency_level = models.JSONField(default=list, blank=True)  # Array of strings
    reference_source = models.JSONField(default=list, blank=True)  # Array of strings

    # Notes
    must_have = models.TextField(blank=True, null=True)
    must_avoid = models.TextField(blank=True, null=True)
    special_instructions = models.TextField(blank=True, null=True)

    # Transfer and Follow-up fields
    transfer_department = models.CharField(max_length=255, blank=True, null=True)
    # Array of follow-up log objects
    follow_up_logs = models.JSONField(default=list, blank=True, null=True)

    # Advance Handling (Nested Object)
    advance_handling = models.JSONField(default=dict, blank=True)

    # Department Instructions (Nested Object)
    department_instructions = models.JSONField(default=dict, blank=True)

    # Final Design & Delivery (Nested Object)
    design_delivery = models.JSONField(default=dict, blank=True)

    # Ledger Entries (Array of Objects)
    ledger_entries = models.JSONField(default=list, blank=True)

    # Status tracking
    status = models.CharField(max_length=20, default="pending")
    is_deleted = models.BooleanField(default=False)  # Soft delete flag

    # Sale Conversion Fields
    advance_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Advance amount received when converting to sale",
    )
    sale_notes = models.TextField(
        blank=True, null=True, help_text="Notes added during sale conversion"
    )

    # Enhanced Estimate Integration Fields
    estimate_calculated = models.BooleanField(default=False)
    estimate_id = models.UUIDField(null=True, blank=True)  # Keep for backward compatibility
    selected_estimate_id = models.UUIDField(null=True, blank=True)  # Final chosen estimate

    final_order_id = models.UUIDField(
        null=True, blank=True, help_text="ID of the final Order created from this Sales Query"
    )

    # Workflow Status for Estimate Process
    WORKFLOW_STATUS_CHOICES = [
        ("inquiry_received", "Inquiry Received"),
        ("estimates_pending", "Estimates Pending"),
        ("estimates_ready", "Estimates Ready"),
        ("estimate_selected", "Estimate Selected"),
        ("converted_to_sale", "Converted to Sale"),
        ("converted_to_order", "Converted to Order"),
        ("cancelled", "Cancelled"),
    ]
    workflow_status = models.CharField(
        max_length=30,
        choices=WORKFLOW_STATUS_CHOICES,
        default="inquiry_received",
        null=True,
        blank=True,
    )

    # Photo Upload Field
    reference_photo = models.FileField(
        upload_to="sales_query_photos/",
        null=True,
        blank=True,
        help_text="Upload reference photo for the sales query",
    )

    # Metadata
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_sales_queries",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sales_queries"
        ordering = ["-created_at"]
        verbose_name = "Sales Query"
        verbose_name_plural = "Sales Queries"
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["account"]),
            models.Index(fields=["order_date"]),
        ]

    def __str__(self):
        account_name = self.account.account_name if self.account else "Unknown"
        return f"Sales Query: {account_name} - {self.jewellery_type}"

    def to_dict(self):
        """Serialize to dict for API responses"""
        return {
            "id": str(self.id),
            "order_date": self.order_date.isoformat() if self.order_date else None,
            "sales_person": self.sales_person,
            "vendor": self.vendor,
            "account": {
                "id": str(self.account.id),
                "account_name": self.account.account_name,
                "name": self.account.account_name,
            }
            if self.account
            else None,
            "sub_account": self.sub_account,
            "sub_account_record": {
                "id": str(self.sub_account_record.id),
                "sub_account_name": self.sub_account_record.sub_account_name,
                "name": self.sub_account_record.sub_account_name,
                "phone_number": self.sub_account_record.phone_number,
                "email": self.sub_account_record.email,
            }
            if self.sub_account_record
            else None,
            "phone_number": self.phone_number,
            "email": self.email,
            "city": self.city,
            "client_delivery_type": self.client_delivery_type,
            "pan_gstin": self.pan_gstin,
            "occasion": self.occasion,
            "required_delivery_date": self.required_delivery_date.isoformat()
            if self.required_delivery_date
            else None,
            "stock_in_deadline": self.stock_in_deadline.isoformat()
            if self.stock_in_deadline
            else None,
            "purpose": self.purpose,
            "jewellery_type": self.jewellery_type,
            "jewellery_type_master": {
                "id": str(self.jewellery_type_master.id),
                "name": self.jewellery_type_master.name,
                "code": self.jewellery_type_master.code,
            }
            if self.jewellery_type_master
            else None,
            "gold_quality": self.gold_quality,
            "size_details": self.size_details,
            "fit_details": self.fit_details,
            "follow_up_log": self.follow_up_log,
            "style_preference": self.style_preference,
            "metal_preference": self.metal_preference,
            "diamond_shape": self.diamond_shape,
            "color_clarity": self.color_clarity,
            "origin": self.origin,
            "diamond_budget": self.diamond_budget,
            "diamond_priority": self.diamond_priority,
            "sample_details": self.sample_details,
            "sample_photo": self.sample_photo.url if self.sample_photo else None,
            "gemstone_preference": self.gemstone_preference,
            "gemstone_color_clarity": self.gemstone_color_clarity,
            "gemstone_origin": self.gemstone_origin,
            "other_details": self.other_details,
            "budget_range": self.budget_range,
            "urgency_level": self.urgency_level,
            "reference_source": self.reference_source,
            "must_have": self.must_have,
            "must_avoid": self.must_avoid,
            "special_instructions": self.special_instructions,
            "transfer_department": self.transfer_department,
            "follow_up_logs": self.follow_up_logs,
            "advance_handling": self.advance_handling,
            "department_instructions": self.department_instructions,
            "design_delivery": self.design_delivery,
            "ledger_entries": self.ledger_entries,
            "status": self.status,
            "workflow_status": self.workflow_status,
            "selected_estimate_id": str(self.selected_estimate_id)
            if self.selected_estimate_id
            else None,
            "reference_photo": self.reference_photo.url if self.reference_photo else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class ProcessOrder(models.Model):
    """Process Order model - Links to SalesQuery and tracks custom task ordering"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sales_query = models.OneToOneField(
        "SalesQuery",
        on_delete=models.CASCADE,
        related_name="process_order",
        help_text="Sales query this process order belongs to",
    )
    is_custom = models.BooleanField(
        default=False, help_text="Whether this uses custom task ordering"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "process_orders"
        ordering = ["-created_at"]
        verbose_name = "Process Order"
        verbose_name_plural = "Process Orders"

    def __str__(self):
        return f"Process Order for {self.sales_query.jewellery_type} ({'Custom' if self.is_custom else 'Default'})"


class ProcessTask(models.Model):
    """Process Task model - Individual tasks with positions"""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("blocked", "Blocked"),
        ("skipped", "Skipped"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    process_order = models.ForeignKey(
        "ProcessOrder",
        on_delete=models.CASCADE,
        related_name="tasks",
        help_text="Process order this task belongs to",
    )
    task_name = models.CharField(max_length=200, help_text="Name of the task")
    description = models.TextField(blank=True, help_text="Detailed description of the task")
    department = models.CharField(
        max_length=100, blank=True, help_text="Department responsible for this task"
    )
    original_position = models.IntegerField(help_text="Original position in default order (1-29)")
    custom_position = models.IntegerField(help_text="Custom position after reordering (1-29)")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="pending", help_text="Current task status"
    )
    assigned_to = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_process_tasks",
        help_text="User assigned to this task",
    )
    due_date = models.DateField(null=True, blank=True, help_text="Task due date")
    completed_at = models.DateTimeField(null=True, blank=True, help_text="When task was completed")
    notes = models.TextField(blank=True, help_text="Additional notes for this task")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "process_tasks"
        ordering = ["custom_position"]
        verbose_name = "Process Task"
        verbose_name_plural = "Process Tasks"
        indexes = [
            models.Index(fields=["process_order", "custom_position"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.custom_position}. {self.task_name} ({self.status})"


class ProcessDependency(models.Model):
    """Process Dependency model - Tracks task dependencies"""

    DEPENDENCY_TYPE_CHOICES = [
        ("must_complete_before", "Must Complete Before"),
        ("should_complete_before", "Should Complete Before"),
        ("blocks", "Blocks"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(
        "ProcessTask",
        on_delete=models.CASCADE,
        related_name="dependencies",
        help_text="Task that has the dependency",
    )
    depends_on_task = models.ForeignKey(
        "ProcessTask",
        on_delete=models.CASCADE,
        related_name="dependent_tasks",
        help_text="Task that must be completed first",
    )
    dependency_type = models.CharField(
        max_length=50,
        choices=DEPENDENCY_TYPE_CHOICES,
        default="must_complete_before",
        help_text="Type of dependency relationship",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "process_dependencies"
        verbose_name = "Process Dependency"
        verbose_name_plural = "Process Dependencies"
        unique_together = ["task", "depends_on_task"]

    def __str__(self):
        return f"{self.task.task_name} depends on {self.depends_on_task.task_name}"
