from rest_framework import serializers

from .models import RepairIssue, OrderIssue, Query


class QuerySerializer(serializers.ModelSerializer):
    # Read-only fields for response
    account = serializers.SerializerMethodField(read_only=True)
    item_name = serializers.SerializerMethodField(read_only=True)
    is_expired = serializers.SerializerMethodField(read_only=True)
    reference_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Query
        fields = [
            "id",
            "account",
            "subaccount",
            "item_name",
            "item_name_custom",
            "gold_carat",
            "gender",
            "size",
            "location",
            "delivery_type",
            "query_in_date",
            "expiry_date",
            "reference_image",
            "reference_image_url",
            "linked_estimate_id",
            "status",
            "is_expired",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "is_expired", "account", "item_name", "reference_image_url"]

    def get_account(self, obj):
        if obj.account:
            return {
                "id": str(obj.account.id),
                "account_name": obj.account.account_name,
                "name": obj.account.account_name,
            }
        return None

    def get_item_name(self, obj):
        if obj.item_name:
            return {
                "id": str(obj.item_name.id),
                "name": obj.item_name.name,
            }
        return None

    def get_is_expired(self, obj):
        return obj.is_expired()
    
    def get_reference_image_url(self, obj):
        """Return absolute URL for the reference image"""
        if obj.reference_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.reference_image.url)
            return obj.reference_image.url
        return None

    def _parse_json_field(self, data):
        """Parse a field that might be a JSON string (from FormData) or already a dict."""
        import json

        if isinstance(data, str):
            try:
                return json.loads(data)
            except (json.JSONDecodeError, TypeError):
                return data
        return data

    def create(self, validated_data):
        from accounts.models import Account
        from core.models import ItemNameMaster

        # Handle nested account object from frontend (could be JSON string from FormData)
        account_data = self.initial_data.get("account")
        if account_data:
            account_data = self._parse_json_field(account_data)
            if isinstance(account_data, dict):
                account_id = account_data.get("id")
            else:
                account_id = account_data
            if account_id:
                validated_data["account"] = Account.objects.get(id=account_id)

        # Handle nested item_name object from frontend (could be JSON string from FormData)
        item_name_data = self.initial_data.get("item_name")
        if item_name_data:
            item_name_data = self._parse_json_field(item_name_data)
            if isinstance(item_name_data, dict):
                item_name_id = item_name_data.get("id")
            else:
                item_name_id = item_name_data
            if item_name_id:
                validated_data["item_name"] = ItemNameMaster.objects.get(id=item_name_id)

        return super().create(validated_data)


class OrderIssueSerializer(serializers.ModelSerializer):
    account_detail = serializers.SerializerMethodField()
    item_name_detail = serializers.SerializerMethodField()
    order_detail = serializers.SerializerMethodField()

    class Meta:
        model = OrderIssue
        fields = [
            "id",
            "order",
            "order_detail",
            "account",
            "account_detail",
            "item_name",
            "item_name_detail",
            "metal",
            "total_size",
            "base_metal_colour",
            "rhodium_instructions",
            "prong_style",
            "locking_system",
            "final_finish",
            "additional_notes",
            "order_ref",
            "status",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_account_detail(self, obj):
        if obj.account:
            return {
                "id": str(obj.account.id),
                "account_name": obj.account.account_name,
                "name": obj.account.account_name,
            }
        return None

    def get_item_name_detail(self, obj):
        if obj.item_name:
            return {
                "id": str(obj.item_name.id),
                "name": obj.item_name.name,
            }
        return None

    def get_order_detail(self, obj):
        if obj.order:
            return {
                "id": str(obj.order.id),
                "bill_no": obj.order.bill_no,
                "job_no": obj.order.job_no,
            }
        return None

    def get_order(self, obj):
        if obj.order:
            return {
                "id": str(obj.order.id),
                "bill_no": obj.order.bill_no,
            }
        return None


class RepairIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepairIssue
        fields = [
            "id",
            "company",
            "account",
            "tag_no",
            "item_name",
            "piece",
            "remark",
            "stamp",
            "gr_wt",
            "net_wt",
            "tunch",
            "wstg",
            "rate",
            "total",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "company", "created_by", "updated_by", "created_at", "updated_at"]
