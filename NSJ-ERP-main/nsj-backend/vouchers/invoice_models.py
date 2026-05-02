"""
Invoice Models for Sales Invoicing
Generates invoices from completed sales with estimates
"""

import uuid
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


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
        "vouchers.Sale",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices",
        help_text="Link to the sale record",
    )
    estimate = models.ForeignKey(
        "vouchers.EstimateVoucher",
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

    # Customer information (copied from sales lead for PDF generation)
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
        max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))]
    )
    gst_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("3.00"), help_text="GST rate percentage"
    )
    gst_amount = models.DecimalField(
        max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))]
    )
    total_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Grand total including GST",
    )

    # Payment tracking
    amount_paid = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    balance_due = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
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
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Rate per unit",
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
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
        max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
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
        total_paid = self.invoice.payments.aggregate(total=models.Sum("amount"))[
            "total"
        ] or Decimal("0.00")

        self.invoice.amount_paid = total_paid
        self.invoice.save()
