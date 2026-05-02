# from rest_framework import serializers
# from .models import SalesQuery
# from accounts.models import Account


# class SalesQuerySerializer(serializers.ModelSerializer):
#     account = serializers.SerializerMethodField()
#     account_id = serializers.PrimaryKeyRelatedField(
#         queryset=Account.objects.all(),
#         write_only=True,
#         source='account',
#         required=True
#     )

#     class Meta:
#         model = SalesQuery
#         fields = [
#             'id', 'order_date', 'sales_person', 'vendor', 'account', 'account_id',
#             'sub_account', 'phone_number', 'email', 'city', 'client_delivery_type', 'pan_gstin',
#             'occasion', 'required_delivery_date', 'stock_in_deadline', 'purpose',
#             'jewellery_type', 'size_details', 'fit_details', 'follow_up_log', 'style_preference', 'metal_preference',
#             'diamond_shape', 'color_clarity', 'origin', 'diamond_budget', 'diamond_priority', 'sample_details',
#             'gemstone_preference', 'gemstone_color_clarity', 'gemstone_origin', 'other_details',
#             'budget_range', 'urgency_level', 'reference_source',
#             'must_have', 'must_avoid', 'special_instructions',
#             'advance_handling', 'department_instructions', 'design_delivery',
#             'ledger_entries', 'created_at', 'updated_at'
#         ]
#         read_only_fields = ['id', 'created_at', 'updated_at']

#     def get_account(self, obj):
#         if obj.account:
#             return {
#                 'id': str(obj.account.id),
#                 'account_name': obj.account.account_name,
#                 'name': obj.account.account_name,
#             }
#         return None

#     def create(self, validated_data):
#         """Override create to handle nested objects properly"""
#         return SalesQuery.objects.create(**validated_data)

#     def update(self, instance, validated_data):
#         """Override update to handle nested objects properly"""
#         for attr, value in validated_data.items():
#             setattr(instance, attr, value)
#         instance.save()
#         return instance


# class SalesQueryListSerializer(serializers.ModelSerializer):
#     """Lightweight serializer for list view"""
#     account = serializers.SerializerMethodField()
#     client_name = serializers.SerializerMethodField()
#     status = serializers.SerializerMethodField()

#     class Meta:
#         model = SalesQuery
#         fields = [
#             'id', 'date', 'client_name', 'jewellery_type', 'status', 'account'
#         ]

#     def get_account(self, obj):
#         if obj.account:
#             return {
#                 'id': str(obj.account.id),
#                 'account_name': obj.account.account_name,
#                 'name': obj.account.account_name,
#             }
#         return None

#     def get_client_name(self, obj):
#         return obj.account.account_name if obj.account else "Unknown"

#     def get_date(self, obj):
#         return obj.order_date.isoformat() if obj.order_date else None

#     def get_status(self, obj):
#         return obj.status


# class DashboardStatsSerializer(serializers.Serializer):
#     """Serializer for dashboard statistics"""
#     total_queries = serializers.IntegerField()
#     active_queries = serializers.IntegerField()
#     pending_queries = serializers.IntegerField()
#     completed_queries = serializers.IntegerField()


from rest_framework import serializers
from .models import SalesQuery, ProcessOrder, ProcessTask, ProcessDependency
from accounts.models import Account, SubAccount
from core.models import ItemNameMaster
import re


class SalesQuerySerializer(serializers.ModelSerializer):
    account = serializers.SerializerMethodField()
    account_id = serializers.PrimaryKeyRelatedField(
        queryset=Account.objects.all(), write_only=True, source="account", required=True
    )
    # Sub account record field for proper relationship
    sub_account_record = serializers.SerializerMethodField()
    sub_account_record_id = serializers.PrimaryKeyRelatedField(
        queryset=SubAccount.objects.all(),
        write_only=True,
        source="sub_account_record",
        required=False,
        allow_null=True,
    )
    # Jewellery type master field for dropdown selection
    jewellery_type_master = serializers.SerializerMethodField()
    jewellery_type_master_id = serializers.PrimaryKeyRelatedField(
        queryset=ItemNameMaster.objects.all(),
        write_only=True,
        source="jewellery_type_master",
        required=False,
        allow_null=True,
    )
    reference_photo_url = serializers.SerializerMethodField()
    sample_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = SalesQuery
        fields = [
            "id",
            "order_date",
            "sales_person",
            "vendor",
            "account",
            "account_id",
            "sub_account",
            "sub_account_record",
            "sub_account_record_id",
            "phone_number",
            "email",
            "city",
            "client_delivery_type",
            "pan_gstin",
            "occasion",
            "required_delivery_date",
            "stock_in_deadline",
            "purpose",
            "jewellery_type",
            "jewellery_type_master",
            "jewellery_type_master_id",
            "gold_quality",
            "size_details",
            "fit_details",
            "follow_up_log",
            "style_preference",
            "metal_preference",
            "diamond_shape",
            "color_clarity",
            "origin",
            "diamond_budget",
            "diamond_priority",
            "sample_details",
            "sample_photo",
            "sample_photo_url",
            "gemstone_preference",
            "gemstone_color_clarity",
            "gemstone_origin",
            "other_details",
            "budget_range",
            "urgency_level",
            "reference_source",
            "must_have",
            "must_avoid",
            "special_instructions",
            "transfer_department",
            "follow_up_logs",
            "advance_handling",
            "department_instructions",
            "design_delivery",
            "ledger_entries",
            "reference_photo",
            "reference_photo_url",
            "workflow_status",
            "selected_estimate_id",
            "advance_amount",
            "sale_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "reference_photo_url",
            "sample_photo_url",
            "workflow_status",
            "advance_amount",
            "sale_notes",
        ]

    def get_account(self, obj):
        if obj.account:
            return {
                "id": str(obj.account.id),
                "account_name": obj.account.account_name,
                "name": obj.account.account_name,
            }
        return None

    def get_reference_photo_url(self, obj):
        """Return absolute URL for the reference photo"""
        if obj.reference_photo:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.reference_photo.url)
            return obj.reference_photo.url
        return None
    
    def get_sample_photo_url(self, obj):
        """Return absolute URL for the sample photo"""
        if obj.sample_photo:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.sample_photo.url)
            return obj.sample_photo.url
        return None

    def get_sub_account_record(self, obj):
        """Present sub_account_record as an object with id and name"""
        if obj.sub_account_record:
            return {
                "id": str(obj.sub_account_record.id),
                "sub_account_name": obj.sub_account_record.sub_account_name,
                "name": obj.sub_account_record.sub_account_name,
                "phone_number": obj.sub_account_record.phone_number,
                "email": obj.sub_account_record.email,
            }
        return None

    def get_jewellery_type_master(self, obj):
        """Present jewellery_type_master as an object with id and name"""
        if obj.jewellery_type_master:
            return {
                "id": str(obj.jewellery_type_master.id),
                "name": obj.jewellery_type_master.name,
                "code": obj.jewellery_type_master.code,
            }
        return None

    def validate_pan_gstin(self, value):
        """Validate PAN/GSTIN field - max 12 characters, alphanumeric only"""
        if value:
            # Remove any whitespace
            value = value.strip()

            # Check length
            if len(value) > 12:
                raise serializers.ValidationError(
                    "PAN/GSTIN cannot be more than 12 characters long."
                )

            # Check if contains only alphanumeric characters
            if not re.match(r"^[A-Za-z0-9]+$", value):
                raise serializers.ValidationError("PAN/GSTIN can only contain letters and numbers.")

        return value

    def validate(self, data):
        """Validate mandatory fields"""
        # Check mandatory customer data fields
        if not data.get("phone_number"):
            raise serializers.ValidationError({"phone_number": "Phone number is mandatory."})

        if not data.get("email"):
            raise serializers.ValidationError({"email": "Email ID is mandatory."})

        if not data.get("pan_gstin"):
            raise serializers.ValidationError({"pan_gstin": "PAN/Aadhaar details is mandatory."})

        if not data.get("metal_preference"):
            raise serializers.ValidationError(
                {"metal_preference": "Metal preference is mandatory."}
            )

        if not data.get("client_delivery_type"):
            raise serializers.ValidationError(
                {"client_delivery_type": "Delivery option is mandatory."}
            )

        return data

    def create(self, validated_data):
        """Override create to handle nested objects properly"""
        # Sync jewellery_type from jewellery_type_master if provided
        if validated_data.get("jewellery_type_master"):
            validated_data["jewellery_type"] = validated_data["jewellery_type_master"].name

        # Gold Quality: Just use the gold_quality text field (supports both dropdown and custom)
        # No need to sync with gold_quality_master since we're using hardcoded values

        return SalesQuery.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """Override update to handle nested objects properly"""
        # Sync jewellery_type from jewellery_type_master if provided
        if validated_data.get("jewellery_type_master"):
            validated_data["jewellery_type"] = validated_data["jewellery_type_master"].name

        # Gold Quality: Just use the gold_quality text field (supports both dropdown and custom)
        # No need to sync with gold_quality_master since we're using hardcoded values

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class SalesQueryListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list view"""

    account = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = SalesQuery
        fields = [
            "id",
            "order_date",
            "client_name",
            "jewellery_type",
            "status",
            "workflow_status",
            "account",
        ]

    def get_account(self, obj):
        if obj.account:
            return {
                "id": str(obj.account.id),
                "account_name": obj.account.account_name,
                "name": obj.account.account_name,
            }
        return None

    def get_client_name(self, obj):
        return obj.account.account_name if obj.account else "Unknown"

    def get_status(self, obj):
        return obj.status


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""

    total_queries = serializers.IntegerField()
    active_queries = serializers.IntegerField()
    estimates_pending = serializers.IntegerField()
    queries_converted = serializers.IntegerField()
    avg_response_time_hours = serializers.FloatField()
    pending_followups = serializers.IntegerField()


class EstimateSelectionSerializer(serializers.Serializer):
    """Serializer for selecting final estimate"""

    estimate_id = serializers.UUIDField(required=True)
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)


class EstimateVariationSerializer(serializers.Serializer):
    """Serializer for creating estimate variations"""

    variation_description = serializers.CharField(max_length=255, required=True)
    base_estimate_id = serializers.UUIDField(required=False, allow_null=True)
    copy_line_items = serializers.BooleanField(default=True)


class SaleConversionSerializer(serializers.Serializer):
    """Serializer for converting sales query to sale"""

    confirm_conversion = serializers.BooleanField(required=True)
    sale_notes = serializers.CharField(max_length=500, required=False, allow_blank=True)
    advance_amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, allow_null=True
    )


class ProcessTaskSerializer(serializers.ModelSerializer):
    """Serializer for ProcessTask model"""

    assigned_to_details = serializers.SerializerMethodField()

    class Meta:
        model = ProcessTask
        fields = [
            "id",
            "task_name",
            "description",
            "department",
            "original_position",
            "custom_position",
            "status",
            "assigned_to",
            "assigned_to_details",
            "due_date",
            "completed_at",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "assigned_to_details"]

    def get_assigned_to_details(self, obj):
        if obj.assigned_to:
            return {
                "id": str(obj.assigned_to.id),
                "name": obj.assigned_to.get_full_name() or obj.assigned_to.username,
                "email": obj.assigned_to.email,
            }
        return None


class ProcessOrderSerializer(serializers.ModelSerializer):
    """Serializer for ProcessOrder model"""

    tasks = ProcessTaskSerializer(many=True, read_only=True)
    sales_query_details = serializers.SerializerMethodField()

    class Meta:
        model = ProcessOrder
        fields = [
            "id",
            "sales_query",
            "sales_query_details",
            "is_custom",
            "tasks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "sales_query_details"]

    def get_sales_query_details(self, obj):
        return {
            "id": str(obj.sales_query.id),
            "jewellery_type": obj.sales_query.jewellery_type,
            "order_date": obj.sales_query.order_date.isoformat()
            if obj.sales_query.order_date
            else None,
        }


class ProcessDependencySerializer(serializers.ModelSerializer):
    """Serializer for ProcessDependency model"""

    task_name = serializers.CharField(source="task.task_name", read_only=True)
    depends_on_task_name = serializers.CharField(source="depends_on_task.task_name", read_only=True)

    class Meta:
        model = ProcessDependency
        fields = [
            "id",
            "task",
            "task_name",
            "depends_on_task",
            "depends_on_task_name",
            "dependency_type",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "task_name", "depends_on_task_name"]


class ProcessOrderCreateSerializer(serializers.Serializer):
    """Serializer for creating/updating process order with tasks"""

    tasks = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        help_text="List of 29 tasks with positions",
    )
    is_custom = serializers.BooleanField(default=False, help_text="Whether this is a custom order")

    def validate_tasks(self, value):
        """Validate that all 29 tasks are present and positions are correct"""
        if len(value) != 29:
            raise serializers.ValidationError(f"Expected 29 tasks, got {len(value)}")

        # Check for duplicate positions
        positions = [task.get("custom_position") for task in value]
        if len(positions) != len(set(positions)):
            raise serializers.ValidationError("Duplicate task positions found")

        # Check that positions are 1-29
        if set(positions) != set(range(1, 30)):
            raise serializers.ValidationError("Task positions must be 1-29 with no gaps")

        # Validate each task has required fields
        for task in value:
            if (
                "task_name" not in task
                or "original_position" not in task
                or "custom_position" not in task
            ):
                raise serializers.ValidationError(
                    "Each task must have task_name, original_position, and custom_position"
                )

        return value
