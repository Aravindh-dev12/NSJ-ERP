"""
Views for core master data management.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods

from .models import (
    Company,
    GoldCaratMaster,
    MetalTypeMaster,
    MetalColorMaster,
    ItemGroupMaster,
    MasterDataRequest,
    ItemNameMaster,
    GoldQualityMaster,
    ClarityMaster,
    ShapeMaster,
    ColourMaster,
    SizeMaster,
    UnitMaster,
    LabMaster,
    GoldPriceFeeding,
    Department,
    DashboardConfiguration,
    DailyGoldRate,
    GoldRateChangeLog,
    CountryMaster,
    StateMaster,
    CityMaster,
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
from .serializers import (
    GoldCaratMasterSerializer,
    GoldPriceFeedingSerializer,
    DepartmentSerializer,
    DashboardConfigurationSerializer,
    MetalTypeMasterSerializer,
    MetalColorMasterSerializer,
    ItemGroupMasterSerializer,
    MasterDataRequestSerializer,
    ItemNameMasterSerializer,
    GoldQualityMasterSerializer,
    ClarityMasterSerializer,
    ShapeMasterSerializer,
    ColourMasterSerializer,
    SizeMasterSerializer,
    UnitMasterSerializer,
    LabMasterSerializer,
    DailyGoldRateSerializer,
    GoldRateChangeLogSerializer,
    CountryMasterSerializer,
    StateMasterSerializer,
    CityMasterSerializer,
    GemstoneMasterSerializer,
    GemstoneShapeMasterSerializer,
    GemstoneColorMasterSerializer,
    GemstoneClarityMasterSerializer,
    GemstoneTreatmentMasterSerializer,
    OriginMasterSerializer,
    CutMasterSerializer,
    PolishMasterSerializer,
    SymmetryMasterSerializer,
)


# Core utility views
@csrf_exempt
def cors_test(request):
    response = HttpResponse("CORS OK")
    response["Access-Control-Allow-Origin"] = "http://127.0.0.1:3000"
    response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken"
    response["Access-Control-Allow-Credentials"] = "true"
    return response


@api_view(["GET"])
@permission_classes([AllowAny])
@require_http_methods(["GET"])
@csrf_exempt
def health_check(request):
    """Health check endpoint - bypasses ALLOWED_HOSTS check"""
    return JsonResponse({"status": "ok", "service": "NSJ Backend"})


@api_view(["GET", "POST"])
@csrf_exempt
def company_list(request):
    if request.method == "GET":
        companies = Company.objects.all().values(
            "id", "name", "display_name", "is_active", "created_at"
        )
        return Response(list(companies))

    # POST
    data = request.data
    obj = Company.objects.create(
        name=data.get("name", ""),
        display_name=data.get("display_name", ""),
        is_active=data.get("is_active", True),
    )
    return Response(
        {
            "id": str(obj.id),
            "name": obj.name,
            "display_name": obj.display_name,
            "is_active": obj.is_active,
            "created_at": obj.created_at,
        },
        status=201,
    )


@api_view(["GET", "PUT", "PATCH", "DELETE", "OPTIONS"])
@permission_classes([AllowAny])
@csrf_exempt
def company_detail(request, pk):
    try:
        company = Company.objects.get(pk=pk)
    except Company.DoesNotExist:
        return Response({"error": "Company not found"}, status=404)

    if request.method in ("PUT", "PATCH"):
        data = request.data
        company.name = data.get("name", company.name)
        company.display_name = data.get("display_name", company.display_name)
        company.is_active = data.get("is_active", company.is_active)
        company.save()
        return Response(
            {
                "id": str(company.id),
                "name": company.name,
                "display_name": company.display_name,
                "is_active": company.is_active,
                "created_at": company.created_at,
            }
        )

    if request.method == "DELETE":
        company.delete()
        return Response(status=204)

    # GET/OPTIONS fall through:
    return Response(
        {
            "id": str(company.id),
            "name": company.name,
            "display_name": company.display_name,
            "is_active": company.is_active,
            "created_at": company.created_at,
        }
    )


# Master Data ViewSets


class GoldCaratMasterViewSet(viewsets.ModelViewSet):
    """ViewSet for Gold Carat Master"""

    serializer_class = GoldCaratMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return GoldCaratMaster.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("-value")
        return GoldCaratMaster.objects.filter(company__isnull=True).order_by("-value")

    def perform_create(self, serializer):
        user = self.request.user
        company = getattr(user, "company", None)
        serializer.save(company=company)


class MetalTypeMasterViewSet(viewsets.ModelViewSet):
    """ViewSet for Metal Type Master"""

    serializer_class = MetalTypeMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return MetalTypeMaster.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("name")
        return MetalTypeMaster.objects.filter(company__isnull=True).order_by("name")

    def perform_create(self, serializer):
        user = self.request.user
        company = getattr(user, "company", None)
        serializer.save(company=company)


class MetalColorMasterViewSet(viewsets.ModelViewSet):
    """ViewSet for Metal Color Master"""

    serializer_class = MetalColorMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return MetalColorMaster.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("name")
        return MetalColorMaster.objects.filter(company__isnull=True).order_by("name")

    def perform_create(self, serializer):
        user = self.request.user
        company = getattr(user, "company", None)
        serializer.save(company=company)


class ItemGroupMasterViewSet(viewsets.ModelViewSet):
    """ViewSet for Item Group Master"""

    serializer_class = ItemGroupMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return ItemGroupMaster.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("name")
        return ItemGroupMaster.objects.filter(company__isnull=True).order_by("name")

    def perform_create(self, serializer):
        user = self.request.user
        company = getattr(user, "company", None)
        serializer.save(company=company)


class MasterDataRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for Master Data Requests"""

    serializer_class = MasterDataRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            # Admins see all requests, users see only their own
            if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
                return MasterDataRequest.objects.filter(company=user.company).order_by(
                    "-created_at"
                )
            return MasterDataRequest.objects.filter(
                company=user.company, requested_by=user
            ).order_by("-created_at")
        return MasterDataRequest.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        company = getattr(user, "company", None)
        serializer.save(requested_by=user, company=company)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """Approve a master data request and create the master entry"""
        master_request = self.get_object()

        if master_request.status != "pending":
            return Response(
                {"error": "Request has already been reviewed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create the master data entry based on type
        try:
            company = master_request.company
            master_type = master_request.master_type
            value = master_request.requested_value

            if master_type == "item_name":
                ItemNameMaster.objects.create(name=value, company=company)
            elif master_type == "gold_carat":
                # Extract numeric value from name (e.g., "21K" -> 21)
                import re

                match = re.search(r"(\d+)", value)
                if match:
                    carat_value = int(match.group(1))
                    GoldCaratMaster.objects.create(name=value, value=carat_value, company=company)
                else:
                    return Response(
                        {"error": "Invalid carat format"}, status=status.HTTP_400_BAD_REQUEST
                    )
            elif master_type == "metal_type":
                MetalTypeMaster.objects.create(name=value, company=company)
            elif master_type == "metal_color":
                MetalColorMaster.objects.create(name=value, company=company)
            elif master_type == "clarity":
                ClarityMaster.objects.create(name=value, company=company)
            elif master_type == "shape":
                ShapeMaster.objects.create(name=value, company=company)
            elif master_type == "colour":
                ColourMaster.objects.create(name=value, company=company)
            elif master_type == "size":
                SizeMaster.objects.create(name=value, company=company)
            elif master_type == "unit":
                UnitMaster.objects.create(name=value, company=company)
            elif master_type == "lab":
                LabMaster.objects.create(name=value, company=company)

            # Update request status
            master_request.status = "approved"
            master_request.reviewed_by = request.user
            master_request.reviewed_at = timezone.now()
            master_request.save()

            return Response(
                {"message": "Request approved and master data created"},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """Reject a master data request"""
        master_request = self.get_object()

        if master_request.status != "pending":
            return Response(
                {"error": "Request has already been reviewed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rejection_reason = request.data.get("rejection_reason", "")

        master_request.status = "rejected"
        master_request.reviewed_by = request.user
        master_request.reviewed_at = timezone.now()
        master_request.rejection_reason = rejection_reason
        master_request.save()

        return Response({"message": "Request rejected"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def pending(self, request):
        """Get all pending requests"""
        user = request.user
        if hasattr(user, "company") and user.company:
            pending_requests = MasterDataRequest.objects.filter(
                company=user.company, status="pending"
            ).order_by("-created_at")
            serializer = self.get_serializer(pending_requests, many=True)
            return Response(serializer.data)
        return Response([])


class ItemNameMasterViewSet(viewsets.ModelViewSet):
    """ViewSet for Item Name Master"""

    serializer_class = ItemNameMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return ItemNameMaster.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("name")
        return ItemNameMaster.objects.filter(company__isnull=True).order_by("name")

    def perform_create(self, serializer):
        user = self.request.user
        company = getattr(user, "company", None)
        serializer.save(company=company)


class GoldQualityMasterViewSet(viewsets.ModelViewSet):
    """ViewSet for Gold Quality Master"""

    serializer_class = GoldQualityMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return GoldQualityMaster.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("name")
        return GoldQualityMaster.objects.filter(company__isnull=True).order_by("name")

    def perform_create(self, serializer):
        user = self.request.user
        company = getattr(user, "company", None)
        serializer.save(company=company)


class ClarityMasterViewSet(viewsets.ModelViewSet):
    """ViewSet for Clarity Master"""

    serializer_class = ClarityMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return ClarityMaster.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("name")
        return ClarityMaster.objects.filter(company__isnull=True).order_by("name")

    def perform_create(self, serializer):
        user = self.request.user
        company = getattr(user, "company", None)
        serializer.save(company=company)


class ShapeMasterViewSet(viewsets.ModelViewSet):
    """ViewSet for Shape Master"""

    serializer_class = ShapeMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return ShapeMaster.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("name")
        return ShapeMaster.objects.filter(company__isnull=True).order_by("name")

    def perform_create(self, serializer):
        user = self.request.user
        company = getattr(user, "company", None)
        serializer.save(company=company)


class ColourMasterViewSet(viewsets.ModelViewSet):
    """ViewSet for Colour Master"""

    serializer_class = ColourMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return ColourMaster.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("name")
        return ColourMaster.objects.filter(company__isnull=True).order_by("name")

    def perform_create(self, serializer):
        user = self.request.user
        company = getattr(user, "company", None)
        serializer.save(company=company)


class SizeMasterViewSet(viewsets.ModelViewSet):
    """ViewSet for Size Master"""

    serializer_class = SizeMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return SizeMaster.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("name")
        return SizeMaster.objects.filter(company__isnull=True).order_by("name")

    def perform_create(self, serializer):
        user = self.request.user
        company = getattr(user, "company", None)
        serializer.save(company=company)


class UnitMasterViewSet(viewsets.ModelViewSet):
    """ViewSet for Unit Master"""

    serializer_class = UnitMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return UnitMaster.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("name")
        return UnitMaster.objects.filter(company__isnull=True).order_by("name")

    def perform_create(self, serializer):
        user = self.request.user
        company = getattr(user, "company", None)
        serializer.save(company=company)


class LabMasterViewSet(viewsets.ModelViewSet):
    """ViewSet for Lab Master"""

    serializer_class = LabMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return LabMaster.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("name")
        return LabMaster.objects.filter(company__isnull=True).order_by("name")

    def perform_create(self, serializer):
        user = self.request.user
        company = getattr(user, "company", None)
        serializer.save(company=company)


class GoldPriceFeedingViewSet(viewsets.ModelViewSet):
    """ViewSet for Gold Price Feeding"""

    serializer_class = GoldPriceFeedingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return GoldPriceFeeding.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("-feeding_date", "-fed_at")
        return GoldPriceFeeding.objects.filter(company__isnull=True).order_by(
            "-feeding_date", "-fed_at"
        )

    def perform_create(self, serializer):
        user = self.request.user
        company = getattr(user, "company", None)
        serializer.save(fed_by=user, company=company)

    @action(detail=False, methods=["get"])
    def current(self, request):
        """Get current gold rate with lock status"""
        user = request.user
        company = getattr(user, "company", None)

        result = GoldPriceFeeding.get_current_rate(company)

        if result["rate"]:
            serializer = self.get_serializer(result["rate"])
            return Response(
                {
                    "is_locked": result["is_locked"],
                    "needs_feeding": result["needs_feeding"],
                    "rate": serializer.data,
                }
            )
        else:
            return Response(
                {
                    "is_locked": result["is_locked"],
                    "needs_feeding": result["needs_feeding"],
                    "rate": None,
                }
            )

    @action(detail=False, methods=["get"])
    def check_permission(self, request):
        """Check if user can update gold prices"""
        user = request.user
        # Only users with username 'mehul' or 'niti' can update
        can_update = user.username.lower() in ["mehul", "niti"]
        return Response({"can_update": can_update})


class DepartmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Department management"""

    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return Department.objects.filter(Q(company=user.company) | Q(company__isnull=True))
        return Department.objects.filter(company__isnull=True)

    @action(detail=False, methods=["get"])
    def my_departments(self, request):
        """Get departments assigned to current user"""
        user = request.user
        departments = user.departments.all()
        serializer = self.get_serializer(departments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def set_active(self, request, pk=None):
        """Set a department as the active view for current user"""
        department = self.get_object()
        user = request.user

        # Check if user belongs to this department
        if not user.departments.filter(id=department.id).exists():
            return Response(
                {"error": "You are not assigned to this department"},
                status=status.HTTP_403_FORBIDDEN,
            )

        user.current_active_department = department
        user.save()

        return Response(
            {
                "message": "Active department updated",
                "department": self.get_serializer(department).data,
            }
        )

    @action(detail=False, methods=["get"])
    def current_active(self, request):
        """Get current active department for user"""
        user = request.user
        if user.current_active_department:
            serializer = self.get_serializer(user.current_active_department)
            return Response(serializer.data)

        # If no active department, return first assigned department
        first_dept = user.departments.first()
        if first_dept:
            user.current_active_department = first_dept
            user.save()
            serializer = self.get_serializer(first_dept)
            return Response(serializer.data)

        return Response({"error": "No departments assigned"}, status=404)


class DashboardConfigurationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Dashboard Configuration"""

    serializer_class = DashboardConfigurationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.current_active_department:
            return DashboardConfiguration.objects.filter(department=user.current_active_department)
        return DashboardConfiguration.objects.none()

    @action(detail=False, methods=["get"])
    def current(self, request):
        """Get dashboard configuration for current active department"""
        user = request.user
        if not user.current_active_department:
            return Response({"error": "No active department selected"}, status=404)

        try:
            config = DashboardConfiguration.objects.get(department=user.current_active_department)
            serializer = self.get_serializer(config)
            return Response(serializer.data)
        except DashboardConfiguration.DoesNotExist:
            # Return default configuration
            return Response(
                {
                    "widgets": [{"type": "pending_tasks", "position": 1, "size": "large"}],
                    "layout_type": "GRID",
                }
            )


class DailyGoldRateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Daily Gold Rate Management

    Endpoints:
    - GET /gold-rates/ - List all rates
    - POST /gold-rates/ - Create new rate
    - GET /gold-rates/{id}/ - Get specific rate
    - PATCH /gold-rates/{id}/ - Update rate (admin override)
    - GET /gold-rates/today/ - Get today's rates
    - GET /gold-rates/active/ - Get currently active rate
    - GET /gold-rates/summary/ - Get daily summary
    - POST /gold-rates/check-required/ - Check if rate entry required
    """

    serializer_class = DailyGoldRateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        company = getattr(user, "company", None)

        if not company:
            return DailyGoldRate.objects.none()

        queryset = DailyGoldRate.objects.filter(company=company)

        # Filter by date if provided
        rate_date = self.request.query_params.get("date")
        if rate_date:
            queryset = queryset.filter(rate_date=rate_date)

        # Filter by rate type if provided
        rate_type = self.request.query_params.get("type")
        if rate_type:
            queryset = queryset.filter(rate_type=rate_type)

        return queryset.select_related("entered_by", "last_modified_by")

    def perform_create(self, serializer):
        """Create gold rate with permission check"""
        user = self.request.user

        # Check permission
        if not self.has_gold_rate_permission(user):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("You don't have permission to enter gold rates")

        serializer.save()

    def perform_update(self, serializer):
        """Update gold rate with admin override check"""
        user = self.request.user
        instance = self.get_object()

        # If rate is locked, only admin can update
        if instance.is_locked:
            if not self.is_admin_user(user):
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied(
                    "This rate is locked. Only admin can modify it. "
                    "Please contact Niti Shah for corrections."
                )

        serializer.save()

    def has_gold_rate_permission(self, user):
        """Check if user can enter gold rates"""
        # Superuser or specific users
        if user.is_superuser or user.username in ["niti", "mehul"]:
            return True

        # Check user permission
        return getattr(user, "can_edit_gold_price", False)

    def is_admin_user(self, user):
        """Check if user is admin (can override locked rates)"""
        return user.is_superuser or user.username in ["niti", "mehul"]

    @action(detail=False, methods=["get"])
    def today(self, request):
        """Get all rates for today"""
        from datetime import date

        today = date.today()

        user = request.user
        company = getattr(user, "company", None)

        rates = DailyGoldRate.objects.filter(company=company, rate_date=today).order_by(
            "entered_at"
        )

        serializer = self.get_serializer(rates, many=True)
        return Response({"date": today, "rates": serializer.data, "count": rates.count()})

    @action(detail=False, methods=["get"])
    def active(self, request):
        """Get currently active gold rate"""
        from datetime import date

        today = date.today()

        user = request.user
        company = getattr(user, "company", None)

        # Try to get today's rates
        today_rates = DailyGoldRate.objects.filter(company=company, rate_date=today).order_by(
            "-entered_at"
        )

        if today_rates.exists():
            # Return latest rate (closing if exists, else latest intermediate, else opening)
            closing = today_rates.filter(rate_type="CLOSING").first()
            if closing:
                serializer = self.get_serializer(closing)
                return Response(serializer.data)

            # Return latest intermediate or opening
            latest = today_rates.first()
            serializer = self.get_serializer(latest)
            return Response(serializer.data)

        # No rates today, get previous day's closing rate
        from datetime import timedelta

        yesterday = today - timedelta(days=1)

        previous_closing = DailyGoldRate.objects.filter(
            company=company, rate_date=yesterday, rate_type="CLOSING"
        ).first()

        if previous_closing:
            serializer = self.get_serializer(previous_closing)
            return Response(
                {
                    **serializer.data,
                    "is_previous_day": True,
                    "message": "Using previous day closing rate (no rate entered for today)",
                }
            )

        return Response({"error": "No gold rate available"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Get daily summary with opening, intermediate, and closing rates"""
        from datetime import date

        rate_date = request.query_params.get("date")
        if rate_date:
            try:
                from datetime import datetime

                rate_date = datetime.strptime(rate_date, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            rate_date = date.today()

        user = request.user
        company = getattr(user, "company", None)

        # Get all rates for the date
        rates = DailyGoldRate.objects.filter(company=company, rate_date=rate_date).order_by(
            "entered_at"
        )

        # Separate by type
        opening = rates.filter(rate_type="OPENING").first()
        closing = rates.filter(rate_type="CLOSING").first()
        intermediate = rates.filter(rate_type="INTERMEDIATE").order_by("entered_at")

        # Get current active rate
        if closing:
            current_active = closing
        elif intermediate.exists():
            current_active = intermediate.last()
        elif opening:
            current_active = opening
        else:
            current_active = None

        summary_data = {
            "rate_date": rate_date,
            "has_opening_rate": opening is not None,
            "has_closing_rate": closing is not None,
            "intermediate_count": intermediate.count(),
            "opening_rate": self.get_serializer(opening).data if opening else None,
            "closing_rate": self.get_serializer(closing).data if closing else None,
            "intermediate_rates": self.get_serializer(intermediate, many=True).data,
            "current_active_rate": self.get_serializer(current_active).data
            if current_active
            else None,
        }

        return Response(summary_data)

    @action(detail=False, methods=["get"])
    def check_required(self, request):
        """Check if gold rate entry is required for today"""
        from datetime import date

        today = date.today()

        user = request.user
        company = getattr(user, "company", None)

        # Check if user has permission to enter rates
        can_enter = self.has_gold_rate_permission(user)
        is_admin = self.is_admin_user(user)

        # Check if opening rate exists for today
        opening_exists = DailyGoldRate.objects.filter(
            company=company, rate_date=today, rate_type="OPENING"
        ).exists()

        if not opening_exists:
            return Response(
                {
                    "required": True,
                    "can_skip": is_admin,  # Only Niti can skip
                    "can_enter": can_enter,
                    "reason": "Opening rate not entered for today",
                    "date": today,
                    "message": "Please enter the opening gold rate to continue",
                    "user_role": "admin" if is_admin else "accountant" if can_enter else "user",
                }
            )

        return Response(
            {
                "required": False,
                "can_skip": is_admin,
                "can_enter": can_enter,
                "reason": "Opening rate already entered",
                "date": today,
                "user_role": "admin" if is_admin else "accountant" if can_enter else "user",
            }
        )

    @action(detail=False, methods=["post"])
    def validate_workflow(self, request):
        """
        Validate if user can proceed with workflow based on gold rate status.
        Used to block workflow progression if gold rate not updated.
        """
        from datetime import date

        today = date.today()
        user = request.user
        company = getattr(user, "company", None)

        # Get workflow type from request
        workflow_type = request.data.get(
            "workflow_type"
        )  # e.g., "order_creation", "voucher_submission"
        allow_draft = request.data.get("allow_draft", True)  # Allow saving as draft

        # Check if opening rate exists for today
        opening_exists = DailyGoldRate.objects.filter(
            company=company, rate_date=today, rate_type="OPENING"
        ).exists()

        if not opening_exists:
            # Gold rate not updated
            is_admin = self.is_admin_user(user)

            if allow_draft:
                # Can save as draft but cannot proceed
                return Response(
                    {
                        "can_proceed": False,
                        "can_save_draft": True,
                        "can_skip": is_admin,
                        "reason": "Gold rate not updated for today",
                        "message": "You can save as draft, but cannot submit until gold rate is updated.",
                        "gold_rate_required": True,
                        "date": today,
                    }
                )
            else:
                # Cannot proceed at all
                return Response(
                    {
                        "can_proceed": is_admin,  # Only admin can skip
                        "can_save_draft": False,
                        "can_skip": is_admin,
                        "reason": "Gold rate not updated for today",
                        "message": "Gold rate must be updated before proceeding.",
                        "gold_rate_required": True,
                        "date": today,
                    },
                    status=status.HTTP_403_FORBIDDEN if not is_admin else status.HTTP_200_OK,
                )

        # Gold rate exists, can proceed
        return Response(
            {
                "can_proceed": True,
                "can_save_draft": True,
                "can_skip": False,
                "reason": "Gold rate is up to date",
                "message": "You can proceed with the workflow.",
                "gold_rate_required": False,
                "date": today,
            }
        )

    @action(detail=False, methods=["get"])
    def popup_status(self, request):
        """
        Get popup status for dashboard - determines if popup should be shown.
        Returns user-specific information about gold rate requirement.
        """
        from datetime import date

        today = date.today()
        user = request.user
        company = getattr(user, "company", None)

        # Check user permissions
        can_enter = self.has_gold_rate_permission(user)
        is_admin = self.is_admin_user(user)

        # Check if opening rate exists
        opening_exists = DailyGoldRate.objects.filter(
            company=company, rate_date=today, rate_type="OPENING"
        ).exists()

        # Get today's rates if they exist
        today_rates = None
        if opening_exists:
            rates = DailyGoldRate.objects.filter(company=company, rate_date=today).order_by(
                "entered_at"
            )
            today_rates = self.get_serializer(rates, many=True).data

        return Response(
            {
                "show_popup": not opening_exists
                and can_enter,  # Show popup only if rate missing and user can enter
                "gold_rate_missing": not opening_exists,
                "can_enter_rate": can_enter,
                "can_skip_popup": is_admin,  # Only Niti can skip
                "must_enter": can_enter and not is_admin,  # Accountant cannot skip
                "date": today,
                "today_rates": today_rates,
                "user_info": {
                    "username": user.username,
                    "is_admin": is_admin,
                    "can_enter_gold_rate": can_enter,
                    "role": "admin" if is_admin else "accountant" if can_enter else "user",
                },
            }
        )

    @action(detail=True, methods=["get"])
    def logs(self, request, pk=None):
        """Get change logs for a specific gold rate"""
        gold_rate = self.get_object()

        logs = GoldRateChangeLog.objects.filter(gold_rate=gold_rate).order_by("-changed_at")

        serializer = GoldRateChangeLogSerializer(logs, many=True)
        return Response(
            {
                "gold_rate_id": str(gold_rate.id),
                "rate_date": gold_rate.rate_date,
                "rate_type": gold_rate.rate_type,
                "logs": serializer.data,
                "total_changes": logs.count(),
            }
        )

    @action(detail=False, methods=["get"])
    def history(self, request):
        """Get gold rate history with filters"""
        from datetime import date, timedelta

        user = request.user
        company = getattr(user, "company", None)

        # Get date range from query params
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if not start_date:
            # Default to last 30 days
            start_date = date.today() - timedelta(days=30)
        else:
            from datetime import datetime

            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()

        if not end_date:
            end_date = date.today()
        else:
            from datetime import datetime

            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

        # Get rates in date range
        rates = DailyGoldRate.objects.filter(
            company=company, rate_date__gte=start_date, rate_date__lte=end_date
        ).order_by("-rate_date", "entered_at")

        # Group by date
        from collections import defaultdict

        grouped_rates = defaultdict(list)

        for rate in rates:
            grouped_rates[str(rate.rate_date)].append(self.get_serializer(rate).data)

        return Response(
            {
                "start_date": start_date,
                "end_date": end_date,
                "rates_by_date": dict(grouped_rates),
                "total_entries": rates.count(),
            }
        )


class CountryMasterViewSet(viewsets.ModelViewSet):
    """ViewSet for Country Master"""

    queryset = CountryMaster.objects.all()
    serializer_class = CountryMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CountryMaster.objects.all().order_by("name")


class StateMasterViewSet(viewsets.ModelViewSet):
    """ViewSet for State Master"""

    queryset = StateMaster.objects.all()
    serializer_class = StateMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = StateMaster.objects.select_related("country").order_by("name")
        country_id = self.request.query_params.get("country_id")
        if country_id:
            queryset = queryset.filter(country_id=country_id)
        return queryset


class CityMasterViewSet(viewsets.ModelViewSet):
    """ViewSet for City Master"""

    queryset = CityMaster.objects.all()
    serializer_class = CityMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = CityMaster.objects.select_related("state", "state__country").order_by("name")
        state_id = self.request.query_params.get("state_id")
        if state_id:
            queryset = queryset.filter(state_id=state_id)
        return queryset


# ---------------------------------------------------------------------------
# Raw Material Purchase dropdown master ViewSets
# ---------------------------------------------------------------------------


class GemstoneMasterViewSet(viewsets.ModelViewSet):
    """CRUD for Gemstone types (Ruby, Sapphire, Emerald, etc.)"""

    serializer_class = GemstoneMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return GemstoneMaster.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("name")
        return GemstoneMaster.objects.filter(company__isnull=True).order_by("name")

    def perform_create(self, serializer):
        serializer.save(company=getattr(self.request.user, "company", None))


class GemstoneShapeMasterViewSet(viewsets.ModelViewSet):
    """CRUD for Gemstone shapes"""

    serializer_class = GemstoneShapeMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return GemstoneShapeMaster.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("name")
        return GemstoneShapeMaster.objects.filter(company__isnull=True).order_by("name")

    def perform_create(self, serializer):
        serializer.save(company=getattr(self.request.user, "company", None))


class GemstoneColorMasterViewSet(viewsets.ModelViewSet):
    """CRUD for Gemstone colors"""

    serializer_class = GemstoneColorMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return GemstoneColorMaster.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("name")
        return GemstoneColorMaster.objects.filter(company__isnull=True).order_by("name")

    def perform_create(self, serializer):
        serializer.save(company=getattr(self.request.user, "company", None))


class GemstoneClarityMasterViewSet(viewsets.ModelViewSet):
    """CRUD for Gemstone clarity grades"""

    serializer_class = GemstoneClarityMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return GemstoneClarityMaster.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("name")
        return GemstoneClarityMaster.objects.filter(company__isnull=True).order_by("name")

    def perform_create(self, serializer):
        serializer.save(company=getattr(self.request.user, "company", None))


class GemstoneTreatmentMasterViewSet(viewsets.ModelViewSet):
    """CRUD for Gemstone treatments (None, Heat, Oil, etc.)"""

    serializer_class = GemstoneTreatmentMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return GemstoneTreatmentMaster.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("name")
        return GemstoneTreatmentMaster.objects.filter(company__isnull=True).order_by("name")

    def perform_create(self, serializer):
        serializer.save(company=getattr(self.request.user, "company", None))


class OriginMasterViewSet(viewsets.ModelViewSet):
    """CRUD for Origin master (Natural, CVD, Synthetic, etc.)"""

    serializer_class = OriginMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = OriginMaster.objects.all()
        if hasattr(user, "company") and user.company:
            qs = qs.filter(Q(company=user.company) | Q(company__isnull=True))
        else:
            qs = qs.filter(company__isnull=True)
        material_type = self.request.query_params.get("material_type")
        if material_type:
            qs = qs.filter(Q(material_type=material_type) | Q(material_type="all"))
        return qs.order_by("name")

    def perform_create(self, serializer):
        serializer.save(company=getattr(self.request.user, "company", None))


class CutMasterViewSet(viewsets.ModelViewSet):
    """CRUD for Diamond cut grades (Excellent, Very Good, Good, etc.)"""

    serializer_class = CutMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return CutMaster.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("name")
        return CutMaster.objects.filter(company__isnull=True).order_by("name")

    def perform_create(self, serializer):
        serializer.save(company=getattr(self.request.user, "company", None))


class PolishMasterViewSet(viewsets.ModelViewSet):
    """CRUD for Diamond polish grades"""

    serializer_class = PolishMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return PolishMaster.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("name")
        return PolishMaster.objects.filter(company__isnull=True).order_by("name")

    def perform_create(self, serializer):
        serializer.save(company=getattr(self.request.user, "company", None))


class SymmetryMasterViewSet(viewsets.ModelViewSet):
    """CRUD for Diamond symmetry grades"""

    serializer_class = SymmetryMasterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "company") and user.company:
            return SymmetryMaster.objects.filter(
                Q(company=user.company) | Q(company__isnull=True)
            ).order_by("name")
        return SymmetryMaster.objects.filter(company__isnull=True).order_by("name")

    def perform_create(self, serializer):
        serializer.save(company=getattr(self.request.user, "company", None))
