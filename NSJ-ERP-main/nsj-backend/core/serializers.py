"""
Serializers for core master data models.
"""

from rest_framework import serializers
from .models import (
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


class GoldCaratMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoldCaratMaster
        fields = ["id", "name", "value", "is_standard", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class MetalTypeMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetalTypeMaster
        fields = ["id", "name", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class MetalColorMasterSerializer(serializers.ModelSerializer):
    metal_type_name = serializers.CharField(source="metal_type.name", read_only=True)

    class Meta:
        model = MetalColorMaster
        fields = ["id", "name", "metal_type", "metal_type_name", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class ItemGroupMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemGroupMaster
        fields = ["id", "name", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class MasterDataRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.CharField(source="requested_by.name", read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.name", read_only=True)
    master_type_display = serializers.CharField(source="get_master_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = MasterDataRequest
        fields = [
            "id",
            "master_type",
            "master_type_display",
            "requested_value",
            "additional_info",
            "status",
            "status_display",
            "requested_by",
            "requested_by_name",
            "reviewed_by",
            "reviewed_by_name",
            "rejection_reason",
            "created_at",
            "updated_at",
            "reviewed_at",
        ]
        read_only_fields = [
            "id",
            "requested_by",
            "reviewed_by",
            "created_at",
            "updated_at",
            "reviewed_at",
        ]


class ItemNameMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemNameMaster
        fields = ["id", "name", "code"]
        read_only_fields = ["id"]


class GoldQualityMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoldQualityMaster
        fields = ["id", "name", "code"]
        read_only_fields = ["id"]


class ClarityMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClarityMaster
        fields = ["id", "name", "code"]
        read_only_fields = ["id"]


class ShapeMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShapeMaster
        fields = ["id", "name", "code"]
        read_only_fields = ["id"]


class ColourMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ColourMaster
        fields = ["id", "name"]
        read_only_fields = ["id"]


class SizeMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = SizeMaster
        fields = ["id", "name"]
        read_only_fields = ["id"]


class UnitMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitMaster
        fields = ["id", "name", "code"]
        read_only_fields = ["id"]


class LabMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabMaster
        fields = ["id", "name"]
        read_only_fields = ["id"]


class GoldPriceFeedingSerializer(serializers.ModelSerializer):
    fed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = GoldPriceFeeding
        fields = [
            "id",
            "gold_24k_rate",
            "gold_22k_rate",
            "silver_rate",
            "update_type",
            "feeding_date",
            "fed_by",
            "fed_by_name",
            "fed_at",
            "updated_at",
            "notes",
        ]
        read_only_fields = ["id", "fed_by", "fed_at", "updated_at"]

    def get_fed_by_name(self, obj):
        if obj.fed_by:
            return obj.fed_by.get_full_name() or obj.fed_by.username
        return None

    def create(self, validated_data):
        user = self.context["request"].user
        company = getattr(user, "company", None)
        validated_data["fed_by"] = user
        validated_data["company"] = company
        return super().create(validated_data)


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = [
            "id",
            "name",
            "code",
            "description",
            "features",
            "can_edit_gold_price",
            "can_view_accounting",
            "can_view_production",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class DashboardConfigurationSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)

    class Meta:
        model = DashboardConfiguration
        fields = [
            "id",
            "department",
            "widgets",
            "layout_type",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class DailyGoldRateSerializer(serializers.ModelSerializer):
    """Serializer for Daily Gold Rate"""

    entered_by_name = serializers.SerializerMethodField()
    last_modified_by_name = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = DailyGoldRate
        fields = [
            "id",
            "rate_date",
            "rate_type",
            "gold_24k_999",
            "gold_24k_995",
            "gold_22k",
            "gold_18k",
            "gold_14k",
            "silver_rate",
            "is_locked",
            "entered_by",
            "entered_by_name",
            "entered_at",
            "last_modified_by",
            "last_modified_by_name",
            "last_modified_at",
            "correction_notes",
            "can_edit",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "gold_22k",
            "gold_18k",
            "gold_14k",
            "entered_by",
            "entered_at",
            "created_at",
            "updated_at",
            "can_edit",
        ]

    def get_entered_by_name(self, obj):
        if obj.entered_by:
            return obj.entered_by.get_full_name() or obj.entered_by.username
        return None

    def get_last_modified_by_name(self, obj):
        if obj.last_modified_by:
            return obj.last_modified_by.get_full_name() or obj.last_modified_by.username
        return None

    def get_can_edit(self, obj):
        """Check if current user can edit this rate"""
        request = self.context.get("request")
        if not request or not request.user:
            return False

        user = request.user

        # Admin (Niti) can always edit
        if user.is_superuser or user.username in ["niti", "mehul"]:
            return True

        # If locked, only admin can edit
        if obj.is_locked:
            return False

        # Check if user has gold price editing permission
        return getattr(user, "can_edit_gold_price", False)

    def get_can_edit_permission(self, user):
        """Check if user has permission to enter gold rates"""
        # Superuser or specific users
        if user.is_superuser or user.username in ["niti", "mehul"]:
            return True

        # Check user permission
        return getattr(user, "can_edit_gold_price", False)

    def validate(self, data):
        """Validate gold rate data"""
        # No duplicate rejection — create() handles upsert for OPENING/CLOSING
        return data

    def create(self, validated_data):
        """Create gold rate with audit trail — upsert for OPENING/CLOSING"""
        request = self.context.get("request")
        user = request.user if request else None
        company = getattr(user, "company", None)

        # Validate user has a company
        if not company:
            raise serializers.ValidationError(
                {
                    "company": "User must be assigned to a company to create gold rates. Please contact your administrator."
                }
            )

        # Validate user has permission
        if not self.get_can_edit_permission(user):
            raise serializers.ValidationError(
                {
                    "permission": "You don't have permission to enter gold rates. Only admin and accounts users can enter rates."
                }
            )

        validated_data["entered_by"] = user
        validated_data["company"] = company

        rate_type = validated_data.get("rate_type")
        rate_date = validated_data.get("rate_date")

        # For OPENING/CLOSING: upsert (update existing if present)
        if rate_type in ["OPENING", "CLOSING"]:
            existing = DailyGoldRate.objects.filter(
                company=company, rate_date=rate_date, rate_type=rate_type
            ).first()

            if existing:
                # Update existing record instead of creating duplicate
                existing.gold_24k_999 = validated_data.get("gold_24k_999", existing.gold_24k_999)
                existing.gold_24k_995 = validated_data.get("gold_24k_995", existing.gold_24k_995)
                existing.silver_rate = validated_data.get("silver_rate", existing.silver_rate)
                existing.last_modified_by = user
                from django.utils import timezone

                existing.last_modified_at = timezone.now()
                existing.save()

                # Create change log
                GoldRateChangeLog.objects.create(
                    gold_rate=existing,
                    action="UPDATE",
                    changed_by=user,
                    notes=f"Updated {rate_type} rate for {rate_date} (re-submitted)",
                    ip_address=self.get_client_ip(request),
                )
                return existing

        # Lock opening and closing rates immediately
        if rate_type in ["OPENING", "CLOSING"]:
            validated_data["is_locked"] = True

        instance = super().create(validated_data)

        # Create change log
        GoldRateChangeLog.objects.create(
            gold_rate=instance,
            action="CREATE",
            changed_by=user,
            notes=f"Created {instance.rate_type} rate for {instance.rate_date}",
            ip_address=self.get_client_ip(request),
        )

        return instance

    def update(self, instance, validated_data):
        """Update gold rate with audit trail"""
        request = self.context.get("request")
        user = request.user if request else None

        # Track changes
        changes = []
        for field, new_value in validated_data.items():
            old_value = getattr(instance, field)
            if old_value != new_value:
                changes.append({"field": field, "old": str(old_value), "new": str(new_value)})

        # Update last modified info
        validated_data["last_modified_by"] = user
        from django.utils import timezone

        validated_data["last_modified_at"] = timezone.now()

        instance = super().update(instance, validated_data)

        # Create change logs for each field
        for change in changes:
            GoldRateChangeLog.objects.create(
                gold_rate=instance,
                action="OVERRIDE" if instance.is_locked else "UPDATE",
                field_changed=change["field"],
                old_value=change["old"],
                new_value=change["new"],
                changed_by=user,
                notes=validated_data.get("correction_notes", ""),
                ip_address=self.get_client_ip(request),
            )

        return instance

    def get_client_ip(self, request):
        """Get client IP address from request"""
        if not request:
            return None
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip


class GoldRateChangeLogSerializer(serializers.ModelSerializer):
    """Serializer for Gold Rate Change Log"""

    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = GoldRateChangeLog
        fields = [
            "id",
            "action",
            "field_changed",
            "old_value",
            "new_value",
            "changed_by",
            "changed_by_name",
            "changed_at",
            "notes",
            "ip_address",
        ]
        read_only_fields = ["id", "changed_at"]

    def get_changed_by_name(self, obj):
        if obj.changed_by:
            return obj.changed_by.get_full_name() or obj.changed_by.username
        return None


class GoldRateSummarySerializer(serializers.Serializer):
    """Summary serializer for daily gold rates"""

    rate_date = serializers.DateField()
    has_opening_rate = serializers.BooleanField()
    has_closing_rate = serializers.BooleanField()
    intermediate_count = serializers.IntegerField()
    opening_rate = DailyGoldRateSerializer(allow_null=True)
    closing_rate = DailyGoldRateSerializer(allow_null=True)
    intermediate_rates = DailyGoldRateSerializer(many=True)
    current_active_rate = DailyGoldRateSerializer(allow_null=True)


class CountryMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CountryMaster
        fields = ["id", "name", "code"]
        read_only_fields = ["id"]


class StateMasterSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source="country.name", read_only=True)

    class Meta:
        model = StateMaster
        fields = ["id", "name", "code", "country", "country_name"]
        read_only_fields = ["id"]


class CityMasterSerializer(serializers.ModelSerializer):
    state_name = serializers.CharField(source="state.name", read_only=True)
    country_name = serializers.CharField(source="state.country.name", read_only=True)

    class Meta:
        model = CityMaster
        fields = ["id", "name", "code", "state", "state_name", "country_name"]
        read_only_fields = ["id"]


# ---------------------------------------------------------------------------
# Raw Material Purchase dropdown master serializers
# ---------------------------------------------------------------------------

class GemstoneMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = GemstoneMaster
        fields = ["id", "name", "code", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class GemstoneShapeMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = GemstoneShapeMaster
        fields = ["id", "name", "code", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class GemstoneColorMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = GemstoneColorMaster
        fields = ["id", "name", "code", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class GemstoneClarityMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = GemstoneClarityMaster
        fields = ["id", "name", "code", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class GemstoneTreatmentMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = GemstoneTreatmentMaster
        fields = ["id", "name", "code", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class OriginMasterSerializer(serializers.ModelSerializer):
    material_type_display = serializers.CharField(source="get_material_type_display", read_only=True)

    class Meta:
        model = OriginMaster
        fields = ["id", "name", "material_type", "material_type_display", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class CutMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CutMaster
        fields = ["id", "name", "code", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class PolishMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = PolishMaster
        fields = ["id", "name", "code", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class SymmetryMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = SymmetryMaster
        fields = ["id", "name", "code", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
