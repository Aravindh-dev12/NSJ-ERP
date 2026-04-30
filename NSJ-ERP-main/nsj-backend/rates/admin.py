from django.contrib import admin
from .models import DailyRate, PartyRate


@admin.register(DailyRate)
class DailyRateAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "rate_date",
        "metal_type",
        "karat",
        "rate_per_gram",
        "company",
        "created_by",
        "created_at",
    )
    list_filter = ("metal_type", "karat", "company", "rate_date")
    search_fields = ("metal_type", "karat")
    readonly_fields = ("created_at",)


@admin.register(PartyRate)
class PartyRateAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "account",
        "metal_type",
        "karat",
        "rate_type",
        "rate_value",
        "effective_from",
        "effective_to",
        "company",
        "created_by",
        "created_at",
    )
    list_filter = ("metal_type", "karat", "rate_type", "company", "effective_from")
    search_fields = ("account__account_name", "metal_type", "karat")
    readonly_fields = ("created_at",)
