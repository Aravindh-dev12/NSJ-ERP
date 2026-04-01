# nsj_backend/urls.py
from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from core.views import health_check, company_list, company_detail
# from accounts.views import accounts_collection_view, account_detail_view, account_master_list_view

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health_check, name="health"),
    path("api/health/", health_check, name="api_health"),  # Railway healthcheck
    path("api/companies/", company_list, name="company_list"),
    path("api/companies/<uuid:pk>/", company_detail, name="company_detail"),
    # Payments (issues) routes must come before broader /api/ include to avoid shadowing
    path("api/payments/", include("issues.urls")),
    # Temporary compatibility for double-prefixed frontend base URL
    path("api/api/payments/", include("issues.urls")),
    path("api/", include("users.urls")),
    path("api/", include("accounts.urls")),
    path("api/", include("vouchers.urls")),
    path("api/", include("tasks.urls")),
    path("api/", include("sales_queries.urls")),
    path("api/reports/", include("reports.urls")),
    path("api/masters/", include("core.urls")),  # Master data management
    path("api/core/", include("core.urls")),
]

# Serve media files in both development and production
# In production, consider using a CDN or cloud storage for better performance
from django.urls import re_path

urlpatterns += [
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
]

# Also add static files serving for development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
