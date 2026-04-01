"""
URL configuration for core master data management.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GoldCaratMasterViewSet,
    MetalTypeMasterViewSet,
    MetalColorMasterViewSet,
    ItemGroupMasterViewSet,
    MasterDataRequestViewSet,
    ItemNameMasterViewSet,
    GoldQualityMasterViewSet,
    ClarityMasterViewSet,
    ShapeMasterViewSet,
    ColourMasterViewSet,
    SizeMasterViewSet,
    UnitMasterViewSet,
    LabMasterViewSet,
    GoldPriceFeedingViewSet,
    DepartmentViewSet,
    DashboardConfigurationViewSet,
    DailyGoldRateViewSet,
    CountryMasterViewSet,
    StateMasterViewSet,
    CityMasterViewSet,
    GemstoneMasterViewSet,
    GemstoneShapeMasterViewSet,
    GemstoneColorMasterViewSet,
    GemstoneClarityMasterViewSet,
    GemstoneTreatmentMasterViewSet,
    OriginMasterViewSet,
    CutMasterViewSet,
    PolishMasterViewSet,
    SymmetryMasterViewSet,
)

router = DefaultRouter()
router.register(r"gold-carats", GoldCaratMasterViewSet, basename="gold-carat")
router.register(r"metal-types", MetalTypeMasterViewSet, basename="metal-type")
router.register(r"metal-colors", MetalColorMasterViewSet, basename="metal-color")
router.register(r"item-groups", ItemGroupMasterViewSet, basename="item-group")
router.register(r"master-requests", MasterDataRequestViewSet, basename="master-request")
router.register(r"item-names", ItemNameMasterViewSet, basename="item-name")
router.register(r"gold-qualities", GoldQualityMasterViewSet, basename="gold-quality")
router.register(r"clarities", ClarityMasterViewSet, basename="clarity")
router.register(r"shapes", ShapeMasterViewSet, basename="shape")
router.register(r"colours", ColourMasterViewSet, basename="colour")
router.register(r"sizes", SizeMasterViewSet, basename="size")
router.register(r"units", UnitMasterViewSet, basename="unit")
router.register(r"labs", LabMasterViewSet, basename="lab")
router.register(r"gold-prices", GoldPriceFeedingViewSet, basename="gold-price")
router.register(r"departments", DepartmentViewSet, basename="department")
router.register(r"dashboard-configs", DashboardConfigurationViewSet, basename="dashboard-config")
router.register(r"gold-rates", DailyGoldRateViewSet, basename="gold-rate")
router.register(r"countries", CountryMasterViewSet, basename="country")
router.register(r"states", StateMasterViewSet, basename="state")
router.register(r"cities", CityMasterViewSet, basename="city")
router.register(r"gemstone-types", GemstoneMasterViewSet, basename="gemstone-type")
router.register(r"gemstone-shapes", GemstoneShapeMasterViewSet, basename="gemstone-shape")
router.register(r"gemstone-colors", GemstoneColorMasterViewSet, basename="gemstone-color")
router.register(r"gemstone-clarities", GemstoneClarityMasterViewSet, basename="gemstone-clarity")
router.register(r"gemstone-treatments", GemstoneTreatmentMasterViewSet, basename="gemstone-treatment")
router.register(r"origins", OriginMasterViewSet, basename="origin")
router.register(r"cuts", CutMasterViewSet, basename="cut")
router.register(r"polishes", PolishMasterViewSet, basename="polish")
router.register(r"symmetries", SymmetryMasterViewSet, basename="symmetry")

urlpatterns = [
    path("", include(router.urls)),
]
