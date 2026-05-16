from rest_framework import viewsets, permissions, filters, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas as pdf_canvas

from .models import RepairIssue, OrderIssue, Query
from .serializers import RepairIssueSerializer, OrderIssueSerializer, QuerySerializer


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"


class QueryViewSet(viewsets.ModelViewSet):
    queryset = Query.objects.all()
    serializer_class = QuerySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Query.objects.select_related("account", "item_name", "created_by").all()

        # Search filter
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(account__account_name__icontains=search)
                | Q(item_name__name__icontains=search)
                | Q(location__icontains=search)
                | Q(gold_carat__icontains=search)
            )

        # Status filter
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Date filtering
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if date_from and date_to:
            from datetime import datetime
            try:
                date_from_obj = datetime.strptime(date_from, "%Y-%m-%d").date()
                date_to_obj = datetime.strptime(date_to, "%Y-%m-%d").date()
                if date_from_obj > date_to_obj:
                    # Return empty queryset if date range is invalid
                    return queryset.none()
                queryset = queryset.filter(
                    query_in_date__gte=date_from_obj,
                    query_in_date__lte=date_to_obj
                )
            except ValueError:
                pass
        elif date_from:
            from datetime import datetime
            try:
                date_from_obj = datetime.strptime(date_from, "%Y-%m-%d").date()
                queryset = queryset.filter(query_in_date__gte=date_from_obj)
            except ValueError:
                pass
        elif date_to:
            from datetime import datetime
            try:
                date_to_obj = datetime.strptime(date_to, "%Y-%m-%d").date()
                queryset = queryset.filter(query_in_date__lte=date_to_obj)
            except ValueError:
                pass

        return queryset.order_by("-created_at")

    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["post"])
    def auto_archive(self, request):
        """Auto-archive expired queries (batch job endpoint)"""
        archived_count = 0
        expired_queries = Query.objects.filter(
            status="pending", expiry_date__lt=timezone.now().date()
        )

        for query in expired_queries:
            if query.auto_archive_if_expired():
                archived_count += 1

        return Response(
            {"message": f"{archived_count} queries auto-archived"},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        """Manually archive a query"""
        query = self.get_object()

        if query.status != "pending":
            return Response(
                {"error": f"Cannot archive query with status: {query.status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        query.status = "archived"
        query.save(update_fields=["status"])

        serializer = self.get_serializer(query)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def reopen(self, request, pk=None):
        """Reopen an archived query (reactivate)"""
        query = self.get_object()

        if query.status != "archived":
            return Response(
                {"error": f"Cannot reopen query with status: {query.status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        query.status = "pending"
        query.save(update_fields=["status"])

        serializer = self.get_serializer(query)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def convert_to_order(self, request, pk=None):
        """Mark query as converted to order - actual order creation happens through order form"""
        query = self.get_object()

        if query.status == "converted_to_order":
            return Response(
                {
                    "message": "Query already converted to order",
                    "query_id": str(query.id),
                    "order_id": request.data.get("order_id"),
                    "status": query.status,
                    "already_converted": True,
                },
                status=status.HTTP_200_OK,
            )

        if query.status != "pending":
            return Response(
                {"error": f"Cannot convert query with status: {query.status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get order_id from request if provided (order already created by form)
        order_id = request.data.get("order_id")

        # Update query status to converted
        query.status = "converted_to_order"
        query.save(update_fields=["status"])

        return Response(
            {
                "message": "Query converted to order successfully",
                "query_id": str(query.id),
                "order_id": order_id,
                "status": query.status,
            },
            status=status.HTTP_201_CREATED,
        )


class OrderIssueViewSet(viewsets.ModelViewSet):
    queryset = OrderIssue.objects.all()
    serializer_class = OrderIssueSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = OrderIssue.objects.select_related(
            "order", "account", "item_name", "created_by"
        ).all()

        # Search filter
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(order__bill_no__icontains=search)
                | Q(account__account_name__icontains=search)
                | Q(item_name__name__icontains=search)
                | Q(order_ref__icontains=search)
            )

        # Status filter
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by("-created_at")

    def create(self, request, *args, **kwargs):
        try:
            order_id = request.data.get("order_id")
            account_id = request.data.get("account")
            item_name_id = request.data.get("item_name")

            # Extract manufacturing fields from request
            metal = request.data.get("metal")
            total_size = request.data.get("total_size")
            base_metal_colour = request.data.get("base_metal_colour")
            rhodium_instructions = request.data.get("rhodium_instructions")
            prong_style = request.data.get("prong_style")
            locking_system = request.data.get("locking_system")
            final_finish = request.data.get("final_finish")
            additional_notes = request.data.get("additional_notes")

            order = None
            account = None
            item_name = None

            # If order_id is provided, get the order and use its data
            if order_id:
                from vouchers.models import Order

                try:
                    order = Order.objects.get(id=order_id)
                    account = order.account
                    item_name = order.item_name_fk
                except Order.DoesNotExist:
                    return Response(
                        {"error": f"Order with id {order_id} not found"},
                        status=status.HTTP_404_NOT_FOUND,
                    )
            else:
                # Standalone order issue - get account and item_name from request
                if not account_id:
                    return Response(
                        {"error": "account is required when order_id is not provided"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if not item_name_id:
                    return Response(
                        {"error": "item_name is required when order_id is not provided"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                from accounts.models import Account
                from core.models import ItemNameMaster

                try:
                    account = Account.objects.get(id=account_id)
                except Account.DoesNotExist:
                    return Response(
                        {"error": f"Account with id {account_id} not found"},
                        status=status.HTTP_404_NOT_FOUND,
                    )

                try:
                    item_name = ItemNameMaster.objects.get(id=item_name_id)
                except ItemNameMaster.DoesNotExist:
                    return Response(
                        {"error": f"Item name with id {item_name_id} not found"},
                        status=status.HTTP_404_NOT_FOUND,
                    )

            # Create order issue with denormalized data and manufacturing specs
            order_issue = OrderIssue.objects.create(
                order=order,
                account=account,
                item_name=item_name,
                metal=metal,
                total_size=total_size,
                base_metal_colour=base_metal_colour,
                rhodium_instructions=rhodium_instructions,
                prong_style=prong_style,
                locking_system=locking_system,
                final_finish=final_finish,
                additional_notes=additional_notes,
                created_by=request.user if request.user.is_authenticated else None,
            )

            serializer = self.get_serializer(order_issue)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback

            traceback.print_exc()
            return Response(
                {"error": str(e), "detail": "Internal server error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["get"])
    def export(self, request, pk=None):
        """Export order issue to PDF"""
        order_issue = self.get_object()

        # Create PDF
        buffer = BytesIO()
        pdf = pdf_canvas.Canvas(buffer, pagesize=letter)

        # Title
        pdf.setFont("Helvetica-Bold", 16)
        pdf.drawString(50, 750, "Order Issue Report")

        # Draw details
        y = 720
        pdf.setFont("Helvetica", 11)

        details = [
            ("Issue ID", str(order_issue.id)),
            ("Bill No", order_issue.order.bill_no if order_issue.order else "N/A"),
            ("Account", order_issue.account.account_name if order_issue.account else "N/A"),
            ("Item", order_issue.item_name.name if order_issue.item_name else "N/A"),
            ("Order Ref", order_issue.order_ref or "N/A"),
            ("Status", order_issue.get_status_display()),
            ("Description", order_issue.description or "N/A"),
            ("Created", order_issue.created_at.strftime("%Y-%m-%d %H:%M:%S")),
            ("Updated", order_issue.updated_at.strftime("%Y-%m-%d %H:%M:%S")),
        ]

        for label, value in details:
            pdf.drawString(50, y, f"{label}:")
            pdf.drawString(200, y, str(value))
            y -= 20

        pdf.save()
        buffer.seek(0)

        response = HttpResponse(buffer, content_type="application/pdf")
        filename = (
            f"order-issue-{order_issue.order.bill_no}.pdf"
            if order_issue.order
            else "order-issue.pdf"
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class RepairIssueViewSet(viewsets.ModelViewSet):
    serializer_class = RepairIssueSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["tag_no", "remark"]
    ordering_fields = ["created_at", "rate", "total"]

    def get_queryset(self):
        qs = (
            RepairIssue.objects.select_related(
                "company", "account", "item_name", "stamp", "created_by"
            )
            .all()
            .order_by("-created_at")
        )
        user = getattr(self.request, "user", None)
        if user and getattr(user, "company_id", None):
            qs = qs.filter(company_id=user.company_id)
        else:
            qs = qs.none()

        # Date filtering
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if date_from and date_to:
            from datetime import datetime
            try:
                date_from_obj = datetime.strptime(date_from, "%Y-%m-%d").date()
                date_to_obj = datetime.strptime(date_to, "%Y-%m-%d").date()
                if date_from_obj > date_to_obj:
                    # Return empty queryset if date range is invalid
                    return qs.none()
                qs = qs.filter(created_at__date__gte=date_from_obj, created_at__date__lte=date_to_obj)
            except ValueError:
                pass
        elif date_from:
            from datetime import datetime
            try:
                date_from_obj = datetime.strptime(date_from, "%Y-%m-%d").date()
                qs = qs.filter(created_at__date__gte=date_from_obj)
            except ValueError:
                pass
        elif date_to:
            from datetime import datetime
            try:
                date_to_obj = datetime.strptime(date_to, "%Y-%m-%d").date()
                qs = qs.filter(created_at__date__lte=date_to_obj)
            except ValueError:
                pass

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        company = getattr(user, "company", None)
        if company is None:
            raise serializers.ValidationError({"company": ["User does not belong to a company"]})
        serializer.save(company=company, created_by=user)

    def perform_update(self, serializer):
        user = self.request.user
        serializer.save(updated_by=user)
