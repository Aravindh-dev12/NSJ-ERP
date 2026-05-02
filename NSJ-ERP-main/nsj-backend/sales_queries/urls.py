# from django.urls import path
# from .views import SalesQueryViewSet

# urlpatterns = [
#     path('sales-queries/', SalesQueryViewSet.as_view({'get': 'list', 'post': 'create'}), name='sales-query-list'),
#     path('sales-queries/<uuid:pk>/', SalesQueryViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='sales-query-detail'),
#     path('sales-queries/dashboard-stats/', SalesQueryViewSet.as_view({'get': 'dashboard_stats'}), name='sales-query-dashboard-stats'),
#     path('sales-queries/create-estimate/', SalesQueryViewSet.as_view({'post': 'create_estimate'}), name='sales-query-create-estimate'),
#     path('sales-queries/available-estimates/', SalesQueryViewSet.as_view({'get': 'available_estimates'}), name='sales-query-available-estimates'),
# ]

from django.urls import path
from .views import SalesQueryViewSet

urlpatterns = [
    path(
        "sales-queries/",
        SalesQueryViewSet.as_view({"get": "list", "post": "create"}),
        name="sales-query-list",
    ),
    path(
        "sales-queries/<uuid:pk>/",
        SalesQueryViewSet.as_view(
            {"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}
        ),
        name="sales-query-detail",
    ),
    path(
        "sales-queries/<uuid:pk>/list_estimates/",
        SalesQueryViewSet.as_view({"get": "list_estimates"}),
        name="sales-query-list-estimates",
    ),
    path(
        "sales-queries/<uuid:pk>/create_estimate_variation/",
        SalesQueryViewSet.as_view({"post": "create_estimate_variation"}),
        name="sales-query-create-estimate-variation",
    ),
    path(
        "sales-queries/<uuid:pk>/select_final_estimate/",
        SalesQueryViewSet.as_view({"post": "select_final_estimate"}),
        name="sales-query-select-final-estimate",
    ),
    path(
        "sales-queries/<uuid:pk>/convert_to_sale/",
        SalesQueryViewSet.as_view({"post": "convert_to_sale"}),
        name="sales-query-convert-to-sale",
    ),
    path(
        "sales-queries/<uuid:pk>/estimate_summary/",
        SalesQueryViewSet.as_view({"get": "estimate_summary"}),
        name="sales-query-estimate-summary",
    ),
    path(
        "sales-queries/<uuid:pk>/update_workflow_status/",
        SalesQueryViewSet.as_view({"post": "update_workflow_status"}),
        name="sales-query-update-workflow-status",
    ),
    path(
        "sales-queries/<uuid:pk>/available_base_estimates/",
        SalesQueryViewSet.as_view({"get": "available_base_estimates"}),
        name="sales-query-available-base-estimates",
    ),
    path(
        "sales-queries/jewelry-types/",
        SalesQueryViewSet.as_view({"get": "jewelry_types"}),
        name="sales-query-jewelry-types",
    ),
    path(
        "sales-queries/dashboard-stats/",
        SalesQueryViewSet.as_view({"get": "dashboard_stats"}),
        name="sales-query-dashboard-stats",
    ),
    path(
        "sales-queries/create-estimate/",
        SalesQueryViewSet.as_view({"post": "create_estimate"}),
        name="sales-query-create-estimate",
    ),
    path(
        "sales-queries/available-estimates/",
        SalesQueryViewSet.as_view({"get": "available_estimates"}),
        name="sales-query-available-estimates",
    ),
    # Process Task Reordering Endpoints
    path(
        "process-tasks/default/",
        SalesQueryViewSet.as_view({"get": "get_default_process_tasks"}),
        name="process-tasks-default",
    ),
    path(
        "sales-queries/<uuid:pk>/process-order/",
        SalesQueryViewSet.as_view({"get": "get_process_order", "post": "save_process_order"}),
        name="sales-query-process-order",
    ),
    path(
        "sales-queries/<uuid:pk>/process-order/update/",
        SalesQueryViewSet.as_view({"put": "update_process_order"}),
        name="sales-query-process-order-update",
    ),
    path(
        "sales-queries/<uuid:pk>/process-order/reset/",
        SalesQueryViewSet.as_view({"post": "reset_process_order"}),
        name="sales-query-process-order-reset",
    ),
    path(
        "sales-queries/<uuid:pk>/initiate-order-conversion/",
        SalesQueryViewSet.as_view({"post": "initiate_order_conversion"}),
        name="sales-query-initiate-order-conversion",
    ),
    path(
        "sales-queries/<uuid:pk>/get-order/",
        SalesQueryViewSet.as_view({"get": "get_final_order"}),
        name="sales-query-get-order",
    ),
    path(
        "sales-queries/<uuid:pk>/process-tasks/<uuid:task_id>/",
        SalesQueryViewSet.as_view({"patch": "update_process_task"}),
        name="sales-query-process-task-update",
    ),
]
