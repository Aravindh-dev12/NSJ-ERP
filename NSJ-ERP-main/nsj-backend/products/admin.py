from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "sku",
        "name",
        "category",
        "metal_type",
        "karat",
        "gross_weight",
        "net_weight",
        "stock_quantity",
        "price",
        "status",
        "company",
        "branch",
    )
    list_filter = ("category", "metal_type", "karat", "status", "company", "branch")
    search_fields = ("sku", "name", "category")
    readonly_fields = ("created_at", "updated_at")
