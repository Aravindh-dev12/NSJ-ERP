# from rest_framework import viewsets, permissions, status
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from rest_framework.pagination import PageNumberPagination
# from django.db.models import Q
# from django.http import JsonResponse
# from django.utils import timezone
# from .models import SalesQuery
# from .serializers import SalesQuerySerializer, SalesQueryListSerializer, DashboardStatsSerializer
# from vouchers.models import EstimateVoucher
# from vouchers.serializers import EstimateVoucherSerializer


# class StandardResultsSetPagination(PageNumberPagination):
#     page_size = 10
#     page_size_query_param = 'page_size'
#     max_page_size = 100


# class SalesQueryViewSet(viewsets.ModelViewSet):
#     queryset = SalesQuery.objects.all()
#     serializer_class = SalesQuerySerializer
#     permission_classes = [permissions.IsAuthenticated]
#     pagination_class = StandardResultsSetPagination

#     def get_permissions(self):
#         """
#         Instantiates and returns the list of permissions that this view requires.
#         """
#         return [permission() for permission in self.permission_classes]

#     def get_queryset(self):
#         queryset = SalesQuery.objects.select_related(
#             "account", "created_by"
#         ).all()

#         # Search filter
#         search = self.request.query_params.get('search')
#         if search:
#             queryset = queryset.filter(
#                 Q(account__account_name__icontains=search) |
#                 Q(jewellery_type__icontains=search) |
#                 Q(sales_person__icontains=search) |
#                 Q(phone_number__icontains=search) |
#                 Q(email__icontains=search)
#             )

#         # Status filter - we'll add a status field to the model if needed
#         status_filter = self.request.query_params.get('status')
#         if status_filter:
#             # Since we don't have a status field, we'll filter by other criteria
#             # For now, we'll just return all results if status is specified
#             pass

#         # Date range filters
#         date_from = self.request.query_params.get('date_from')
#         date_to = self.request.query_params.get('date_to')
#         if date_from:
#             from datetime import datetime
#             try:
#                 date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
#                 queryset = queryset.filter(order_date__gte=date_from_obj)
#             except ValueError:
#                 pass
#         if date_to:
#             from datetime import datetime
#             try:
#                 date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
#                 queryset = queryset.filter(order_date__lte=date_to_obj)
#             except ValueError:
#                 pass

#         return queryset.order_by('-created_at')

#     def perform_create(self, serializer):
#         """Set created_by to current user"""
#         user = getattr(self.request, 'user', None)
#         if user and hasattr(user, 'is_authenticated') and user.is_authenticated:
#             serializer.save(created_by=user)
#         else:
#             serializer.save()  # Save without created_by if user is not authenticated

#     def create(self, request, *args, **kwargs):
#         """Override create to handle extra database fields"""
#         serializer = self.get_serializer(data=request.data)
#         serializer.is_valid(raise_exception=True)

#         # Use raw SQL to handle the extra database fields
#         from django.db import connection
#         import uuid
#         import json

#         user = request.user
#         query_id = str(uuid.uuid4()).replace('-', '')

#         # Prepare the data for insertion
#         data = serializer.validated_data.copy()

#         # Handle JSON fields
#         json_fields = ['occasion', 'purpose', 'style_preference', 'metal_preference',
#                       'diamond_priority', 'urgency_level', 'reference_source',
#                       'advance_handling', 'department_instructions', 'design_delivery', 'ledger_entries']

#         for field in json_fields:
#             if field in data:
#                 data[field] = json.dumps(data[field])
#             else:
#                 data[field] = '[]' if field not in ['advance_handling', 'department_instructions', 'design_delivery'] else '{}'

#         # Set required fields for regular sales lead creation
#         data['estimate_calculated'] = False  # No estimate integration
#         data['estimate_id'] = None
#         data['status'] = 'active'

#         with connection.cursor() as cursor:
#             cursor.execute("""
#                 INSERT INTO sales_queries
#                 (id, order_date, sales_person, vendor, account_id, sub_account, phone_number, email, city,
#                  client_delivery_type, pan_gstin, occasion, required_delivery_date, stock_in_deadline, purpose,
#                  jewellery_type, size_details, fit_details, follow_up_log, style_preference, metal_preference,
#                  diamond_shape, color_clarity, origin, diamond_budget, diamond_priority, sample_details,
#                  gemstone_preference, gemstone_color_clarity, gemstone_origin, other_details, budget_range,
#                  urgency_level, reference_source, must_have, must_avoid, special_instructions,
#                  advance_handling, department_instructions, design_delivery, ledger_entries,
#                  created_at, updated_at, created_by_id, status, estimate_calculated, estimate_id)
#                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
#             """, [
#                 query_id,
#                 data.get('order_date'),
#                 data.get('sales_person', ''),
#                 data.get('vendor'),
#                 str(data['account'].id).replace('-', '') if data.get('account') else None,
#                 data.get('sub_account'),
#                 data.get('phone_number'),
#                 data.get('email'),
#                 data.get('city'),
#                 data.get('client_delivery_type'),
#                 data.get('pan_gstin'),
#                 data.get('occasion', '[]'),
#                 data.get('required_delivery_date'),
#                 data.get('stock_in_deadline'),
#                 data.get('purpose', '[]'),
#                 data.get('jewellery_type', ''),
#                 data.get('size_details'),
#                 data.get('fit_details'),
#                 data.get('follow_up_log'),
#                 data.get('style_preference', '[]'),
#                 data.get('metal_preference', '[]'),
#                 data.get('diamond_shape'),
#                 data.get('color_clarity'),
#                 data.get('origin'),
#                 data.get('diamond_budget'),
#                 data.get('diamond_priority', '[]'),
#                 data.get('sample_details'),
#                 data.get('gemstone_preference'),
#                 data.get('gemstone_color_clarity'),
#                 data.get('gemstone_origin'),
#                 data.get('other_details'),
#                 data.get('budget_range'),
#                 data.get('urgency_level', '[]'),
#                 data.get('reference_source', '[]'),
#                 data.get('must_have'),
#                 data.get('must_avoid'),
#                 data.get('special_instructions'),
#                 data.get('advance_handling', '{}'),
#                 data.get('department_instructions', '{}'),
#                 data.get('design_delivery', '{}'),
#                 data.get('ledger_entries', '[]'),
#                 timezone.now(),
#                 timezone.now(),
#                 str(user.id).replace('-', '') if user and user.is_authenticated else None,
#                 'active',
#                 False,  # No estimate integration
#                 None    # No estimate reference
#             ])

#         # Get the created sales lead
#         instance = SalesQuery.objects.get(id=query_id)
#         serializer = self.get_serializer(instance)
#         headers = self.get_success_headers(serializer.data)
#         return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

#     def perform_update(self, serializer):
#         """Set updated_by to current user"""
#         user = getattr(self.request, 'user', None)
#         if user and hasattr(user, 'is_authenticated') and user.is_authenticated:
#             serializer.save()
#         else:
#             serializer.save()

#     @action(detail=False, methods=['get'])
#     def dashboard_stats(self, request):
#         """Get dashboard statistics for sales queries"""
#         total_queries = self.queryset.count()

#         # For now, we'll calculate basic stats
#         # In the future, we might add a status field to categorize queries
#         active_queries = total_queries  # All queries are considered active for now
#         pending_queries = total_queries  # All queries are considered pending for now
#         completed_queries = 0  # No completed queries by default

#         stats_data = {
#             'total_queries': total_queries,
#             'active_queries': active_queries,
#             'pending_queries': pending_queries,
#             'completed_queries': completed_queries
#         }

#         serializer = DashboardStatsSerializer(stats_data)
#         return Response(serializer.data)

#     @action(detail=False, methods=['post'])
#     def create_estimate(self, request):
#         """Create a new sales lead with estimate data from existing estimates"""
#         try:
#             # Get the jewellery_type from request data
#             jewellery_type = request.data.get('jewellery_type')
#             if not jewellery_type:
#                 return Response(
#                     {'error': 'jewellery_type is required'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             # Get user's company
#             user = request.user
#             company = getattr(user, 'company', None)
#             if not company:
#                 return Response(
#                     {'error': 'User does not belong to a company'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             # Find estimates with matching item_name (jewellery_type)
#             estimates = EstimateVoucher.objects.filter(
#                 company=company,
#                 item_name__icontains=jewellery_type
#             ).order_by('-created_at')

#             if not estimates.exists():
#                 return Response(
#                     {'error': f'No estimates found for jewellery type: {jewellery_type}'},
#                     status=status.HTTP_404_NOT_FOUND
#                 )

#             # Get the most recent estimate
#             latest_estimate = estimates.first()
#             estimate_data = EstimateVoucherSerializer(latest_estimate).data

#             # Prepare sales lead data with estimate information
#             sales_query_data = request.data.copy()

#             # Fill jewellery_type with the estimate item name
#             sales_query_data['jewellery_type'] = latest_estimate.item_name

#             # Add estimate information to special_instructions or other_details
#             estimate_info = f"Estimate Reference: {latest_estimate.id}\n"
#             estimate_info += f"Grand Total: ₹{latest_estimate.grand_total}\n"
#             estimate_info += f"GST Amount: ₹{latest_estimate.gst_amount}\n"
#             estimate_info += f"Taxable Value: ₹{latest_estimate.total_taxable_value}\n"

#             # Add line items summary
#             if latest_estimate.line_items.exists():
#                 estimate_info += "\nLine Items:\n"
#                 for item in latest_estimate.line_items.all():
#                     estimate_info += f"- {item.particulars}: ₹{item.amount}\n"

#             # Append to existing special_instructions or create new
#             existing_instructions = sales_query_data.get('special_instructions', '')
#             if existing_instructions:
#                 sales_query_data['special_instructions'] = f"{existing_instructions}\n\n{estimate_info}"
#             else:
#                 sales_query_data['special_instructions'] = estimate_info

#             # Create new sales lead (never overwrite existing)
#             serializer = SalesQuerySerializer(data=sales_query_data)
#             if serializer.is_valid():
#                 # Use raw SQL to handle the extra database fields
#                 from django.db import connection
#                 import uuid

#                 query_id = str(uuid.uuid4()).replace('-', '')

#                 # Prepare the data for insertion
#                 insert_data = sales_query_data.copy()

#                 # Handle JSON fields
#                 json_fields = ['occasion', 'purpose', 'style_preference', 'metal_preference',
#                               'diamond_priority', 'urgency_level', 'reference_source',
#                               'advance_handling', 'department_instructions', 'design_delivery', 'ledger_entries']

#                 for field in json_fields:
#                     if field in insert_data:
#                         import json
#                         insert_data[field] = json.dumps(insert_data[field])
#                     else:
#                         insert_data[field] = '[]' if field.endswith(('_entries', '_handling', '_instructions', '_delivery')) else '[]'

#                 # Set required fields
#                 insert_data['estimate_calculated'] = True
#                 insert_data['estimate_id'] = str(latest_estimate.id).replace('-', '')
#                 insert_data['status'] = 'active'

#                 with connection.cursor() as cursor:
#                     cursor.execute("""
#                         INSERT INTO sales_queries
#                         (id, order_date, sales_person, vendor, account_id, sub_account, phone_number, email, city,
#                          client_delivery_type, pan_gstin, occasion, required_delivery_date, stock_in_deadline, purpose,
#                          jewellery_type, size_details, fit_details, follow_up_log, style_preference, metal_preference,
#                          diamond_shape, color_clarity, origin, diamond_budget, diamond_priority, sample_details,
#                          gemstone_preference, gemstone_color_clarity, gemstone_origin, other_details, budget_range,
#                          urgency_level, reference_source, must_have, must_avoid, special_instructions,
#                          advance_handling, department_instructions, design_delivery, ledger_entries,
#                          created_at, updated_at, created_by_id, status, estimate_calculated, estimate_id)
#                         VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
#                     """, [
#                         query_id,
#                         insert_data.get('order_date'),
#                         insert_data.get('sales_person', ''),
#                         insert_data.get('vendor'),
#                         str(insert_data['account_id']).replace('-', ''),
#                         insert_data.get('sub_account'),
#                         insert_data.get('phone_number'),
#                         insert_data.get('email'),
#                         insert_data.get('city'),
#                         insert_data.get('client_delivery_type'),
#                         insert_data.get('pan_gstin'),
#                         insert_data.get('occasion', '[]'),
#                         insert_data.get('required_delivery_date'),
#                         insert_data.get('stock_in_deadline'),
#                         insert_data.get('purpose', '[]'),
#                         insert_data.get('jewellery_type', ''),
#                         insert_data.get('size_details'),
#                         insert_data.get('fit_details'),
#                         insert_data.get('follow_up_log'),
#                         insert_data.get('style_preference', '[]'),
#                         insert_data.get('metal_preference', '[]'),
#                         insert_data.get('diamond_shape'),
#                         insert_data.get('color_clarity'),
#                         insert_data.get('origin'),
#                         insert_data.get('diamond_budget'),
#                         insert_data.get('diamond_priority', '[]'),
#                         insert_data.get('sample_details'),
#                         insert_data.get('gemstone_preference'),
#                         insert_data.get('gemstone_color_clarity'),
#                         insert_data.get('gemstone_origin'),
#                         insert_data.get('other_details'),
#                         insert_data.get('budget_range'),
#                         insert_data.get('urgency_level', '[]'),
#                         insert_data.get('reference_source', '[]'),
#                         insert_data.get('must_have'),
#                         insert_data.get('must_avoid'),
#                         insert_data.get('special_instructions'),
#                         insert_data.get('advance_handling', '{}'),
#                         insert_data.get('department_instructions', '{}'),
#                         insert_data.get('design_delivery', '{}'),
#                         insert_data.get('ledger_entries', '[]'),
#                         timezone.now(),
#                         timezone.now(),
#                         str(user.id).replace('-', '') if user else None,
#                         'active',
#                         True,
#                         str(latest_estimate.id).replace('-', '')
#                     ])

#                 # Get the created sales lead
#                 sales_query = SalesQuery.objects.get(id=query_id)

#                 # Return both the sales query and estimate data
#                 response_data = {
#                     'sales_query': SalesQuerySerializer(sales_query).data,
#                     'estimate_data': estimate_data,
#                     'message': f'Sales lead created with estimate data from {latest_estimate.item_name}'
#                 }

#                 return Response(response_data, status=status.HTTP_201_CREATED)
#             else:
#                 return Response(
#                     {'errors': serializer.errors},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#         except Exception as e:
#             return Response(
#                 {'error': f'An error occurred: {str(e)}'},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )

#     @action(detail=False, methods=['get'])
#     def available_estimates(self, request):
#         """Get available estimates for dropdown selection"""
#         try:
#             user = request.user
#             company = getattr(user, 'company', None)
#             if not company:
#                 return Response(
#                     {'error': 'User does not belong to a company'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             # Get unique item names from estimates
#             estimates = EstimateVoucher.objects.filter(
#                 company=company
#             ).values('item_name').distinct().order_by('item_name')

#             estimate_options = [
#                 {
#                     'value': estimate['item_name'],
#                     'label': estimate['item_name']
#                 }
#                 for estimate in estimates
#             ]

#             return Response({
#                 'estimate_options': estimate_options,
#                 'count': len(estimate_options)
#             })

#         except Exception as e:
#             return Response(
#                 {'error': f'An error occurred: {str(e)}'},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )

#     def list(self, request, *args, **kwargs):
#         """Override list to support both regular list and lightweight list view"""
#         # Check if lightweight query parameter is set
#         lightweight = request.query_params.get('light', 'false').lower() == 'true'

#         queryset = self.filter_queryset(self.get_queryset())

#         page = self.paginate_queryset(queryset)
#         if page is not None:
#             if lightweight:
#                 # Use a lightweight serializer for the list view
#                 serializer = SalesQueryListSerializer(page, many=True, context={'request': request})
#             else:
#                 # Use full serializer
#                 serializer = SalesQuerySerializer(page, many=True, context={'request': request})
#             return self.get_paginated_response(serializer.data)

#         if lightweight:
#             serializer = SalesQueryListSerializer(queryset, many=True, context={'request': request})
#         else:
#             serializer = SalesQuerySerializer(queryset, many=True, context={'request': request})
#         return Response(serializer.data)


# Django imports
from datetime import datetime, timedelta
import json
import logging
import uuid

# Django core imports
from django.db import connection, transaction
from django.db.models import Q
from django.utils import timezone

# Django REST Framework imports
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

# Local app imports
from .models import (
    SalesQuery,
    ProcessOrder,
    ProcessTask,
    DEFAULT_PROCESS_TASKS,
)
from .serializers import (
    SalesQuerySerializer,
    SalesQueryListSerializer,
    DashboardStatsSerializer,
    EstimateSelectionSerializer,
    EstimateVariationSerializer,
    SaleConversionSerializer,
    ProcessOrderSerializer,
    ProcessOrderCreateSerializer,
    ProcessTaskSerializer,
)

# Vouchers app imports
from vouchers.models import (
    EstimateVoucher,
    Order,
    OrderDraft,
    Sale,
    Receipt,
    DEFAULT_ORDER_PROCESS_STEPS,
)
from vouchers.serializers import EstimateVoucherSerializer

# Logger setup
logger = logging.getLogger(__name__)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class SalesQueryViewSet(viewsets.ModelViewSet):
    queryset = SalesQuery.objects.all()
    serializer_class = SalesQuerySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        queryset = SalesQuery.objects.select_related("account", "created_by").filter(
            is_deleted=False
        )

        # Search filter
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(account__account_name__icontains=search)
                | Q(jewellery_type__icontains=search)
                | Q(sales_person__icontains=search)
                | Q(phone_number__icontains=search)
                | Q(email__icontains=search)
            )

        # Status filter - we'll add a status field to the model if needed
        status_filter = self.request.query_params.get("status")
        if status_filter:
            # Since we don't have a status field, we'll filter by other criteria
            # For now, we'll just return all results if status is specified
            pass

        # Date range filters
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if date_from and date_to:
            if date_from > date_to:
                return Response({"detail": "From date cannot be after To date"}, status=400)
            try:
                date_from_obj = datetime.strptime(date_from, "%Y-%m-%d").date()
                date_to_obj = datetime.strptime(date_to, "%Y-%m-%d").date()
                queryset = queryset.filter(order_date__gte=date_from_obj, order_date__lte=date_to_obj)
            except ValueError:
                pass
        elif date_from:
            try:
                date_from_obj = datetime.strptime(date_from, "%Y-%m-%d").date()
                queryset = queryset.filter(order_date__gte=date_from_obj)
            except ValueError:
                pass
        elif date_to:
            try:
                date_to_obj = datetime.strptime(date_to, "%Y-%m-%d").date()
                queryset = queryset.filter(order_date__lte=date_to_obj)
            except ValueError:
                pass

        return queryset.order_by("-created_at")

    def perform_create(self, serializer):
        """Set created_by to current user and ensure workflow_status has default"""
        user = getattr(self.request, "user", None)
        if user and hasattr(user, "is_authenticated") and user.is_authenticated:
            serializer.save(created_by=user, workflow_status="inquiry_received")
        else:
            serializer.save(workflow_status="inquiry_received")

    def create(self, request, *args, **kwargs):
        """Override create to handle extra database fields"""
        # Log the incoming data for debugging
        logger.info(f"Creating SalesQuery with data: {request.data}")

        serializer = self.get_serializer(data=request.data)

        # Validate and log any errors
        if not serializer.is_valid():
            logger.error(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Call perform_create to set created_by and workflow_status
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_update(self, serializer):
        """Set updated_by to current user"""
        user = getattr(self.request, "user", None)
        if user and hasattr(user, "is_authenticated") and user.is_authenticated:
            serializer.save()
        else:
            serializer.save()

    def perform_destroy(self, instance):
        """Soft delete - mark as deleted instead of actually deleting"""
        instance.is_deleted = True
        instance.save()

    def update(self, request, *args, **kwargs):
        """Override update to handle extra database fields"""
        instance = self.get_object()

        # Get the validated data from the serializer
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        # Extract special fields that need special handling
        account_data = validated_data.pop("account", None)

        # Update the instance with validated data
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Handle account assignment separately
        if account_data:
            instance.account = account_data

        # Set updated_at timestamp
        instance.updated_at = timezone.now()

        # Save the instance
        instance.save()

        # Return the updated instance
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        """Override partial_update to handle extra database fields"""
        instance = self.get_object()

        # Get the validated data from the serializer
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        # Update the instance with validated data
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Set updated_at timestamp
        instance.updated_at = timezone.now()

        # Save the instance
        instance.save()

        # Return the updated instance
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def dashboard_stats(self, request):
        """Get dashboard statistics for sales queries (excluding deleted)"""
        # Use get_queryset() which already filters out deleted queries
        queryset = self.get_queryset()
        total_queries = queryset.count()

        # Calculate stats based on workflow_status
        active_queries = queryset.filter(
            workflow_status__in=[
                "inquiry_received",
                "estimates_pending",
                "estimates_ready",
                "estimate_selected",
            ]
        ).count()

        # Estimates pending
        estimates_pending = queryset.filter(
            workflow_status__in=["inquiry_received", "estimates_pending"]
        ).count()

        # Queries converted to sales
        queries_converted = queryset.filter(workflow_status="converted_to_sale").count()

        # Calculate average response time (time from created to first estimate)
        # This is a simplified calculation - you may want to track this more precisely
        queries_with_estimates = queryset.filter(
            workflow_status__in=["estimates_ready", "estimate_selected", "converted_to_sale"]
        )

        total_response_time = 0
        count_with_response = 0
        for query in queries_with_estimates:
            if query.created_at:
                # Simplified: assume response time is 24 hours on average
                # In production, you'd track when first estimate was created
                total_response_time += 24
                count_with_response += 1

        avg_response_time_hours = (
            total_response_time / count_with_response if count_with_response > 0 else 0
        )

        # Pending follow-ups (queries that need follow-up)
        # Assuming queries in certain statuses need follow-up
        pending_followups = queryset.filter(
            workflow_status__in=["inquiry_received", "estimates_ready", "estimate_selected"]
        ).count()

        stats_data = {
            "total_queries": total_queries,
            "active_queries": active_queries,
            "estimates_pending": estimates_pending,
            "queries_converted": queries_converted,
            "avg_response_time_hours": round(avg_response_time_hours, 1),
            "pending_followups": pending_followups,
        }

        serializer = DashboardStatsSerializer(stats_data)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def create_estimate(self, request):
        """Create a new sales query with estimate data from existing estimates"""
        try:
            # Get the jewellery_type from request data
            jewellery_type = request.data.get("jewellery_type")
            if not jewellery_type:
                return Response(
                    {"error": "jewellery_type is required"}, status=status.HTTP_400_BAD_REQUEST
                )

            # Get user's company
            user = request.user
            company = getattr(user, "company", None)
            if not company:
                return Response(
                    {"error": "User does not belong to a company"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Find estimates with matching item_name (jewellery_type)
            # Use exact word matching to avoid "Ring" matching "Earring"
            all_estimates = EstimateVoucher.objects.filter(company=company).order_by("-created_at")

            # Filter by exact jewelry type match (case-insensitive)
            jewelry_type_lower = jewellery_type.lower()
            estimates = []
            for estimate in all_estimates:
                if estimate.item_name:
                    # Check if the jewelry type matches as a whole word
                    item_name_lower = estimate.item_name.lower()
                    # Split by common separators and check if jewelry type is one of the words
                    item_words = item_name_lower.replace("-", " ").replace("_", " ").split()
                    if (
                        jewelry_type_lower in item_words
                        or item_name_lower.startswith(jewelry_type_lower + " ")
                        or item_name_lower == jewelry_type_lower
                    ):
                        estimates.append(estimate)

            if not estimates:
                return Response(
                    {"error": f"No estimates found for jewellery type: {jewellery_type}"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Get the most recent estimate
            latest_estimate = estimates[0]
            estimate_data = EstimateVoucherSerializer(latest_estimate).data

            # Prepare sales lead data with estimate information
            sales_query_data = request.data.copy()

            # Fill jewellery_type with the estimate item name
            sales_query_data["jewellery_type"] = latest_estimate.item_name

            # Add estimate information to special_instructions or other_details
            estimate_info = f"Estimate Reference: {latest_estimate.id}\n"
            estimate_info += f"Grand Total: ₹{latest_estimate.grand_total}\n"
            estimate_info += f"GST Amount: ₹{latest_estimate.gst_amount}\n"
            estimate_info += f"Taxable Value: ₹{latest_estimate.total_taxable_value}\n"

            # Add line items summary
            if latest_estimate.line_items.exists():
                estimate_info += "\nLine Items:\n"
                for item in latest_estimate.line_items.all():
                    estimate_info += f"- {item.particulars}: ₹{item.amount}\n"

            # Append to existing special_instructions or create new
            existing_instructions = sales_query_data.get("special_instructions", "")
            if existing_instructions:
                sales_query_data["special_instructions"] = (
                    f"{existing_instructions}\n\n{estimate_info}"
                )
            else:
                sales_query_data["special_instructions"] = estimate_info

            # Create new sales query (never overwrite existing)
            serializer = SalesQuerySerializer(data=sales_query_data)
            if serializer.is_valid():
                # Use raw SQL to handle the extra database fields
                query_id = str(uuid.uuid4()).replace("-", "")

                # Prepare the data for insertion
                insert_data = sales_query_data.copy()

                # Handle JSON fields
                json_fields = [
                    "occasion",
                    "purpose",
                    "style_preference",
                    "metal_preference",
                    "diamond_priority",
                    "urgency_level",
                    "reference_source",
                    "advance_handling",
                    "department_instructions",
                    "design_delivery",
                    "ledger_entries",
                    "follow_up_logs",
                ]

                for field in json_fields:
                    if field in insert_data:
                        insert_data[field] = json.dumps(insert_data[field])
                    else:
                        insert_data[field] = (
                            "[]"
                            if field.endswith(
                                ("_entries", "_handling", "_instructions", "_delivery")
                            )
                            else "[]"
                        )

                # Set required fields
                insert_data["estimate_calculated"] = True
                insert_data["estimate_id"] = str(latest_estimate.id).replace("-", "")
                insert_data["status"] = "active"

                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        INSERT INTO sales_queries 
                        (id, order_date, sales_person, vendor, account_id, sub_account, phone_number, email, city,
                         client_delivery_type, pan_gstin, occasion, required_delivery_date, stock_in_deadline, purpose,
                         jewellery_type, size_details, fit_details, follow_up_log, style_preference, metal_preference,
                         diamond_shape, color_clarity, origin, diamond_budget, diamond_priority, sample_details,
                         gemstone_preference, gemstone_color_clarity, gemstone_origin, other_details, budget_range,
                         urgency_level, reference_source, must_have, must_avoid, special_instructions,
                         advance_handling, department_instructions, design_delivery, ledger_entries,
                         created_at, updated_at, created_by_id, status, estimate_calculated, estimate_id, is_deleted)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                        [
                            query_id,
                            insert_data.get("order_date"),
                            insert_data.get("sales_person", ""),
                            insert_data.get("vendor"),
                            str(insert_data["account_id"]).replace("-", ""),
                            insert_data.get("sub_account"),
                            insert_data.get("phone_number"),
                            insert_data.get("email"),
                            insert_data.get("city"),
                            insert_data.get("client_delivery_type"),
                            insert_data.get("pan_gstin"),
                            insert_data.get("occasion", "[]"),
                            insert_data.get("required_delivery_date"),
                            insert_data.get("stock_in_deadline"),
                            insert_data.get("purpose", "[]"),
                            insert_data.get("jewellery_type", ""),
                            insert_data.get("size_details"),
                            insert_data.get("fit_details"),
                            insert_data.get("follow_up_log"),
                            insert_data.get("style_preference", "[]"),
                            insert_data.get("metal_preference", "[]"),
                            insert_data.get("diamond_shape"),
                            insert_data.get("color_clarity"),
                            insert_data.get("origin"),
                            insert_data.get("diamond_budget"),
                            insert_data.get("diamond_priority", "[]"),
                            insert_data.get("sample_details"),
                            insert_data.get("gemstone_preference"),
                            insert_data.get("gemstone_color_clarity"),
                            insert_data.get("gemstone_origin"),
                            insert_data.get("other_details"),
                            insert_data.get("budget_range"),
                            insert_data.get("urgency_level", "[]"),
                            insert_data.get("reference_source", "[]"),
                            insert_data.get("must_have"),
                            insert_data.get("must_avoid"),
                            insert_data.get("special_instructions"),
                            insert_data.get("advance_handling", "{}"),
                            insert_data.get("department_instructions", "{}"),
                            insert_data.get("design_delivery", "{}"),
                            insert_data.get("ledger_entries", "[]"),
                            timezone.now(),
                            timezone.now(),
                            str(user.id).replace("-", "") if user else None,
                            "active",
                            True,
                            str(latest_estimate.id).replace("-", ""),
                            False,  # is_deleted = False
                        ],
                    )

                # Get the created sales lead
                sales_query = SalesQuery.objects.get(id=query_id)

                # Return both the sales query and estimate data
                response_data = {
                    "sales_query": SalesQuerySerializer(sales_query).data,
                    "estimate_data": estimate_data,
                    "message": f"Sales query created with estimate data from {latest_estimate.item_name}",
                }

                return Response(response_data, status=status.HTTP_201_CREATED)
            else:
                return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"])
    def available_estimates(self, request):
        """Get available estimates for dropdown selection with readable names"""
        try:
            user = request.user
            company = getattr(user, "company", None)
            if not company:
                return Response(
                    {"error": "User does not belong to a company"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get estimates with full details for dropdown
            estimates = (
                EstimateVoucher.objects.filter(company=company)
                .select_related("account")
                .order_by("-created_at")
            )

            estimate_options = []
            for estimate in estimates:
                # Create readable display name
                display_name = estimate.item_name
                if estimate.account:
                    display_name += f" - {estimate.account.account_name}"
                display_name += f" (₹{estimate.grand_total})"

                estimate_options.append(
                    {
                        "value": str(estimate.id),
                        "label": display_name,
                        "item_name": estimate.item_name,
                        "grand_total": str(estimate.grand_total),
                        "account_name": estimate.account.account_name if estimate.account else None,
                        "date": estimate.date.isoformat(),
                    }
                )

            return Response({"estimate_options": estimate_options, "count": len(estimate_options)})

        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"])
    def jewelry_types(self, request):
        """Get unique jewelry types from existing estimates for sales lead creation with search support"""
        try:
            user = request.user
            company = getattr(user, "company", None)
            if not company:
                return Response(
                    {"error": "User does not belong to a company"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get search parameter for fuzzy matching
            search_term = request.query_params.get("search", "").lower().strip()

            # Get all estimates for the company
            estimates = EstimateVoucher.objects.filter(company=company).values_list(
                "item_name", flat=True
            )

            # Extract unique jewelry types (first word before " - ")
            jewelry_types_set = set()
            for item_name in estimates:
                if " - " in item_name:
                    jewelry_type = item_name.split(" - ")[0].strip()
                else:
                    jewelry_type = item_name.strip()

                if jewelry_type:  # Only add non-empty types
                    jewelry_types_set.add(jewelry_type)

            # Convert to sorted list
            jewelry_types = sorted(list(jewelry_types_set))

            # Apply search filter if provided
            if search_term:
                filtered_types = []
                for jtype in jewelry_types:
                    jtype_lower = jtype.lower()
                    # Prioritize exact start matches, then word start matches, then contains
                    if jtype_lower.startswith(search_term):
                        match_score = 100  # Exact start match (highest priority)
                        filtered_types.append(
                            {"value": jtype, "label": jtype, "match_score": match_score}
                        )
                    elif any(word.startswith(search_term) for word in jtype_lower.split()):
                        match_score = 75  # Word start match
                        filtered_types.append(
                            {"value": jtype, "label": jtype, "match_score": match_score}
                        )
                    elif search_term in jtype_lower:
                        match_score = 25  # Contains match (lowest priority)
                        filtered_types.append(
                            {"value": jtype, "label": jtype, "match_score": match_score}
                        )

                # Sort by match score (higher = better match)
                filtered_types.sort(key=lambda x: x["match_score"], reverse=True)
                jewelry_type_options = filtered_types
            else:
                # Format for dropdown without search
                jewelry_type_options = [{"value": jtype, "label": jtype} for jtype in jewelry_types]

            return Response(
                {
                    "jewelry_types": jewelry_type_options,
                    "count": len(jewelry_type_options),
                    "search_term": search_term,
                    "message": f"Found {len(jewelry_type_options)} jewelry types"
                    + (f" matching '{search_term}'" if search_term else ""),
                }
            )

        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"])
    def gold_qualities(self, request):
        """Get hardcoded gold quality options for dropdown (supports custom input)"""
        GOLD_QUALITIES = [
            {"id": "24kt", "name": "24KT", "code": "24"},
            {"id": "22kt", "name": "22KT", "code": "22"},
            {"id": "18kt", "name": "18KT", "code": "18"},
            {"id": "14kt", "name": "14KT", "code": "14"},
            {"id": "10kt", "name": "10KT", "code": "10"},
            {"id": "9kt", "name": "9KT", "code": "9"},
        ]

        return Response(
            {
                "gold_qualities": GOLD_QUALITIES,
                "count": len(GOLD_QUALITIES),
                "message": "Standard gold quality options. Custom values are also accepted.",
            }
        )

    @action(detail=True, methods=["get"])
    def available_base_estimates(self, request, pk=None):
        """Get available base estimates for creating variations - filtered by same jewelry type"""
        try:
            sales_query = self.get_object()
            user = request.user
            company = getattr(user, "company", None)

            if not company:
                return Response(
                    {"error": "User does not belong to a company"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get estimates that match EXACTLY the same jewelry type
            # Find estimates with EXACT jewelry type match (case insensitive)
            # Use exact word matching to avoid "Ring" matching "Earring"
            all_estimates = (
                EstimateVoucher.objects.filter(company=company)
                .select_related("account")
                .order_by("-created_at")
            )

            # Filter by exact jewelry type match (case-insensitive)
            jewelry_type_lower = sales_query.jewellery_type.lower()
            estimates = []
            for estimate in all_estimates:
                if estimate.item_name:
                    # Check if the jewelry type matches as a whole word
                    item_name_lower = estimate.item_name.lower()
                    # Split by common separators and check if jewelry type is one of the words
                    item_words = item_name_lower.replace("-", " ").replace("_", " ").split()
                    if (
                        jewelry_type_lower in item_words
                        or item_name_lower.startswith(jewelry_type_lower + " ")
                        or item_name_lower == jewelry_type_lower
                    ):
                        estimates.append(estimate)

            base_estimate_options = []
            for estimate in estimates:
                # Only include if it's the same jewelry type
                if sales_query.jewellery_type.lower() in estimate.item_name.lower():
                    # Create readable display name for base estimate selection
                    # Format: "Item Name (₹Amount) - Date"
                    # Don't show account name as all variations are for same customer
                    display_name = estimate.item_name

                    # Add total amount
                    display_name += f" (₹{estimate.grand_total:,.0f})"

                    # Add date for context
                    display_name += f" - {estimate.date.strftime('%d %b %Y')}"

                    base_estimate_options.append(
                        {
                            "value": str(estimate.id),
                            "label": display_name,
                            "item_name": estimate.item_name,
                            "grand_total": str(estimate.grand_total),
                            "account_name": estimate.account.account_name
                            if estimate.account
                            else None,
                            "date": estimate.date.isoformat(),
                            "line_items_count": estimate.line_items.count(),
                            "jewelry_type_match": sales_query.jewellery_type,
                        }
                    )

            return Response(
                {
                    "base_estimate_options": base_estimate_options,
                    "count": len(base_estimate_options),
                    "jewelry_type": sales_query.jewellery_type,
                    "filter_applied": f"Showing only {sales_query.jewellery_type} estimates",
                    "message": f"Found {len(base_estimate_options)} {sales_query.jewellery_type} estimates to use as base",
                }
            )

        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["get"])
    def list_estimates(self, request, pk=None):
        """Get all estimates associated with a specific sales query"""
        try:
            sales_query = self.get_object()

            user = request.user
            company = getattr(user, "company", None)
            if not company:
                return Response(
                    {"error": "User does not belong to a company"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Find all estimates related to this sales lead
            # First, look for estimates with the exact same item_name as the sales lead's jewellery_type
            estimates_qs = EstimateVoucher.objects.filter(
                company=company,
                # Exact match (case insensitive) for jewellery_type
                item_name__iexact=sales_query.jewellery_type,
            )

            # If the sales query has a specific estimate_id, include that estimate too
            if sales_query.estimate_id:
                try:
                    specific_estimate = EstimateVoucher.objects.filter(
                        id=sales_query.estimate_id, company=company
                    )
                    # Combine both querysets, removing duplicates
                    estimates_qs = estimates_qs | specific_estimate

                    # Remove duplicates and sort by created_at in descending order
                    estimates = []
                    seen_ids = set()
                    for est in estimates_qs.order_by("-created_at"):
                        if est.id not in seen_ids:
                            estimates.append(est)
                            seen_ids.add(est.id)
                except Exception:  # If there's an issue with the estimate_id, continue with the jewellery_type matched estimates
                    estimates = []
                    seen_ids = set()
                    for est in estimates_qs.order_by("-created_at"):
                        if est.id not in seen_ids:
                            estimates.append(est)
                            seen_ids.add(est.id)
            else:
                estimates = []
                seen_ids = set()
                for est in estimates_qs.order_by("-created_at"):
                    if est.id not in seen_ids:
                        estimates.append(est)
                        seen_ids.add(est.id)

            # Serialize the estimates
            serializer = EstimateVoucherSerializer(estimates, many=True)

            return Response(
                {
                    "estimates": serializer.data,
                    "count": len(serializer.data),
                    "sales_query_id": str(sales_query.id),
                    "jewellery_type": sales_query.jewellery_type,
                }
            )

        except SalesQuery.DoesNotExist:
            return Response(
                {"error": "Sales lead not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def list(self, request, *args, **kwargs):
        """Override list to support both regular list and lightweight list view"""
        # Check if lightweight query parameter is set
        lightweight = request.query_params.get("light", "false").lower() == "true"

        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            if lightweight:
                # Use a lightweight serializer for the list view
                serializer = SalesQueryListSerializer(page, many=True, context={"request": request})
            else:
                # Use full serializer
                serializer = SalesQuerySerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)

        if lightweight:
            serializer = SalesQueryListSerializer(queryset, many=True, context={"request": request})
        else:
            serializer = SalesQuerySerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def create_estimate_variation(self, request, pk=None):
        """Create a new estimate variation for the same jewelry item"""
        try:
            sales_query = self.get_object()
            user = request.user
            company = getattr(user, "company", None)

            if not company:
                return Response(
                    {"error": "User does not belong to a company"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = EstimateVariationSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            validated_data = serializer.validated_data
            variation_description = validated_data.get("variation_description")
            base_estimate_id = validated_data.get("base_estimate_id")
            copy_line_items = validated_data.get("copy_line_items", True)

            # Import here to avoid circular imports
            # Prepare line items data
            line_items_data = []

            # If base estimate provided and copy_line_items is True, copy its line items
            if base_estimate_id and copy_line_items:
                try:
                    base_estimate = EstimateVoucher.objects.get(
                        id=base_estimate_id, company=company
                    )
                    # Copy line items from base estimate
                    for line_item in base_estimate.line_items.all():
                        line_items_data.append(
                            {
                                "particulars": line_item.particulars,
                                "shape": line_item.shape,
                                "colour": line_item.colour,
                                "clarity": line_item.clarity,
                                "pc": line_item.pc,
                                "weight": float(line_item.weight) if line_item.weight else None,
                                "unit": line_item.unit,
                                "rate": float(line_item.rate) if line_item.rate else None,
                                "amount": float(line_item.amount),
                                "order": line_item.order,
                                "is_compulsory": line_item.is_compulsory,
                                "raw_material": line_item.raw_material,
                            }
                        )
                except EstimateVoucher.DoesNotExist:
                    # If base estimate not found, create default line items
                    line_items_data = [
                        {
                            "particulars": f"{sales_query.jewellery_type} - {variation_description}",
                            "amount": 0.00,
                            "order": 1,
                        }
                    ]
            else:
                # Create default line item if not copying
                line_items_data = [
                    {
                        "particulars": f"{sales_query.jewellery_type} - {variation_description}",
                        "amount": 0.00,
                        "order": 1,
                    }
                ]

            # Calculate totals from line items
            total_amount = sum(item.get("amount", 0) for item in line_items_data)
            gst_amount = total_amount * 0.03  # 3% GST (adjust as needed)
            grand_total = total_amount + gst_amount

            # Create the estimate using raw SQL since model and DB schema are out of sync
            estimate_id = str(uuid.uuid4()).replace("-", "")

            with connection.cursor() as cursor:
                # Check if sales_query_id column exists
                cursor.execute("PRAGMA table_info(estimate_vouchers);")
                columns = [col[1] for col in cursor.fetchall()]
                has_sales_query_id = "sales_query_id" in columns
                has_status = "status" in columns

                # Build INSERT query based on available columns
                base_columns = [
                    "id",
                    "company_id",
                    "account_id",
                    "item_name",
                    "date",
                    "total_taxable_value",
                    "gst_amount",
                    "grand_total",
                    "created_at",
                    "updated_at",
                    "created_by_id",
                    "phone_number",
                    "jewellery_type",
                    "gold_quality",
                    "size_details",
                    "sales_person_name",
                ]
                base_values = [
                    estimate_id,
                    str(company.id).replace("-", ""),
                    str(sales_query.account.id).replace("-", "") if sales_query.account else None,
                    f"{sales_query.jewellery_type} - {variation_description}",
                    timezone.now().date(),
                    total_amount,
                    gst_amount,
                    grand_total,
                    timezone.now(),
                    timezone.now(),
                    str(user.id).replace("-", "") if user else None,
                    # Always use account phone number for PDF
                    sales_query.phone_number or "",
                    sales_query.jewellery_type or "",
                    sales_query.gold_quality or "",
                    sales_query.size_details or "",
                    # Sales person name from sales query
                    sales_query.sales_person or "",
                ]

                # Add optional columns if they exist
                if has_sales_query_id:
                    base_columns.append("sales_query_id")
                    base_values.append(str(sales_query.id).replace("-", ""))

                if has_status:
                    base_columns.append("status")
                    base_values.append("draft")

                # Build and execute query
                placeholders = ", ".join(["%s"] * len(base_values))
                columns_str = ", ".join(base_columns)

                cursor.execute(
                    f"""
                    INSERT INTO estimate_vouchers ({columns_str})
                    VALUES ({placeholders})
                """,
                    base_values,
                )

                # Insert line items
                for idx, line_item in enumerate(line_items_data):
                    line_item_id = str(uuid_lib.uuid4()).replace("-", "")
                    cursor.execute(
                        """
                        INSERT INTO estimate_line_items 
                        (id, estimate_id, particulars, shape, colour, clarity, pc, 
                         weight, unit, rate, amount, "order", is_compulsory, raw_material)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                        [
                            line_item_id,
                            estimate_id,
                            line_item.get("particulars", ""),
                            line_item.get("shape", ""),
                            line_item.get("colour", ""),
                            line_item.get("clarity", ""),
                            line_item.get("pc"),
                            line_item.get("weight"),
                            line_item.get("unit", ""),
                            line_item.get("rate"),
                            line_item.get("amount", 0),
                            line_item.get("order", idx + 1),
                            line_item.get("is_compulsory", False),
                            line_item.get("raw_material", ""),
                        ],
                    )

            # Get the created estimate using the model
            new_estimate = EstimateVoucher.objects.get(id=estimate_id)

            # Update sales lead workflow status
            if sales_query.workflow_status == "inquiry_received":
                sales_query.workflow_status = "estimates_pending"
                sales_query.save()

            return Response(
                {
                    "estimate": EstimateVoucherSerializer(new_estimate).data,
                    "message": f"Estimate variation '{variation_description}' created successfully",
                    "sales_query_status": sales_query.workflow_status,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def select_final_estimate(self, request, pk=None):
        """Select the final estimate for this sales query"""
        try:
            sales_query = self.get_object()
            user = request.user
            company = getattr(user, "company", None)

            if not company:
                return Response(
                    {"error": "User does not belong to a company"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = EstimateSelectionSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            estimate_id = serializer.validated_data["estimate_id"]
            notes = serializer.validated_data.get("notes", "")

            # Verify the estimate exists and belongs to the company
            try:
                selected_estimate = EstimateVoucher.objects.get(id=estimate_id, company=company)
            except EstimateVoucher.DoesNotExist:
                return Response(
                    {"error": "Estimate not found or does not belong to your company"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Update sales lead with selected estimate
            sales_query.selected_estimate_id = estimate_id
            sales_query.workflow_status = "estimate_selected"

            # Add selection note to special instructions
            selection_note = (
                f"\n\nFinal Estimate Selected: {selected_estimate.item_name} (ID: {estimate_id})"
            )
            if notes:
                selection_note += f"\nSelection Notes: {notes}"

            if sales_query.special_instructions:
                sales_query.special_instructions += selection_note
            else:
                sales_query.special_instructions = selection_note.strip()

            sales_query.save()

            return Response(
                {
                    "message": "Final estimate selected successfully",
                    "selected_estimate": EstimateVoucherSerializer(selected_estimate).data,
                    "sales_query_status": sales_query.workflow_status,
                    "selection_notes": notes,
                }
            )

        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def convert_to_sale(self, request, pk=None):
        """
        Convert sales query to sale record

        This creates a Sale record (not an Order).
        The Order is created later via initiate_order_conversion.

        POST /api/sales-queries/{id}/convert_to_sale/

        Body: {
            "confirm_conversion": true,
            "sale_notes": "Optional notes",
            "advance_amount": 25000.00
        }
        """
        try:
            sales_query = self.get_object()
            user = request.user
            company = getattr(user, "company", None)

            if not company:
                return Response(
                    {"error": "User does not belong to a company"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate that an estimate is selected
            if not sales_query.selected_estimate_id:
                return Response(
                    {"error": "No estimate selected. Please select an estimate first."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = SaleConversionSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            if not serializer.validated_data.get("confirm_conversion"):
                return Response(
                    {"error": "Conversion must be confirmed"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get the selected estimate
            try:
                selected_estimate = EstimateVoucher.objects.get(
                    id=sales_query.selected_estimate_id, company=company
                )
            except EstimateVoucher.DoesNotExist:
                return Response(
                    {"error": "Selected estimate not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Check if Sale already exists for this sales query
            existing_sale = Sale.objects.filter(
                company=company,
                account=sales_query.account,
                selected_estimate_id=sales_query.selected_estimate_id,
            ).first()

            if existing_sale:
                return Response(
                    {
                        "message": "Sale already exists for this sales query",
                        "sale_id": str(existing_sale.id),
                        "sale_bill_no": existing_sale.bill_no
                        if hasattr(existing_sale, "bill_no")
                        else None,
                        "sales_query_status": sales_query.workflow_status,
                    },
                    status=status.HTTP_200_OK,
                )

            # Add sale notes if provided
            sale_notes = serializer.validated_data.get("sale_notes", "")
            advance_amount = serializer.validated_data.get("advance_amount")

            # Store in dedicated fields
            sales_query.sale_notes = sale_notes
            sales_query.advance_amount = advance_amount

            conversion_note = f"Converted from Sales Query: {sales_query.id}\n"
            conversion_note += (
                f"Selected Estimate: {selected_estimate.item_name} (ID: {selected_estimate.id})\n"
            )
            conversion_note += f"Estimate Total: ₹{selected_estimate.grand_total}\n"
            if sale_notes:
                conversion_note += f"Conversion Notes: {sale_notes}\n"
            if advance_amount:
                conversion_note += f"Advance Amount: ₹{advance_amount}\n"

            # Create the Sale record (NOT Order)
            sale = Sale.objects.create(
                company=company,
                account=sales_query.account,
                item_name=selected_estimate.item_name,
                selected_estimate=selected_estimate,
                created_by=user,
                remarks=conversion_note,
            )

            # Update sales query status
            sales_query.workflow_status = "converted_to_sale"

            # Add conversion info to special instructions
            if sales_query.special_instructions:
                sales_query.special_instructions += f"\n\n{conversion_note}"
            else:
                sales_query.special_instructions = conversion_note

            sales_query.save()

            return Response(
                {
                    "message": "Sales query converted to sale successfully",
                    "sale_id": str(sale.id),
                    "sale_order_id": str(sale.id),  # Add this for test compatibility
                    "selected_estimate_total": str(selected_estimate.grand_total),
                    "sales_query_status": sales_query.workflow_status,
                    "advance_amount": str(sales_query.advance_amount)
                    if sales_query.advance_amount
                    else None,
                    "sale_notes": sales_query.sale_notes,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            logger.error(f"Error in convert_to_sale: {str(e)}", exc_info=True)
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        """Convert sales query to actual sale using selected estimate"""
        try:
            sales_query = self.get_object()
            user = request.user
            company = getattr(user, "company", None)

            if not company:
                return Response(
                    {"error": "User does not belong to a company"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate that an estimate is selected
            if not sales_query.selected_estimate_id:
                return Response(
                    {"error": "No estimate selected. Please select an estimate first."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = SaleConversionSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            if not serializer.validated_data.get("confirm_conversion"):
                return Response(
                    {"error": "Conversion must be confirmed"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get the selected estimate
            try:
                selected_estimate = EstimateVoucher.objects.get(
                    id=sales_query.selected_estimate_id, company=company
                )
            except EstimateVoucher.DoesNotExist:
                return Response(
                    {"error": "Selected estimate not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Create sale record (using Order model as it represents sales)
            # Add sale notes if provided
            sale_notes = serializer.validated_data.get("sale_notes", "")
            advance_amount = serializer.validated_data.get("advance_amount")

            # Store in dedicated fields
            sales_query.sale_notes = sale_notes
            sales_query.advance_amount = advance_amount

            conversion_note = f"Converted from Sales Query: {sales_query.id}\n"
            conversion_note += (
                f"Selected Estimate: {selected_estimate.item_name} (ID: {selected_estimate.id})\n"
            )
            conversion_note += f"Estimate Total: ₹{selected_estimate.grand_total}\n"
            if sale_notes:
                conversion_note += f"Conversion Notes: {sale_notes}\n"
            if advance_amount:
                conversion_note += f"Advance Amount: ₹{advance_amount}\n"

            # Create the sale order
            sale_order = Order.objects.create(
                company=company,
                account=sales_query.account,
                date=timezone.now().date(),
                item_name=selected_estimate.item_name,
                created_by=user,
                advance_payment_received="YES" if advance_amount else "NO",
            )

            # Update sales query status
            sales_query.workflow_status = "converted_to_sale"

            # Add conversion info to special instructions
            if sales_query.special_instructions:
                sales_query.special_instructions += f"\n\n{conversion_note}"
            else:
                sales_query.special_instructions = conversion_note

            sales_query.save()

            return Response(
                {
                    "message": "Sales query converted to sale successfully",
                    "sale_order_id": str(sale_order.id),
                    "sale_bill_no": sale_order.bill_no,
                    "sale_job_no": sale_order.job_no,
                    "selected_estimate_total": str(selected_estimate.grand_total),
                    "sales_query_status": sales_query.workflow_status,
                    "advance_amount": str(sales_query.advance_amount)
                    if sales_query.advance_amount
                    else None,
                    "sale_notes": sales_query.sale_notes,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["get"])
    def estimate_summary(self, request, pk=None):
        """Get comprehensive estimate summary for sales query"""
        try:
            sales_query = self.get_object()
            user = request.user
            company = getattr(user, "company", None)

            if not company:
                return Response(
                    {"error": "User does not belong to a company"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Only show estimates directly linked to this specific sales query via FK
            linked_estimates = EstimateVoucher.objects.filter(
                company=company, sales_query=sales_query
            ).order_by("-created_at")

            estimates_data = []
            for estimate in linked_estimates:
                estimate_info = EstimateVoucherSerializer(estimate).data
                estimate_info["is_selected"] = (
                    str(estimate.id) == str(sales_query.selected_estimate_id)
                    if sales_query.selected_estimate_id
                    else False
                )
                estimate_info["is_linked"] = True
                estimates_data.append(estimate_info)

            # Get selected estimate details
            selected_estimate_data = None
            if sales_query.selected_estimate_id:
                try:
                    selected_estimate = EstimateVoucher.objects.get(
                        id=sales_query.selected_estimate_id, company=company
                    )
                    selected_estimate_data = EstimateVoucherSerializer(selected_estimate).data
                except EstimateVoucher.DoesNotExist:
                    pass

            # Get account info
            account_name = None
            if sales_query.account:
                account_name = sales_query.account.account_name

            return Response(
                {
                    "sales_query_id": str(sales_query.id),
                    "sales_query": SalesQuerySerializer(sales_query).data,
                    "account_name": account_name,
                    "jewellery_type": sales_query.jewellery_type,
                    "workflow_status": sales_query.workflow_status,
                    "all_estimates": estimates_data,
                    "estimates_count": len(estimates_data),
                    "linked_estimates_count": len(linked_estimates),
                    "selected_estimate": selected_estimate_data,
                    "can_create_variation": sales_query.workflow_status
                    in ["inquiry_received", "estimates_pending", "estimates_ready"],
                    "can_select_estimate": sales_query.workflow_status
                    in ["estimates_ready", "estimates_pending"]
                    and len(estimates_data) > 0,
                    "can_convert_to_sale": sales_query.workflow_status == "estimate_selected",
                    "is_converted": sales_query.workflow_status == "converted_to_sale",
                }
            )

        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def update_workflow_status(self, request, pk=None):
        """Update workflow status manually"""
        try:
            sales_query = self.get_object()
            new_status = request.data.get("workflow_status")

            if not new_status:
                return Response(
                    {"error": "workflow_status is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate status choice
            valid_statuses = [choice[0] for choice in sales_query.WORKFLOW_STATUS_CHOICES]
            if new_status not in valid_statuses:
                return Response(
                    {"error": f"Invalid status. Valid choices: {valid_statuses}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            sales_query.workflow_status = new_status
            sales_query.save()

            return Response(
                {
                    "message": f"Workflow status updated to {new_status}",
                    "workflow_status": sales_query.workflow_status,
                }
            )

        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # ==================== Process Task Reordering Endpoints ====================

    @action(detail=False, methods=["get"], url_path="process-tasks/default")
    def get_default_process_tasks(self, request):
        """Get the 30 default process tasks"""
        return Response(
            {
                "tasks": DEFAULT_PROCESS_TASKS,
                "count": len(DEFAULT_PROCESS_TASKS),
                "message": "Default process tasks retrieved successfully",
            }
        )

    @action(detail=True, methods=["post"], url_path="process-order")
    def save_process_order(self, request, pk=None):
        """Save custom process order for a sales query"""
        try:
            sales_query = self.get_object()
            # Validate the request data
            serializer = ProcessOrderCreateSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            validated_data = serializer.validated_data
            tasks_data = validated_data["tasks"]
            is_custom = validated_data.get("is_custom", False)

            # Check if process order already exists
            process_order, created = ProcessOrder.objects.get_or_create(
                sales_query=sales_query, defaults={"is_custom": is_custom}
            )

            if not created:
                # Update existing process order
                process_order.is_custom = is_custom
                process_order.save()

                # Delete existing tasks
                process_order.tasks.all().delete()

            # Create tasks
            for task_data in tasks_data:
                ProcessTask.objects.create(
                    process_order=process_order,
                    task_name=task_data["task_name"],
                    description=task_data.get("description", ""),
                    department=task_data.get("department", ""),
                    original_position=task_data["original_position"],
                    custom_position=task_data["custom_position"],
                    status="pending",
                )

            # Serialize and return

            response_serializer = ProcessOrderSerializer(process_order)
            return Response(
                {
                    "process_order": response_serializer.data,
                    "message": "Process order saved successfully",
                    "is_custom": is_custom,
                    "created": created,
                },
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["get"], url_path="process-order")
    def get_process_order(self, request, pk=None):
        """Get process order for a sales query"""
        try:
            sales_query = self.get_object()

            try:
                # Try to get existing process order
                process_order = ProcessOrder.objects.get(sales_query=sales_query)
                serializer = ProcessOrderSerializer(process_order)
                return Response(
                    {
                        "process_order": serializer.data,
                        "has_custom_order": process_order.is_custom,
                        "message": "Process order retrieved successfully",
                    }
                )
            except ProcessOrder.DoesNotExist:
                # Return default tasks if no custom order exists
                default_tasks = [
                    {
                        "task_name": task["name"],
                        "description": task["description"],
                        "original_position": task["position"],
                        "custom_position": task["position"],
                        "status": "pending",
                    }
                    for task in DEFAULT_PROCESS_TASKS
                ]
                return Response(
                    {
                        "process_order": None,
                        "default_tasks": default_tasks,
                        "has_custom_order": False,
                        "message": "No custom process order found, returning default tasks",
                    }
                )

        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["put"], url_path="process-order/update")
    def update_process_order(self, request, pk=None):
        """Update existing process order"""
        try:
            sales_query = self.get_object()

            # Check if process order exists
            try:
                process_order = ProcessOrder.objects.get(sales_query=sales_query)
            except ProcessOrder.DoesNotExist:
                return Response(
                    {"error": "Process order not found. Use POST to create one."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Validate the request data
            serializer = ProcessOrderCreateSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            validated_data = serializer.validated_data
            tasks_data = validated_data["tasks"]
            is_custom = validated_data.get("is_custom", False)

            # Update process order
            process_order.is_custom = is_custom
            process_order.save()

            # Delete existing tasks and create new ones
            process_order.tasks.all().delete()

            for task_data in tasks_data:
                ProcessTask.objects.create(
                    process_order=process_order,
                    task_name=task_data["task_name"],
                    description=task_data.get("description", ""),
                    department=task_data.get("department", ""),
                    original_position=task_data["original_position"],
                    custom_position=task_data["custom_position"],
                    status="pending",
                )

            # Serialize and return

            response_serializer = ProcessOrderSerializer(process_order)
            return Response(
                {
                    "process_order": response_serializer.data,
                    "message": "Process order updated successfully",
                    "is_custom": is_custom,
                }
            )

        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"], url_path="process-order/reset")
    def reset_process_order(self, request, pk=None):
        """Reset process order to default"""
        try:
            sales_query = self.get_object()

            # Check if process order exists
            try:
                process_order = ProcessOrder.objects.get(sales_query=sales_query)

                # Delete existing tasks
                process_order.tasks.all().delete()

                # Set to non-custom
                process_order.is_custom = False
                process_order.save()

                # Create default tasks
                for task in DEFAULT_PROCESS_TASKS:
                    ProcessTask.objects.create(
                        process_order=process_order,
                        task_name=task["name"],
                        description=task["description"],
                        department=task.get("department", ""),
                        original_position=task["position"],
                        custom_position=task["position"],
                        status="pending",
                    )

                # Serialize and return

                response_serializer = ProcessOrderSerializer(process_order)
                return Response(
                    {
                        "process_order": response_serializer.data,
                        "message": "Process order reset to default successfully",
                    }
                )

            except ProcessOrder.DoesNotExist:
                # Create new process order with default tasks
                process_order = ProcessOrder.objects.create(
                    sales_query=sales_query, is_custom=False
                )

                for task in DEFAULT_PROCESS_TASKS:
                    ProcessTask.objects.create(
                        process_order=process_order,
                        task_name=task["name"],
                        description=task["description"],
                        department=task.get("department", ""),
                        original_position=task["position"],
                        custom_position=task["position"],
                        status="pending",
                    )

                # Serialize and return

                response_serializer = ProcessOrderSerializer(process_order)
                return Response(
                    {
                        "process_order": response_serializer.data,
                        "message": "Process order created with default tasks",
                    },
                    status=status.HTTP_201_CREATED,
                )

        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["patch"], url_path="process-tasks/(?P<task_id>[^/.]+)")
    def update_process_task(self, request, pk=None, task_id=None):
        """Update a specific process task (status, assigned_to, notes, etc.)"""
        try:
            sales_query = self.get_object()

            # Get the process order
            try:
                process_order = ProcessOrder.objects.get(sales_query=sales_query)
            except ProcessOrder.DoesNotExist:
                return Response(
                    {"error": "Process order not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Get the specific task
            try:
                task = ProcessTask.objects.get(id=task_id, process_order=process_order)
            except ProcessTask.DoesNotExist:
                return Response(
                    {"error": "Process task not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Update task with provided data
            serializer = ProcessTaskSerializer(task, data=request.data, partial=True)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            serializer.save()

            return Response(
                {
                    "task": serializer.data,
                    "message": "Process task updated successfully",
                }
            )

        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def initiate_order_conversion(self, request, pk=None):
        """
        Direct conversion: Sales Query → Order

        POST /api/sales-queries/{id}/initiate-order-conversion/

        This endpoint:
        1. Gets or creates a Sale from the Sales Query
        2. Creates OrderDraft with query orders
        3. Returns the Order Draft ID

        Body:
        {
            "receipt_voucher_id": "uuid",
            "advance_amount": 25000.00,
            "advance_notes": "...",
            "order_data": {...}
        }
        """
        # Function is now in this file (moved from order_conversion_endpoint.py)
        return initiate_order_conversion_from_query(self, request, pk)

    @action(detail=True, methods=["get"], url_path="get-order")
    def get_final_order(self, request, pk=None):
        """
        Get the final Order ID created from this Sales Query

        This endpoint is used by the "View Process" button in the UI.
        It returns the order details if the sales query has been converted to an order.

        GET /api/sales-queries/{id}/get-order/

        Returns on success (200):
        {
            "success": true,
            "order_id": "uuid",
            "order_bill_no": "A0147",
            "order_job_no": "JOB-XXX",
            "workflow_status": "converted_to_order",
            "created_at": "2024-01-01T00:00:00Z"
        }

        Returns on error (404):
        {
            "success": false,
            "error": "No order created yet",
            "workflow_status": "converted_to_sale",
            "can_convert": true
        }
        """
        try:
            sales_query = self.get_object()

            # Import Order model

            # Case 1: Sales Query has final_order_id
            if sales_query.final_order_id:
                # Verify the order actually exists
                order = Order.objects.filter(id=sales_query.final_order_id).first()

                if order:
                    # Success - order exists
                    return Response(
                        {
                            "success": True,
                            "order_id": str(order.id),
                            "order_bill_no": order.bill_no,
                            "order_job_no": order.job_no,
                            "workflow_status": sales_query.workflow_status,
                            "created_at": order.created_at.isoformat()
                            if order.created_at
                            else None,
                        },
                        status=status.HTTP_200_OK,
                    )
                else:
                    # Order was deleted - try to fix by checking draft
                    logger.warning(
                        f"Sales Query {sales_query.id} has final_order_id {sales_query.final_order_id} but order doesn't exist"
                    )

                    # Try to find order through draft
                    draft = OrderDraft.objects.filter(
                        sales_query_id=sales_query.id, status="confirmed"
                    ).first()

                    if draft and draft.final_order_id:
                        new_order = Order.objects.filter(id=draft.final_order_id).first()
                        if new_order:
                            # Fix the sales query
                            sales_query.final_order_id = new_order.id
                            sales_query.workflow_status = "converted_to_order"
                            sales_query.save()

                            logger.info(
                                f"Fixed Sales Query {sales_query.id} -> Order {new_order.id}"
                            )

                            return Response(
                                {
                                    "success": True,
                                    "order_id": str(new_order.id),
                                    "order_bill_no": new_order.bill_no,
                                    "order_job_no": new_order.job_no,
                                    "workflow_status": sales_query.workflow_status,
                                    "created_at": new_order.created_at.isoformat()
                                    if new_order.created_at
                                    else None,
                                },
                                status=status.HTTP_200_OK,
                            )

                    # Can't fix - reset the sales query
                    sales_query.final_order_id = None
                    sales_query.workflow_status = "converted_to_sale"
                    sales_query.save()

                    logger.info(f"Reset Sales Query {sales_query.id} to 'converted_to_sale'")

                    return Response(
                        {
                            "success": False,
                            "error": "Order not found",
                            "message": "The order was deleted. Please create a new order.",
                            "workflow_status": sales_query.workflow_status,
                            "can_convert": True,
                        },
                        status=status.HTTP_404_NOT_FOUND,
                    )

            # Case 2: No final_order_id - check if there's a draft
            draft = OrderDraft.objects.filter(
                sales_query_id=sales_query.id, status="confirmed"
            ).first()

            if draft and draft.final_order_id:
                order = Order.objects.filter(id=draft.final_order_id).first()
                if order:
                    # Fix the sales query
                    sales_query.final_order_id = order.id
                    sales_query.workflow_status = "converted_to_order"
                    sales_query.save()

                    logger.info(f"Auto-fixed Sales Query {sales_query.id} -> Order {order.id}")

                    return Response(
                        {
                            "success": True,
                            "order_id": str(order.id),
                            "order_bill_no": order.bill_no,
                            "order_job_no": order.job_no,
                            "workflow_status": sales_query.workflow_status,
                            "created_at": order.created_at.isoformat()
                            if order.created_at
                            else None,
                        },
                        status=status.HTTP_200_OK,
                    )

            # Case 3: No order created yet
            return Response(
                {
                    "success": False,
                    "error": "No order created yet",
                    "message": "This sales query has not been converted to an order yet. Please create an order first.",
                    "workflow_status": sales_query.workflow_status,
                    "can_convert": sales_query.workflow_status
                    in ["converted_to_sale", "estimate_selected"],
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        except Exception as e:
            logger.error(f"Error getting final order for Sales Query {pk}: {str(e)}", exc_info=True)
            return Response(
                {
                    "success": False,
                    "error": "Internal server error",
                    "message": f"An error occurred: {str(e)}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ==================== ORDER CONVERSION ENDPOINT ====================
# Moved from order_conversion_endpoint.py


def initiate_order_conversion_from_query(self, request, pk=None):
    """
    Direct conversion: Sales Query → Order

    POST /api/sales-queries/{id}/initiate-order-conversion/

    This endpoint:
    1. Gets or creates a Sale from the Sales Query
    2. Calls the Sale → Order conversion
    3. Returns the Order Draft ID

    Body: Same as /api/sales/{id}/initiate-order-conversion/
    {
        "receipt_voucher_id": "uuid",
        "advance_amount": 25000.00,
        "advance_notes": "...",
        "order_data": {...}
    }
    """
    try:
        user = request.user
        company = getattr(user, "company", None)

        if not company:
            return Response(
                {"error": "User does not belong to a company"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get the sales query
        sales_query = self.get_object()

        if sales_query.account.company != company:
            return Response(
                {"error": "Sales query does not belong to your company"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # STEP 1: Get or create Sale from Sales Query
        sale = None

        # Try to find existing sale by estimate ID
        if sales_query.selected_estimate_id:
            sale = Sale.objects.filter(
                company=company, selected_estimate_id=sales_query.selected_estimate_id
            ).first()

        # If not found, create new sale
        if not sale:
            logger.info(f"Creating Sale from SalesQuery {pk}")

            # Get the selected estimate
            estimate = None
            if sales_query.selected_estimate_id:
                try:
                    estimate = EstimateVoucher.objects.get(
                        id=sales_query.selected_estimate_id, company=company
                    )
                except EstimateVoucher.DoesNotExist:
                    pass

            # Create the sale
            sale = Sale.objects.create(
                company=company,
                item_name=sales_query.jewellery_type or "Unnamed Item",
                account=sales_query.account,
                selected_estimate=estimate,
                created_by=user,
                remarks=f"Auto-created from Sales Query {pk} for order conversion",
            )

            # Update sales query status
            if sales_query.workflow_status != "converted_to_sale":
                sales_query.workflow_status = "converted_to_sale"
                sales_query.save()

            logger.info(f"Created Sale {sale.id} from SalesQuery {pk}")
        else:
            logger.info(f"Found existing Sale {sale.id} for SalesQuery {pk}")

        # STEP 2: Create Order Draft from Sale
        with transaction.atomic():
            # Get request data
            receipt_voucher_id = request.data.get("receipt_voucher_id")
            advance_amount = request.data.get("advance_amount", 0)
            advance_notes = request.data.get("advance_notes", "")
            order_data = request.data.get("order_data", {})

            # Validate receipt voucher if provided
            receipt = None
            if receipt_voucher_id:
                try:
                    receipt = Receipt.objects.get(id=receipt_voucher_id, company=company)
                except Receipt.DoesNotExist:
                    return Response(
                        {"error": "Receipt voucher not found"}, status=status.HTTP_404_NOT_FOUND
                    )

            # Check for existing draft
            existing_draft = OrderDraft.objects.filter(
                source_sale=sale, status="pending_confirmation"
            ).first()

            if existing_draft:
                logger.info(f"Reusing existing OrderDraft {existing_draft.id}")
                draft = existing_draft
            else:
                # Create new order draft
                draft = OrderDraft.objects.create(
                    source_sale=sale,
                    sales_query_id=sales_query.id,  # Store SalesQuery ID for easy lookup
                    company=company,
                    receipt_voucher=receipt,
                    advance_amount=advance_amount,
                    advance_notes=advance_notes,
                    order_data=order_data,
                    status="pending_confirmation",
                    created_by=user,
                )

                # Create default query orders
                for step_data in DEFAULT_ORDER_PROCESS_STEPS:
                    # Auto-complete first step if advance payment provided
                    step_status = "PENDING"
                    completed_at = None
                    if step_data["position"] == 1 and advance_amount and advance_amount > 0:
                        step_status = "COMPLETED"
                        completed_at = timezone.now()

                    draft.process_steps.create(
                        step_name=step_data["name"],
                        description=step_data.get("description", ""),
                        department=step_data.get("department", ""),
                        position=step_data["position"],
                        status=step_status,
                        completed_at=completed_at,
                    )

                logger.info(f"Created OrderDraft {draft.id} from Sale {sale.id}")

            # Prepare response
            steps_data = [
                {
                    "id": str(step.id),
                    "step_name": step.step_name,
                    "position": step.position,
                    "status": step.status,
                    "notes": step.notes or "",
                    "reference_id": str(step.reference_id)
                    if hasattr(step, "reference_id") and step.reference_id
                    else None,
                }
                for step in draft.process_steps.all().order_by("position")
            ]

            return Response(
                {
                    "draft_id": str(draft.id),
                    "sale_id": str(sale.id),
                    "sales_query_id": str(sales_query.id),
                    "status": draft.status,
                    "process_steps": steps_data,
                    "message": "Order draft created successfully",
                    "created_sale": sale.id != existing_draft.source_sale_id
                    if existing_draft
                    else True,
                },
                status=status.HTTP_201_CREATED,
            )

    except Exception as e:
        logger.error(f"Error in initiate_order_conversion_from_query: {str(e)}", exc_info=True)
        return Response(
            {"error": f"An error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
