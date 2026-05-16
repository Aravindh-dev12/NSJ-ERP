from django.contrib import admin
from .models import RepairIssue, OrderIssue, Query


@admin.register(Query)
class QueryAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "account",
        "item_name",
        "gold_carat",
        "status",
        "query_in_date",
        "expiry_date",
        "created_at",
    )
    list_filter = ("status", "created_at", "expiry_date")
    search_fields = ("account__account_name", "item_name__name", "gold_carat")
    readonly_fields = ("id", "created_at", "updated_at")
    fieldsets = (
        ("Query Information", {"fields": ("id", "account", "item_name", "status")}),
        ("Item Details", {"fields": ("gold_carat", "gender", "size")}),
        ("Delivery", {"fields": ("location", "delivery_type")}),
        ("Timeline", {"fields": ("query_in_date", "expiry_date")}),
        ("Media", {"fields": ("reference_image",)}),
        ("Metadata", {"fields": ("created_by", "created_at", "updated_at")}),
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(OrderIssue)
class OrderIssueAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "account", "status", "created_at", "updated_at")
    list_filter = ("status", "created_at")
    search_fields = ("order__bill_no", "account__account_name", "order_ref")
    readonly_fields = ("id", "created_at", "updated_at", "order")
    fieldsets = (
        ("Issue Information", {"fields": ("id", "order", "account", "item_name", "status")}),
        ("Details", {"fields": ("order_ref", "description")}),
        ("Metadata", {"fields": ("created_by", "created_at", "updated_at")}),
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(RepairIssue)
class RepairIssueAdmin(admin.ModelAdmin):
    list_display = (
        "tag_no",
        "company",
        "account",
        "item_name",
        "piece",
        "rate",
        "total",
        "created_at",
    )
    search_fields = ("tag_no", "remark")
