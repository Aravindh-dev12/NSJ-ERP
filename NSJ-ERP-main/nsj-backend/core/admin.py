from django.contrib import admin
from .models import Company, Branch, CountryMaster, StateMaster, CityMaster, LocationMaster
from .models import SeriesMaster, StampMaster, BaseMetalMaster
from .models import ItemNameMaster, ClarityMaster, ShapeMaster, UnitMaster
from .models import SizeMaster, ColourMaster, LabMaster
from .models import (
    GoldCaratMaster,
    MetalTypeMaster,
    MetalColorMaster,
    ItemGroupMaster,
    MasterDataRequest,
    GemstoneMaster,
    GemstoneShapeMaster,
    GemstoneColorMaster,
    GemstoneClarityMaster,
    GemstoneTreatmentMaster,
    OriginMaster,
    CutMaster,
    PolishMaster,
    SymmetryMaster,
)


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "display_name", "is_active", "created_at")
    search_fields = ("name", "display_name")
    list_filter = ("is_active",)


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "company", "code", "is_active", "created_at")
    search_fields = ("name", "code")
    list_filter = ("is_active", "company")


@admin.register(CountryMaster)
class CountryMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code")
    search_fields = ("name", "code")


@admin.register(StateMaster)
class StateMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "country")
    search_fields = ("name", "code")
    list_filter = ("country",)


@admin.register(CityMaster)
class CityMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "state")
    search_fields = ("name", "code")
    list_filter = ("state",)


@admin.register(LocationMaster)
class LocationMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "company")
    search_fields = ("name",)
    list_filter = ("company",)


@admin.register(SeriesMaster)
class SeriesMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "company")
    search_fields = ("name",)
    list_filter = ("company",)


@admin.register(StampMaster)
class StampMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "company")
    search_fields = ("name", "code")
    list_filter = ("company",)


@admin.register(BaseMetalMaster)
class BaseMetalMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "company")
    search_fields = ("name", "code")
    list_filter = ("company",)


@admin.register(ItemNameMaster)
class ItemNameMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "company")
    search_fields = ("name", "code")
    list_filter = ("company",)


@admin.register(ClarityMaster)
class ClarityMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "company")
    search_fields = ("name", "code")
    list_filter = ("company",)


@admin.register(ShapeMaster)
class ShapeMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "company")
    search_fields = ("name", "code")
    list_filter = ("company",)


@admin.register(UnitMaster)
class UnitMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "company")
    search_fields = ("name", "code")
    list_filter = ("company",)


@admin.register(SizeMaster)
class SizeMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "company")
    search_fields = ("name",)
    list_filter = ("company",)


@admin.register(ColourMaster)
class ColourMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "company")
    search_fields = ("name",)
    list_filter = ("company",)


@admin.register(LabMaster)
class LabMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "company")
    search_fields = ("name",)
    list_filter = ("company",)


@admin.register(GoldCaratMaster)
class GoldCaratMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "value", "is_standard", "company", "created_at")
    search_fields = ("name",)
    list_filter = ("is_standard", "company")
    ordering = ("-value",)


@admin.register(MetalTypeMaster)
class MetalTypeMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "company", "created_at")
    search_fields = ("name",)
    list_filter = ("company",)


@admin.register(MetalColorMaster)
class MetalColorMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "metal_type", "company", "created_at")
    search_fields = ("name",)
    list_filter = ("metal_type", "company")


@admin.register(ItemGroupMaster)
class ItemGroupMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "company", "created_at")
    search_fields = ("name",)
    list_filter = ("company",)


@admin.register(MasterDataRequest)
class MasterDataRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "master_type",
        "requested_value",
        "status",
        "requested_by",
        "reviewed_by",
        "created_at",
    )
    search_fields = ("requested_value", "requested_by__name")
    list_filter = ("master_type", "status", "company")
    readonly_fields = ("created_at", "updated_at", "reviewed_at")
    ordering = ("-created_at",)


@admin.register(GemstoneMaster)
class GemstoneMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "company", "created_at")
    search_fields = ("name", "code")
    list_filter = ("company",)


@admin.register(GemstoneShapeMaster)
class GemstoneShapeMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "company", "created_at")
    search_fields = ("name", "code")
    list_filter = ("company",)


@admin.register(GemstoneColorMaster)
class GemstoneColorMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "company", "created_at")
    search_fields = ("name", "code")
    list_filter = ("company",)


@admin.register(GemstoneClarityMaster)
class GemstoneClarityMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "company", "created_at")
    search_fields = ("name", "code")
    list_filter = ("company",)


@admin.register(GemstoneTreatmentMaster)
class GemstoneTreatmentMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "company", "created_at")
    search_fields = ("name", "code")
    list_filter = ("company",)


@admin.register(OriginMaster)
class OriginMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "material_type", "company", "created_at")
    search_fields = ("name",)
    list_filter = ("material_type", "company")


@admin.register(CutMaster)
class CutMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "company", "created_at")
    search_fields = ("name", "code")
    list_filter = ("company",)


@admin.register(PolishMaster)
class PolishMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "company", "created_at")
    search_fields = ("name", "code")
    list_filter = ("company",)


@admin.register(SymmetryMaster)
class SymmetryMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "company", "created_at")
    search_fields = ("name", "code")
    list_filter = ("company",)
