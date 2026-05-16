from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import RepairIssueViewSet, OrderIssueViewSet, QueryViewSet

router = DefaultRouter()
# Register repair issues at repair-issues/ prefix to avoid conflicts
router.register(r"repair-issues", RepairIssueViewSet, basename="repairissue")
router.register(r"order-issues", OrderIssueViewSet, basename="orderissue")
router.register(r"queries", QueryViewSet, basename="query")

urlpatterns = [
    # Explicit routes for queries FIRST to ensure they take priority
    path(
        "queries/",
        QueryViewSet.as_view({"get": "list", "post": "create"}),
        name="query-list",
    ),
    path(
        "queries/<uuid:pk>/",
        QueryViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="query-detail",
    ),
    path(
        "queries/<uuid:pk>/convert_to_order/",
        QueryViewSet.as_view({"post": "convert_to_order"}),
        name="query-convert-to-order",
    ),
    path(
        "queries/<uuid:pk>/archive/",
        QueryViewSet.as_view({"post": "archive"}),
        name="query-archive",
    ),
    path(
        "queries/<uuid:pk>/reopen/",
        QueryViewSet.as_view({"post": "reopen"}),
        name="query-reopen",
    ),
    path(
        "queries/auto_archive/",
        QueryViewSet.as_view({"post": "auto_archive"}),
        name="query-auto-archive",
    ),
    # Include router URLs after explicit routes
    path("", include(router.urls)),
    # Explicit routes for queries to ensure POST/GET work even if router resolution
    # is affected by upstream includes or client URL construction.
    path(
        "queries/",
        QueryViewSet.as_view({"get": "list", "post": "create"}),
        name="query-list",
    ),
    path(
        "queries/<uuid:pk>/",
        QueryViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="query-detail",
    ),
]
