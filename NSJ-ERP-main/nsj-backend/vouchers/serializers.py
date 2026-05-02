from rest_framework import serializers
from .models import (
    Order,
    ThreeDDesign,
    ThreeDDesignImage,
    ThreeDPrintingCAM,
    ThreeDPrintingCAMImage,
    GhatApproval,
    GhatApprovalImage,
    GhatQualityCheck,
    GhatQualityCheckImage,
    StoneDemandToBagging,
    StoneDemandToBaggingImage,
    PreRhodiumQualityCheck,
    PreRhodiumQualityCheckImage,
    ItemFinalPackingList,
    ItemFinalPackingListImage,
    RawMaterialTally,
    RawMaterialTallyImage,
    TwoDDesign,
    TwoDDesignImage,
)


class OrderSerializer(serializers.ModelSerializer):
    # Treat company as read-only: the view will assign company based on request.user
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    # Represent advance_payment_received as a choice field (YES/NO) to match frontend dropdown
    advance_payment_received = serializers.ChoiceField(
        choices=[("YES", "Yes"), ("NO", "No")], required=False, allow_blank=True
    )

    # Order type field with validation
    order_type = serializers.ChoiceField(
        choices=Order.ORDER_TYPE_CHOICES,
        default="STOCK_JEWELRY",
        help_text="Order type determines the Order ID prefix (A/B/C/D)",
    )

    # Present account as an object with id and name for frontend display
    account = serializers.SerializerMethodField(read_only=True)
    # Write-only field to accept account UUID when creating/updating
    account_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    # Add upload_file URL serialization
    upload_file_url = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "bill_no",
            "job_no",
            "company",
        )

    # Present related masters as small objects for frontend convenience
    item_name_fk = serializers.SerializerMethodField(read_only=True)
    stamp_fk = serializers.SerializerMethodField(read_only=True)
    size_fk = serializers.SerializerMethodField(read_only=True)
    # Include source draft for receipt voucher details
    source_draft = serializers.SerializerMethodField(read_only=True)
    # Include sales query ID for linking
    sales_query_id = serializers.SerializerMethodField(read_only=True)
    # Include sale ID for linking
    sale_id = serializers.SerializerMethodField(read_only=True)
    # Include order_data from source draft with all workflow stage data
    order_data = serializers.SerializerMethodField(read_only=True)

    # Write-only alias fields (accept UUIDs from frontend)
    item_name_fk_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    stamp_fk_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    size_fk_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    def get_upload_file_url(self, obj):
        """Return the absolute URL for the uploaded file/image"""
        if obj.upload_file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.upload_file.url)
        return None

    def create(self, validated_data):
        # Check if order_type was explicitly provided by UI
        order_type_provided = (
            "order_type" in validated_data and validated_data["order_type"] != "STOCK_JEWELRY"
        )

        # map *_id fields into FK fields for model creation
        for fk in ("item_name_fk_id", "stamp_fk_id", "size_fk_id", "account_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                # DRF/NDR expects the FK field to be provided as '<field>_id'
                if fk == "account_id":
                    validated_data["account_id"] = val
                else:
                    validated_data[fk.replace("_id", "") + "_id"] = val

        # Calculate value_item server-side to avoid mismatch with frontend
        validated_data = self._ensure_value_calculated(validated_data)

        # Create the instance
        instance = super().create(validated_data)

        # Mark if order_type was manually set to prevent auto-detection override
        if order_type_provided:
            instance._order_type_manually_set = True
            instance.save()

        return instance

    def update(self, instance, validated_data):
        for fk in ("item_name_fk_id", "stamp_fk_id", "size_fk_id", "account_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                if fk == "account_id":
                    validated_data["account_id"] = val
                else:
                    validated_data[fk.replace("_id", "") + "_id"] = val
        validated_data = self._ensure_value_calculated(validated_data)
        return super().update(instance, validated_data)

    def _present_master_obj(self, master_obj):
        if master_obj is None:
            return None
        try:
            obj_id = getattr(master_obj, "id", None) or master_obj
            name = getattr(master_obj, "name", None) or getattr(master_obj, "item_name", None)
            return {"id": str(obj_id), "name": name}
        except Exception:
            return {"id": str(master_obj), "name": None}

    def get_account(self, obj):
        """Present account as an object with id and account_name"""
        account = getattr(obj, "account", None)
        if account is None:
            return None
        try:
            return {
                "id": str(account.id),
                "account_name": account.account_name,
                "name": account.account_name,
            }
        except Exception:
            return {"id": str(account), "account_name": None, "name": None}

    def get_item_name_fk(self, obj):
        return self._present_master_obj(getattr(obj, "item_name_fk", None))

    def get_stamp_fk(self, obj):
        return self._present_master_obj(getattr(obj, "stamp_fk", None))

    def get_size_fk(self, obj):
        return self._present_master_obj(getattr(obj, "size_fk", None))

    def get_source_draft(self, obj):
        """Return source draft with receipt voucher details"""
        draft = getattr(obj, "source_draft", None)
        if draft is None:
            return None
        try:
            receipt_data = None
            if draft.receipt_voucher:
                receipt_data = {
                    "id": str(draft.receipt_voucher.id),
                    "voucher_no": draft.receipt_voucher.voucher_no,
                    "date": draft.receipt_voucher.date.isoformat() if draft.receipt_voucher.date else None,
                    "amount": str(draft.receipt_voucher.cr) if draft.receipt_voucher.cr else None,
                    "balance": str(draft.receipt_voucher.balance) if draft.receipt_voucher.balance else None,
                    "narration": draft.receipt_voucher.narration,
                }
                # Get payment mode from debit entries (Cash/Bank)
                if draft.receipt_voucher.debit_entries.exists():
                    first_debit = draft.receipt_voucher.debit_entries.first()
                    if first_debit and first_debit.party:
                        receipt_data["payment_mode"] = first_debit.party.account_name or first_debit.party.name
                        receipt_data["party_id"] = str(first_debit.party.id)

            return {
                "id": str(draft.id),
                "status": draft.status,
                "advance_amount": str(draft.advance_amount) if draft.advance_amount else None,
                "advance_notes": draft.advance_notes,
                "receipt_voucher": receipt_data,
                "created_at": draft.created_at.isoformat() if draft.created_at else None,
                "confirmed_at": draft.confirmed_at.isoformat() if draft.confirmed_at else None,
                "sales_query_id": str(draft.sales_query_id) if draft.sales_query_id else None,
            }
        except Exception:
            return {"id": str(draft), "status": None}

    def get_sales_query_id(self, obj):
        """Return sales query ID only if the linked query still exists"""
        draft = getattr(obj, "source_draft", None)
        if not draft or not draft.sales_query_id:
            return None
        try:
            from sales_queries.models import SalesQuery
            if SalesQuery.objects.filter(id=draft.sales_query_id).exists():
                return str(draft.sales_query_id)
        except Exception:
            pass
        return None

    def get_sale_id(self, obj):
        """Return sale ID from source draft"""
        draft = getattr(obj, "source_draft", None)
        if draft and draft.source_sale:
            return str(draft.source_sale.id)
        return None

    def get_order_data(self, obj):
        """Return order_data from source draft with all workflow stage data"""
        draft = getattr(obj, "source_draft", None)
        if draft and draft.order_data:
            return draft.order_data
        return None

    def validate(self, data):
        """
        Custom validation to ensure Order ID (bill_no) is not accepted from request payload.
        Order ID must be auto-generated by the system.
        """
        if "bill_no" in data and data["bill_no"]:
            raise serializers.ValidationError(
                {
                    "bill_no": "Order ID (bill_no) cannot be provided in request. It will be auto-generated based on order_type."
                }
            )
        return data

    def _ensure_value_calculated(self, data: dict):
        # Ensure wt, rate_item and discount are present as numbers
        try:
            wt = data.get("wt") or 0
            rate = data.get("rate_item") or data.get("rate") or 0
            discount = data.get("discount") or 0
            # Convert to Decimal-aware calculation if present
            value = float(wt) * float(rate)
            value = value - (value * float(discount) / 100.0)
            data["value_item"] = round(value, 2)
        except Exception:
            # If anything goes wrong, don't block creation; leave value_item as-is
            pass
        return data


# Backwards compatibility: keep the old serializer name for existing imports
VoucherSerializer = OrderSerializer


from .models import Archives


class ArchivesSerializer(OrderSerializer):
    """Serializer for archived orders. Inherits field definitions from OrderSerializer
    but binds to the Archives model so the same payload shape can be used for both.
    """

    class Meta(OrderSerializer.Meta):
        model = Archives

    def create(self, validated_data):
        # The Order serializer accepts several order-line fields (wt, unit,
        # rate_item, discount, value_item, pc) and write-only FK aliases
        # which do not exist on the Archives model. Remove any of those
        # keys so Model.objects.create(...) doesn't receive unexpected
        # keyword arguments and raise a TypeError.
        for fk in (
            "item_name_fk_id",
            "stamp_fk_id",
            "size_fk_id",
            "item_name_fk",
            "stamp_fk",
            "size_fk",
            "pc",
            "wt",
            "unit",
            "rate_item",
            "discount",
            "value_item",
            "order_type",  # Archives model doesn't have order_type field
        ):
            validated_data.pop(fk, None)
        # Use ModelSerializer.create to instantiate the Archives model with
        # only the fields that actually exist on Archives.
        return serializers.ModelSerializer.create(self, validated_data)

    def update(self, instance, validated_data):
        for fk in (
            "item_name_fk_id",
            "stamp_fk_id",
            "size_fk_id",
            "item_name_fk",
            "stamp_fk",
            "size_fk",
            "pc",
            "wt",
            "unit",
            "rate_item",
            "discount",
            "value_item",
            "order_type",  # Archives model doesn't have order_type field
        ):
            validated_data.pop(fk, None)
        return serializers.ModelSerializer.update(self, instance, validated_data)


from .models import Sale


class SaleSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    # Read-only nested representation of account (customer)
    account_details = serializers.SerializerMethodField(read_only=True)
    # Read-only nested representation of selected estimate
    selected_estimate = serializers.SerializerMethodField(read_only=True)
    # Write-only field for setting selected estimate
    selected_estimate_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    # Add bill_no as alias for order_no for UI compatibility
    bill_no = serializers.CharField(source="order_no", read_only=True)
    # Add customer_name as alias for account name for UI compatibility
    customer_name = serializers.SerializerMethodField(read_only=True)
    # Add converted_to_order flag to indicate if sale has been converted
    converted_to_order = serializers.SerializerMethodField(read_only=True)
    # Add order_id if converted
    order_id = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Sale
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
        )

    def get_account_details(self, obj):
        """Return account details including customer name"""
        if obj.account:
            return {
                "id": str(obj.account.id),
                "account_name": obj.account.account_name,
                "name": obj.account.account_name,  # Alias for compatibility
            }
        return None

    def get_customer_name(self, obj):
        """Return customer name directly for easy access"""
        if obj.account:
            return obj.account.account_name
        return None

    def get_converted_to_order(self, obj):
        """Check if this sale has been converted to an order"""
        from vouchers.models import OrderDraft

        return OrderDraft.objects.filter(
            source_sale=obj, status="confirmed", final_order__isnull=False
        ).exists()

    def get_order_id(self, obj):
        """Get the order ID if this sale has been converted"""
        from vouchers.models import OrderDraft

        draft = OrderDraft.objects.filter(
            source_sale=obj, status="confirmed", final_order__isnull=False
        ).first()
        if draft and draft.final_order:
            return str(draft.final_order.id)
        return None

    def get_selected_estimate(self, obj):
        if obj.selected_estimate:
            return {
                "id": str(obj.selected_estimate.id),
                "item_name": obj.selected_estimate.item_name,
                "grand_total": str(obj.selected_estimate.grand_total),
                "status": obj.selected_estimate.status,
            }
        return None

    def create(self, validated_data):
        selected_estimate_id = validated_data.pop("selected_estimate_id", None)
        if selected_estimate_id:
            validated_data["selected_estimate_id"] = selected_estimate_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        selected_estimate_id = validated_data.pop("selected_estimate_id", None)
        if selected_estimate_id is not None:
            validated_data["selected_estimate_id"] = selected_estimate_id
        return super().update(instance, validated_data)


from .models import ApprovalLooseM


class ApprovalLooseMSerializer(serializers.ModelSerializer):
    # Read-only foreign key presentation
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    account = serializers.PrimaryKeyRelatedField(read_only=True)
    item_name = serializers.PrimaryKeyRelatedField(read_only=True)
    stamp = serializers.PrimaryKeyRelatedField(read_only=True)
    unit = serializers.PrimaryKeyRelatedField(read_only=True)

    # Write-only id fields for creating/updating via simple payloads
    account_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    item_name_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    stamp_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    unit_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = ApprovalLooseM
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
        )

    def create(self, validated_data):
        # Move *_id fields into validated_data so model accepts account_id keyword args
        for fk in ("account_id", "item_name_id", "stamp_id", "unit_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().create(validated_data)

    def update(self, instance, validated_data):
        for fk in ("account_id", "item_name_id", "stamp_id", "unit_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().update(instance, validated_data)


from .models import ApprovalTagM


class ApprovalTagMSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    account = serializers.PrimaryKeyRelatedField(read_only=True)
    item_name = serializers.PrimaryKeyRelatedField(read_only=True)
    stamp = serializers.PrimaryKeyRelatedField(read_only=True)
    unit = serializers.PrimaryKeyRelatedField(read_only=True)

    account_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    item_name_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    stamp_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    unit_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = ApprovalTagM
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
        )

    def create(self, validated_data):
        for fk in ("account_id", "item_name_id", "stamp_id", "unit_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().create(validated_data)

    def update(self, instance, validated_data):
        for fk in ("account_id", "item_name_id", "stamp_id", "unit_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().update(instance, validated_data)


from .models import PurAndApprovalM


class PurAndApprovalMSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    account = serializers.PrimaryKeyRelatedField(read_only=True)
    item_name = serializers.PrimaryKeyRelatedField(read_only=True)
    unit = serializers.PrimaryKeyRelatedField(read_only=True)
    shape = serializers.PrimaryKeyRelatedField(read_only=True)

    account_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    item_name_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    unit_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    shape_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = PurAndApprovalM
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
        )

    def create(self, validated_data):
        for fk in ("account_id", "item_name_id", "unit_id", "shape_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().create(validated_data)

    def update(self, instance, validated_data):
        for fk in ("account_id", "item_name_id", "unit_id", "shape_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().update(instance, validated_data)


from .models import PurReturn


class PurReturnSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    account = serializers.PrimaryKeyRelatedField(read_only=True)
    item_name = serializers.PrimaryKeyRelatedField(read_only=True)
    stamp = serializers.PrimaryKeyRelatedField(read_only=True)
    unit = serializers.PrimaryKeyRelatedField(read_only=True)
    shape = serializers.PrimaryKeyRelatedField(read_only=True)
    clarity = serializers.PrimaryKeyRelatedField(read_only=True)

    account_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    item_name_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    stamp_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    unit_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    shape_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    clarity_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = PurReturn
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
        )

    def create(self, validated_data):
        # Move *_id fields into validated_data so model accepts account_id keyword args
        for fk in ("account_id", "item_name_id", "stamp_id", "unit_id", "shape_id", "clarity_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().create(validated_data)

    def update(self, instance, validated_data):
        for fk in ("account_id", "item_name_id", "stamp_id", "unit_id", "shape_id", "clarity_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().update(instance, validated_data)


from .models import Receive


class ReceiveSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    # Present related masters as small objects so frontend can show human-readable names
    account = serializers.SerializerMethodField(read_only=True)
    item_name = serializers.SerializerMethodField(read_only=True)
    stamp = serializers.SerializerMethodField(read_only=True)
    unit = serializers.SerializerMethodField(read_only=True)

    account_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    item_name_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    stamp_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    unit_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Receive
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
        )

    def create(self, validated_data):
        # Move *_id fields into validated_data so model accepts account_id keyword args
        for fk in ("account_id", "item_name_id", "stamp_id", "unit_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().create(validated_data)

    def update(self, instance, validated_data):
        for fk in ("account_id", "item_name_id", "stamp_id", "unit_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().update(instance, validated_data)

    def _present_master_obj(self, master_obj):
        if master_obj is None:
            return None
        try:
            obj_id = getattr(master_obj, "id", None) or master_obj
            # Try common name attributes
            name = (
                getattr(master_obj, "name", None)
                or getattr(master_obj, "item_name", None)
                or getattr(master_obj, "account_name", None)
            )
            return {"id": str(obj_id), "name": name}
        except Exception:
            return {"id": str(master_obj), "name": None}

    def get_account(self, obj):
        return self._present_master_obj(getattr(obj, "account", None))

    def get_item_name(self, obj):
        return self._present_master_obj(getattr(obj, "item_name", None))

    def get_stamp(self, obj):
        return self._present_master_obj(getattr(obj, "stamp", None))

    def get_unit(self, obj):
        return self._present_master_obj(getattr(obj, "unit", None))


from .models import SalesReturn


class SalesReturnSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    account = serializers.PrimaryKeyRelatedField(read_only=True)
    item_name = serializers.PrimaryKeyRelatedField(read_only=True)
    stamp = serializers.PrimaryKeyRelatedField(read_only=True)
    unit = serializers.PrimaryKeyRelatedField(read_only=True)
    shape = serializers.PrimaryKeyRelatedField(read_only=True)
    clarity = serializers.PrimaryKeyRelatedField(read_only=True)

    account_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    item_name_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    stamp_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    unit_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    shape_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    clarity_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = SalesReturn
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
        )

    def create(self, validated_data):
        for fk in ("account_id", "item_name_id", "stamp_id", "unit_id", "shape_id", "clarity_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().create(validated_data)

    def update(self, instance, validated_data):
        for fk in ("account_id", "item_name_id", "stamp_id", "unit_id", "shape_id", "clarity_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().update(instance, validated_data)


from .models import PurchaseDiamond


class PurchaseDiamondSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    account = serializers.PrimaryKeyRelatedField(read_only=True)
    item_name = serializers.PrimaryKeyRelatedField(read_only=True)
    shape = serializers.PrimaryKeyRelatedField(read_only=True)
    size = serializers.PrimaryKeyRelatedField(read_only=True)
    colour = serializers.PrimaryKeyRelatedField(read_only=True)
    clarity = serializers.PrimaryKeyRelatedField(read_only=True)
    lab = serializers.PrimaryKeyRelatedField(read_only=True)
    proof_image_url = serializers.SerializerMethodField()

    account_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    item_name_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    shape_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    size_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    colour_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    clarity_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    lab_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    def get_proof_image_url(self, obj):
        if obj.proof_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.proof_image.url)
        return None

    class Meta:
        model = PurchaseDiamond
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
        )

    def create(self, validated_data):
        for fk in (
            "account_id",
            "item_name_id",
            "shape_id",
            "size_id",
            "colour_id",
            "clarity_id",
            "lab_id",
        ):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().create(validated_data)

    def update(self, instance, validated_data):
        for fk in (
            "account_id",
            "item_name_id",
            "shape_id",
            "size_id",
            "colour_id",
            "clarity_id",
            "lab_id",
        ):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().update(instance, validated_data)


from .models import PurchaseM


class PurchaseMSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    account = serializers.PrimaryKeyRelatedField(read_only=True)
    item_name = serializers.PrimaryKeyRelatedField(read_only=True)
    stamp = serializers.PrimaryKeyRelatedField(read_only=True)
    unit = serializers.PrimaryKeyRelatedField(read_only=True)
    proof_image_url = serializers.SerializerMethodField()

    account_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    item_name_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    stamp_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    unit_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    def get_proof_image_url(self, obj):
        if obj.proof_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.proof_image.url)
        return None

    class Meta:
        model = PurchaseM
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
        )

    def create(self, validated_data):
        for fk in ("account_id", "item_name_id", "stamp_id", "unit_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().create(validated_data)

    def update(self, instance, validated_data):
        for fk in ("account_id", "item_name_id", "stamp_id", "unit_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().update(instance, validated_data)


from .models import PurchaseTagwiseM


class PurchaseTagwiseMSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    account = serializers.PrimaryKeyRelatedField(read_only=True)
    item_name = serializers.PrimaryKeyRelatedField(read_only=True)
    stamp = serializers.PrimaryKeyRelatedField(read_only=True)
    unit = serializers.PrimaryKeyRelatedField(read_only=True)
    proof_image_url = serializers.SerializerMethodField()

    account_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    item_name_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    stamp_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    unit_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    def get_proof_image_url(self, obj):
        if obj.proof_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.proof_image.url)
        return None

    class Meta:
        model = PurchaseTagwiseM
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
        )

    def create(self, validated_data):
        for fk in ("account_id", "item_name_id", "stamp_id", "unit_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().create(validated_data)

    def update(self, instance, validated_data):
        for fk in ("account_id", "item_name_id", "stamp_id", "unit_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().update(instance, validated_data)


from .models import Repair


class RepairSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    account = serializers.PrimaryKeyRelatedField(read_only=True)
    item_name = serializers.PrimaryKeyRelatedField(read_only=True)
    stamp = serializers.PrimaryKeyRelatedField(read_only=True)

    account_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    item_name_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    stamp_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Repair
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
        )

    def create(self, validated_data):
        for fk in ("account_id", "item_name_id", "stamp_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().create(validated_data)

    def update(self, instance, validated_data):
        for fk in ("account_id", "item_name_id", "stamp_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().update(instance, validated_data)


from .models import PaymentEntry


class PaymentEntrySerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    # Present account/party/sub_account as small objects so frontend can show human-readable names
    account = serializers.SerializerMethodField(read_only=True)
    party = serializers.SerializerMethodField(read_only=True)
    sub_account = serializers.SerializerMethodField(read_only=True)
    proof_image_url = serializers.SerializerMethodField()

    account_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    party_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    sub_account_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    def get_proof_image_url(self, obj):
        if obj.proof_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.proof_image.url)
        return None

    class Meta:
        model = PaymentEntry
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
        )

    def create(self, validated_data):
        for fk in ("account_id", "party_id", "sub_account_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().create(validated_data)

    def update(self, instance, validated_data):
        for fk in ("account_id", "party_id", "sub_account_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().update(instance, validated_data)

    def _present_account_obj(self, acct):
        if acct is None:
            return None
        try:
            acct_id = getattr(acct, "id", None) or acct
            name = (
                getattr(acct, "account_name", None)
                or getattr(acct, "name", None)
                or getattr(acct, "sub_account_name", None)
            )
            return {"id": str(acct_id), "name": name}
        except Exception:
            return {"id": str(acct), "name": None}

    def get_account(self, obj):
        return self._present_account_obj(getattr(obj, "account", None))

    def get_party(self, obj):
        return self._present_account_obj(getattr(obj, "party", None))

    def get_sub_account(self, obj):
        return self._present_account_obj(getattr(obj, "sub_account", None))


from .models import JournalEntry


class JournalEntrySerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    account = serializers.SerializerMethodField(read_only=True)
    party = serializers.SerializerMethodField(read_only=True)
    sub_account = serializers.SerializerMethodField(read_only=True)

    account_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    party_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    sub_account_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = JournalEntry
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
        )

    def create(self, validated_data):
        for fk in ("account_id", "party_id", "sub_account_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().create(validated_data)

    def update(self, instance, validated_data):
        for fk in ("account_id", "party_id", "sub_account_id"):
            val = validated_data.pop(fk, None)
            if val is not None:
                validated_data[fk] = val
        return super().update(instance, validated_data)

    def _present_account_obj(self, acct):
        if acct is None:
            return None
        try:
            acct_id = getattr(acct, "id", None) or acct
            name = (
                getattr(acct, "account_name", None)
                or getattr(acct, "name", None)
                or getattr(acct, "sub_account_name", None)
            )
            return {"id": str(acct_id), "name": name}
        except Exception:
            return {"id": str(acct), "name": None}

    def get_account(self, obj):
        return self._present_account_obj(getattr(obj, "account", None))

    def get_party(self, obj):
        return self._present_account_obj(getattr(obj, "party", None))

    def get_sub_account(self, obj):
        return self._present_account_obj(getattr(obj, "sub_account", None))


from .models import Receipt, ReceiptDebitEntry


def _account_obj(acct):
    if acct is None:
        return None
    try:
        name = getattr(acct, "account_name", None) or getattr(acct, "name", None)
        return {"id": str(acct.id), "name": name, "account_name": name}
    except Exception:
        return {"id": str(acct), "name": None, "account_name": None}


class ReceiptDebitEntrySerializer(serializers.ModelSerializer):
    party = serializers.SerializerMethodField(read_only=True)
    party_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = ReceiptDebitEntry
        fields = ["id", "party", "party_id", "balance", "dr", "narration", "order"]
        read_only_fields = ("id",)

    def get_party(self, obj):
        return _account_obj(getattr(obj, "party", None))


class ReceiptSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    party_name = serializers.SerializerMethodField(read_only=True)
    party_name_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    debit_entries = ReceiptDebitEntrySerializer(many=True, required=False)

    class Meta:
        model = Receipt
        fields = [
            "id",
            "company",
            "voucher_no",
            "series",
            "date",
            "party_name",
            "party_name_id",
            "cr",
            "balance",
            "narration",
            "debit_entries",
            "type",
            "dr",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = ("id", "created_at", "updated_at", "created_by", "updated_by", "company")

    def get_party_name(self, obj):
        return _account_obj(getattr(obj, "party_name", None))

    def create(self, validated_data):
        debit_entries_data = validated_data.pop("debit_entries", [])
        party_name_id = validated_data.pop("party_name_id", None)
        if party_name_id is not None:
            validated_data["party_name_id"] = party_name_id
        receipt = super().create(validated_data)
        for i, entry in enumerate(debit_entries_data):
            party_id = entry.pop("party_id", None)
            ReceiptDebitEntry.objects.create(
                receipt=receipt,
                party_id=party_id,
                order=entry.get("order", i),
                balance=entry.get("balance"),
                dr=entry.get("dr"),
                narration=entry.get("narration", ""),
            )
        return receipt

    def update(self, instance, validated_data):
        debit_entries_data = validated_data.pop("debit_entries", None)
        party_name_id = validated_data.pop("party_name_id", None)
        if party_name_id is not None:
            validated_data["party_name_id"] = party_name_id
        instance = super().update(instance, validated_data)
        if debit_entries_data is not None:
            instance.debit_entries.all().delete()
            for i, entry in enumerate(debit_entries_data):
                party_id = entry.pop("party_id", None)
                ReceiptDebitEntry.objects.create(
                    receipt=instance,
                    party_id=party_id,
                    order=entry.get("order", i),
                    balance=entry.get("balance"),
                    dr=entry.get("dr"),
                    narration=entry.get("narration", ""),
                )
        return instance


from .models import EstimateVoucher, EstimateLineItem


# ---------------------------------------------------------------------------
# Payment Voucher serializers
# ---------------------------------------------------------------------------

from .models import (
    PaymentVoucher,
    PaymentCreditEntry,
    JournalVoucher,
    JournalCreditEntry,
    ContraVoucher,
    ContraCreditEntry,
    VoucherSequence,
)


class PaymentCreditEntrySerializer(serializers.ModelSerializer):
    party = serializers.SerializerMethodField(read_only=True)
    party_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = PaymentCreditEntry
        fields = ["id", "party", "party_id", "balance", "cr", "narration", "order"]
        read_only_fields = ("id",)

    def get_party(self, obj):
        return _account_obj(getattr(obj, "party", None))


class PaymentVoucherSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    party_name = serializers.SerializerMethodField(read_only=True)
    party_name_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    credit_entries = PaymentCreditEntrySerializer(many=True, required=False)

    class Meta:
        model = PaymentVoucher
        fields = [
            "id",
            "company",
            "voucher_no",
            "series",
            "date",
            "party_name",
            "party_name_id",
            "dr",
            "balance",
            "narration",
            "credit_entries",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = ("id", "created_at", "updated_at", "created_by", "updated_by", "company")

    def get_party_name(self, obj):
        return _account_obj(getattr(obj, "party_name", None))

    def create(self, validated_data):
        entries = validated_data.pop("credit_entries", [])
        party_name_id = validated_data.pop("party_name_id", None)
        if party_name_id is not None:
            validated_data["party_name_id"] = party_name_id
        voucher = super().create(validated_data)
        for i, e in enumerate(entries):
            party_id = e.pop("party_id", None)
            PaymentCreditEntry.objects.create(
                payment=voucher,
                party_id=party_id,
                order=e.get("order", i),
                balance=e.get("balance"),
                cr=e.get("cr"),
                narration=e.get("narration", ""),
            )
        return voucher

    def update(self, instance, validated_data):
        entries = validated_data.pop("credit_entries", None)
        party_name_id = validated_data.pop("party_name_id", None)
        if party_name_id is not None:
            validated_data["party_name_id"] = party_name_id
        instance = super().update(instance, validated_data)
        if entries is not None:
            instance.credit_entries.all().delete()
            for i, e in enumerate(entries):
                party_id = e.pop("party_id", None)
                PaymentCreditEntry.objects.create(
                    payment=instance,
                    party_id=party_id,
                    order=e.get("order", i),
                    balance=e.get("balance"),
                    cr=e.get("cr"),
                    narration=e.get("narration", ""),
                )
        return instance


# ---------------------------------------------------------------------------
# Journal Voucher serializers
# ---------------------------------------------------------------------------


class JournalCreditEntrySerializer(serializers.ModelSerializer):
    party = serializers.SerializerMethodField(read_only=True)
    party_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = JournalCreditEntry
        fields = ["id", "party", "party_id", "balance", "cr", "narration", "order"]
        read_only_fields = ("id",)

    def get_party(self, obj):
        return _account_obj(getattr(obj, "party", None))


class JournalVoucherSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    party_name = serializers.SerializerMethodField(read_only=True)
    party_name_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    credit_entries = JournalCreditEntrySerializer(many=True, required=False)

    class Meta:
        model = JournalVoucher
        fields = [
            "id",
            "company",
            "voucher_no",
            "series",
            "date",
            "party_name",
            "party_name_id",
            "dr",
            "balance",
            "narration",
            "credit_entries",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = ("id", "created_at", "updated_at", "created_by", "updated_by", "company")

    def get_party_name(self, obj):
        return _account_obj(getattr(obj, "party_name", None))

    def create(self, validated_data):
        entries = validated_data.pop("credit_entries", [])
        party_name_id = validated_data.pop("party_name_id", None)
        if party_name_id is not None:
            validated_data["party_name_id"] = party_name_id
        voucher = super().create(validated_data)
        for i, e in enumerate(entries):
            party_id = e.pop("party_id", None)
            JournalCreditEntry.objects.create(
                journal=voucher,
                party_id=party_id,
                order=e.get("order", i),
                balance=e.get("balance"),
                cr=e.get("cr"),
                narration=e.get("narration", ""),
            )
        return voucher

    def update(self, instance, validated_data):
        entries = validated_data.pop("credit_entries", None)
        party_name_id = validated_data.pop("party_name_id", None)
        if party_name_id is not None:
            validated_data["party_name_id"] = party_name_id
        instance = super().update(instance, validated_data)
        if entries is not None:
            instance.credit_entries.all().delete()
            for i, e in enumerate(entries):
                party_id = e.pop("party_id", None)
                JournalCreditEntry.objects.create(
                    journal=instance,
                    party_id=party_id,
                    order=e.get("order", i),
                    balance=e.get("balance"),
                    cr=e.get("cr"),
                    narration=e.get("narration", ""),
                )
        return instance


# ---------------------------------------------------------------------------
# Contra Voucher serializers
# ---------------------------------------------------------------------------


class ContraCreditEntrySerializer(serializers.ModelSerializer):
    party_display = serializers.SerializerMethodField()

    party_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    party = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ContraCreditEntry
        fields = ["id", "party", "party_id", "party_display", "balance", "cr", "narration", "order"]
        read_only_fields = ("id",)

    def get_party_display(self, obj):
        if obj.party:
            return obj.party.account_name
        return ""

    def get_party(self, obj):
        if obj.party:
            return {"id": str(obj.party.id), "name": obj.party.account_name}
        return None


class ContraVoucherSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    credit_entries = ContraCreditEntrySerializer(many=True, required=False)
    party_name_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    party_name = serializers.SerializerMethodField(read_only=True)
    party_name_display = serializers.SerializerMethodField(read_only=True)
    created_by_name = serializers.SerializerMethodField()
    total_cr = serializers.SerializerMethodField()

    class Meta:
        model = ContraVoucher
        fields = [
            "id",
            "company",
            "voucher_no",
            "series",
            "date",
            "party_name",
            "party_name_id",
            "party_name_display",
            "dr",
            "balance",
            "narration",
            "credit_entries",
            "total_cr",
            "created_by",
            "created_by_name",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "created_at", "updated_at", "created_by", "updated_by", "company")

    def get_party_name_display(self, obj):
        if obj.party_name:
            return obj.party_name.account_name
        return ""

    def get_party_name(self, obj):
        if obj.party_name:
            return {"id": str(obj.party_name.id), "name": obj.party_name.account_name}
        return None

    def get_created_by_name(self, obj):
        user = getattr(obj, "created_by", None)
        if not user:
            return None
        return getattr(user, "name", None) or getattr(user, "username", None)

    def get_total_cr(self, obj):
        entries = obj.credit_entries.all()
        return float(sum(e.cr or 0 for e in entries))

    def create(self, validated_data):
        entries = validated_data.pop("credit_entries", [])

        voucher = super().create(validated_data)
        for i, e in enumerate(entries):
            party_id = e.get("party_id")
            ContraCreditEntry.objects.create(
                contra=voucher,
                party_id=party_id,
                order=e.get("order", i),
                balance=e.get("balance"),
                cr=e.get("cr"),
                narration=e.get("narration", ""),
            )
        return voucher

    def update(self, instance, validated_data):
        entries = validated_data.pop("credit_entries", None)
        instance = super().update(instance, validated_data)
        if entries is not None:
            instance.credit_entries.all().delete()
            for i, e in enumerate(entries):
                party_id = e.get("party_id")
                ContraCreditEntry.objects.create(
                    contra=instance,
                    party_id=party_id,
                    order=e.get("order", i),
                    balance=e.get("balance"),
                    cr=e.get("cr"),
                    narration=e.get("narration", ""),
                )
        return instance


class EstimateLineItemSerializer(serializers.ModelSerializer):
    """Serializer for estimate line items."""

    class Meta:
        model = EstimateLineItem
        fields = [
            "id",
            "particulars",
            "shape",
            "colour",
            "clarity",
            "pc",
            "weight",
            "unit",
            "rate",
            "amount",
            "order",
            "is_compulsory",
            "raw_material",
        ]
        read_only_fields = ("id",)


class EstimateVoucherSerializer(serializers.ModelSerializer):
    """Serializer for estimate vouchers with nested line items."""

    company = serializers.PrimaryKeyRelatedField(read_only=True)
    # Present account as an object with id and name for frontend display
    account = serializers.SerializerMethodField(read_only=True)
    # Write-only field to accept account UUID when creating/updating
    account_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    # Sub account field for detailed customer tracking
    sub_account_record = serializers.SerializerMethodField(read_only=True)
    sub_account_record_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    # Sales query link for multiple estimates per query
    sales_query_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    sales_query = serializers.SerializerMethodField(read_only=True)
    # Sale link for estimates created from Sale form
    sale_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    sale = serializers.SerializerMethodField(read_only=True)

    # Nested line items
    line_items = EstimateLineItemSerializer(many=True)
    # Add product image URL serialization
    product_image_url = serializers.SerializerMethodField()

    class Meta:
        model = EstimateVoucher
        fields = [
            "id",
            "company",
            "account",
            "account_id",
            "sub_account_record",
            "sub_account_record_id",
            "sales_query",
            "sales_query_id",
            "sale",
            "sale_id",
            "item_name",
            "date",
            "line_items",
            "total_taxable_value",
            "gst_amount",
            "grand_total",
            "status",
            "is_archived",
            "product_image",
            "product_image_url",
            "sub_account",
            "phone_number",
            "sales_person_name",
            "nsj_representative",
            "expiry_date",
            "jewellery_type",
            "gold_quality",
            "size_details",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
        )

    def get_account(self, obj):
        """Present account as an object with id and account_name"""
        account = getattr(obj, "account", None)
        if account is None:
            return None
        try:
            return {
                "id": str(account.id),
                "account_name": account.account_name,
                "name": account.account_name,
            }
        except Exception:
            return {"id": str(account), "account_name": None, "name": None}

    def get_sales_query(self, obj):
        """Present sales_query as an object with id and basic info"""
        sales_query = getattr(obj, "sales_query", None)
        if sales_query is None:
            return None
        try:
            return {
                "id": str(sales_query.id),
                "jewellery_type": sales_query.jewellery_type,
                "workflow_status": sales_query.workflow_status,
            }
        except Exception:
            return {"id": str(sales_query), "jewellery_type": None, "workflow_status": None}

    def get_sub_account_record(self, obj):
        """Present sub_account_record as an object with id and name"""
        sub_account = getattr(obj, "sub_account_record", None)
        if sub_account is None:
            return None
        try:
            return {
                "id": str(sub_account.id),
                "sub_account_name": sub_account.sub_account_name,
                "name": sub_account.sub_account_name,
            }
        except Exception:
            return {"id": str(sub_account), "sub_account_name": None, "name": None}

    def get_product_image_url(self, obj):
        """Return the absolute URL for the product image"""
        if obj.product_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.product_image.url)
            return obj.product_image.url
        return None

    def get_sale(self, obj):
        """Present sale as an object with id and basic info"""
        sale = getattr(obj, "sale", None)
        if sale is None:
            return None
        try:
            return {
                "id": str(sale.id),
                "item_name": sale.item_name,
                "order_no": sale.order_no,
            }
        except Exception:
            return {"id": str(sale), "item_name": None, "order_no": None}

    def validate(self, data):
        """Validate estimate data."""
        # Only validate line_items if they're being provided in the request
        # This allows PATCH requests to update status/archive without providing line_items
        if "line_items" not in data:
            return data

        line_items = data.get("line_items", [])

        # Requirement 7.1: At least one line item is required (when line_items are being updated)
        if not line_items:
            raise serializers.ValidationError({"line_items": "At least one line item is required"})

        # Requirement 7.2: Line items with Weight and Rate must have Particulars
        for idx, item in enumerate(line_items):
            weight = item.get("weight")
            rate = item.get("rate")
            particulars = item.get("particulars", "").strip()
            amount = item.get("amount")

            if (weight is not None or rate is not None) and not particulars:
                raise serializers.ValidationError(
                    {
                        "line_items": f"Line item {idx + 1}: Particulars field is required for line items with weight and rate"
                    }
                )

            # Requirement 7.3: Allow submission if Amount is provided even without Weight or Rate
            if not particulars and amount is None:
                raise serializers.ValidationError(
                    {
                        "line_items": f"Line item {idx + 1}: Either provide Weight and Rate, or enter Amount directly"
                    }
                )

        return data

    def create(self, validated_data):
        """Create estimate with nested line items."""
        line_items_data = validated_data.pop("line_items")

        # Handle account_id
        account_id = validated_data.pop("account_id", None)
        if account_id is not None:
            validated_data["account_id"] = account_id

        # Handle sub_account_record_id
        sub_account_record_id = validated_data.pop("sub_account_record_id", None)
        if sub_account_record_id is not None:
            validated_data["sub_account_record_id"] = sub_account_record_id

        # Handle sales_query_id
        sales_query_id = validated_data.pop("sales_query_id", None)
        if sales_query_id is not None:
            validated_data["sales_query_id"] = sales_query_id

        # Handle sale_id
        sale_id = validated_data.pop("sale_id", None)
        if sale_id is not None:
            validated_data["sale_id"] = sale_id

        # Gold Quality: Just use the gold_quality text field (supports both dropdown and custom)
        # Remove gold_quality_master_id if provided since we're using hardcoded values
        validated_data.pop("gold_quality_master_id", None)

        estimate = EstimateVoucher.objects.create(**validated_data)

        # Create line items
        for idx, item_data in enumerate(line_items_data):
            item_data["order"] = idx
            EstimateLineItem.objects.create(estimate=estimate, **item_data)

        return estimate

    def update(self, instance, validated_data):
        """Update estimate and its line items."""
        line_items_data = validated_data.pop("line_items", None)

        # Handle account_id
        account_id = validated_data.pop("account_id", None)
        if account_id is not None:
            validated_data["account_id"] = account_id

        # Handle sub_account_record_id
        sub_account_record_id = validated_data.pop("sub_account_record_id", None)
        if sub_account_record_id is not None:
            validated_data["sub_account_record_id"] = sub_account_record_id

        # Gold Quality: Just use the gold_quality text field (supports both dropdown and custom)
        # Remove gold_quality_master_id if provided since we're using hardcoded values
        validated_data.pop("gold_quality_master_id", None)

        # Update estimate fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update line items if provided
        if line_items_data is not None:
            # Delete existing line items
            instance.line_items.all().delete()

            # Create new line items
            for idx, item_data in enumerate(line_items_data):
                item_data["order"] = idx
                EstimateLineItem.objects.create(estimate=instance, **item_data)

        return instance


from .models import RawMaterialPurchase


class RawMaterialPurchaseSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    supplier = serializers.SerializerMethodField(read_only=True)
    material_type = serializers.SerializerMethodField(read_only=True)
    shape = serializers.SerializerMethodField(read_only=True)
    colour = serializers.SerializerMethodField(read_only=True)
    clarity = serializers.SerializerMethodField(read_only=True)
    lab = serializers.SerializerMethodField(read_only=True)
    proof_image_url = serializers.SerializerMethodField()

    # Enhanced FK fields for new master tables
    gemstone_type_fk = serializers.SerializerMethodField(read_only=True)
    gemstone_shape_fk = serializers.SerializerMethodField(read_only=True)
    gemstone_color_fk = serializers.SerializerMethodField(read_only=True)
    gemstone_clarity_fk = serializers.SerializerMethodField(read_only=True)
    gemstone_treatment_fk = serializers.SerializerMethodField(read_only=True)
    origin_fk = serializers.SerializerMethodField(read_only=True)

    supplier_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    material_type_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    shape_id = serializers.CharField(write_only=True, required=False, allow_null=True)
    colour_id = serializers.CharField(write_only=True, required=False, allow_null=True)
    clarity_id = serializers.CharField(write_only=True, required=False, allow_null=True)
    lab_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    # Enhanced FK write-only fields
    gemstone_type_fk_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    gemstone_shape_fk_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    gemstone_color_fk_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    gemstone_clarity_fk_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    gemstone_treatment_fk_id = serializers.UUIDField(
        write_only=True, required=False, allow_null=True
    )
    origin_fk_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    # Cut / Polish / Symmetry FK fields
    cut_fk = serializers.SerializerMethodField(read_only=True)
    pol_fk = serializers.SerializerMethodField(read_only=True)
    sym_fk = serializers.SerializerMethodField(read_only=True)
    cut_fk_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    pol_fk_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    sym_fk_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    # Master size FK field
    master_size_fk = serializers.SerializerMethodField(read_only=True)
    master_size_fk_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    # Gemstone lab FK field
    gemstone_lab_fk = serializers.SerializerMethodField(read_only=True)
    gemstone_lab_fk_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    # Custom field to handle kt_value string conversion
    kt_value = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    def validate_kt_value(self, value):
        """
        Custom validation for kt_value field to handle string inputs from UI.
        Converts gold purity strings like '24K' to integers like 24.
        """
        if value is None or value == "" or value == "null":
            return None

        # If it's already an integer, return it
        if isinstance(value, int):
            return value

        # If it's a string, try to convert it
        if isinstance(value, str):
            # Handle gold purity strings like '24K', '22K', etc.
            purity_mapping = {
                "24K": 24,
                "24k": 24,
                "24": 24,
                "22K": 22,
                "22k": 22,
                "22": 22,
                "18K": 18,
                "18k": 18,
                "18": 18,
                "14K": 14,
                "14k": 14,
                "14": 14,
                "10K": 10,
                "10k": 10,
                "10": 10,
            }

            # Try direct mapping first
            if value in purity_mapping:
                return purity_mapping[value]

            # Try to extract number from string like '24K' -> 24
            import re

            match = re.search(r"(\d+)", value)
            if match:
                try:
                    return int(match.group(1))
                except ValueError:
                    pass

        # If it's a float, try to convert to int
        if isinstance(value, float):
            if value.is_integer():
                return int(value)
            else:
                raise serializers.ValidationError("KT value must be a whole number.")

        # If we can't convert it, raise validation error
        raise serializers.ValidationError(
            f"Invalid KT value '{value}'. Expected integer (24, 22, 18) or string ('24K', '22K', '18K')."
        )

    def get_proof_image_url(self, obj):
        if obj.proof_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.proof_image.url)
        return None

    def get_supplier(self, obj):
        if obj.supplier is None:
            return None
        try:
            return {
                "id": str(obj.supplier.id),
                "name": obj.supplier.account_name or obj.supplier.name or str(obj.supplier.id),
            }
        except Exception:
            return {"id": str(obj.supplier), "name": None}

    def get_material_type(self, obj):
        if obj.material_type is None:
            return None
        try:
            return {
                "id": str(obj.material_type.id),
                "name": obj.material_type.name,
            }
        except Exception:
            return {"id": str(obj.material_type), "name": None}

    def get_shape(self, obj):
        if obj.shape is None:
            return None
        try:
            return {
                "id": str(obj.shape.id),
                "name": obj.shape.name,
            }
        except Exception:
            return {"id": str(obj.shape), "name": None}

    def get_colour(self, obj):
        if obj.colour is None:
            return None
        try:
            return {
                "id": str(obj.colour.id),
                "name": obj.colour.name,
            }
        except Exception:
            return {"id": str(obj.colour), "name": None}

    def get_clarity(self, obj):
        if obj.clarity is None:
            return None
        try:
            return {
                "id": str(obj.clarity.id),
                "name": obj.clarity.name,
            }
        except Exception:
            return {"id": str(obj.clarity), "name": None}

    def get_lab(self, obj):
        if obj.lab is None:
            return None
        try:
            return {
                "id": str(obj.lab.id),
                "name": obj.lab.name,
            }
        except Exception:
            return {"id": str(obj.lab), "name": None}

    def get_gemstone_type_fk(self, obj):
        if obj.gemstone_type_fk is None:
            return None
        try:
            return {
                "id": str(obj.gemstone_type_fk.id),
                "name": obj.gemstone_type_fk.name,
            }
        except Exception:
            return {"id": str(obj.gemstone_type_fk), "name": None}

    def get_gemstone_shape_fk(self, obj):
        if obj.gemstone_shape_fk is None:
            return None
        try:
            return {
                "id": str(obj.gemstone_shape_fk.id),
                "name": obj.gemstone_shape_fk.name,
            }
        except Exception:
            return {"id": str(obj.gemstone_shape_fk), "name": None}

    def get_gemstone_color_fk(self, obj):
        if obj.gemstone_color_fk is None:
            return None
        try:
            return {
                "id": str(obj.gemstone_color_fk.id),
                "name": obj.gemstone_color_fk.name,
            }
        except Exception:
            return {"id": str(obj.gemstone_color_fk), "name": None}

    def get_gemstone_clarity_fk(self, obj):
        if obj.gemstone_clarity_fk is None:
            return None
        try:
            return {
                "id": str(obj.gemstone_clarity_fk.id),
                "name": obj.gemstone_clarity_fk.name,
            }
        except Exception:
            return {"id": str(obj.gemstone_clarity_fk), "name": None}

    def get_gemstone_treatment_fk(self, obj):
        if obj.gemstone_treatment_fk is None:
            return None
        try:
            return {
                "id": str(obj.gemstone_treatment_fk.id),
                "name": obj.gemstone_treatment_fk.name,
            }
        except Exception:
            return {"id": str(obj.gemstone_treatment_fk), "name": None}

    def get_origin_fk(self, obj):
        if obj.origin_fk is None:
            return None
        try:
            return {
                "id": str(obj.origin_fk.id),
                "name": obj.origin_fk.name,
                "material_type": obj.origin_fk.material_type,
            }
        except Exception:
            return {"id": str(obj.origin_fk), "name": None}

    def _fk_obj(self, obj):
        if obj is None:
            return None
        try:
            return {"id": str(obj.id), "name": obj.name}
        except Exception:
            return None

    def get_cut_fk(self, obj):
        return self._fk_obj(getattr(obj, "cut_fk", None))

    def get_pol_fk(self, obj):
        return self._fk_obj(getattr(obj, "pol_fk", None))

    def get_sym_fk(self, obj):
        return self._fk_obj(getattr(obj, "sym_fk", None))

    def get_master_size_fk(self, obj):
        return self._fk_obj(getattr(obj, "master_size_fk", None))

    def get_gemstone_lab_fk(self, obj):
        return self._fk_obj(getattr(obj, "gemstone_lab_fk", None))

    class Meta:
        model = RawMaterialPurchase
        fields = [
            # Basic fields
            "id",
            "date",
            "supplier",
            "order_id",
            "dia_id",
            "material_type",
            "proof_image_url",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
            # Write-only FK fields
            "supplier_id",
            "material_type_id",
            "shape_id",
            "colour_id",
            "clarity_id",
            "lab_id",
            "gemstone_type_fk_id",
            "gemstone_shape_fk_id",
            "gemstone_color_fk_id",
            "gemstone_clarity_fk_id",
            "gemstone_treatment_fk_id",
            "origin_fk_id",
            "cut_fk_id",
            "pol_fk_id",
            "sym_fk_id",
            "master_size_fk_id",
            "gemstone_lab_fk_id",
            # Enhanced FK fields (read-only)
            "gemstone_type_fk",
            "gemstone_shape_fk",
            "gemstone_color_fk",
            "gemstone_clarity_fk",
            "gemstone_treatment_fk",
            "origin_fk",
            "cut_fk",
            "pol_fk",
            "sym_fk",
            "master_size_fk",
            "gemstone_lab_fk",
            # Common fields for all material types
            "master_size",
            "origin",
            "carat_weight",
            "number_of_pieces",
            "certificate_number",
            "additional_details",
            "size",
            "fluorescence",
            "purchase_budget_total",
            "purchase_budget_per_carat",
            "suggested_supplier",
            # Enhanced fields
            "kt_value",
            "purity_percent",
            "purity_notes",
            "cut_length",
            "cut_width",
            "cut_height",
            "mode_cash",
            "mode_bill",
            "origin_type",
            # NEW MISSING FIELDS - Added based on requirements
            "sieve_size",
            "color_additional_info",
            "gemstone_size_mm",
            # Diamond specific fields (existing)
            "shape",
            "carat",
            "colour",
            "clarity",
            "cut",
            "pol",
            "sym",
            "flouro",
            "lab",
            "cert_no",
            "rap",
            "discount",
            "price_per_ct_usd",
            "exchange_rate",
            "price_per_ct_inr",
            "total",
            # Enhanced diamond fields
            "diamond_number_of_pieces",
            "diamond_additional_details",
            "diamond_size",
            # Gemstone specific fields
            "gemstone_type",
            "gemstone_shape",
            "gemstone_carat_weight",
            "gemstone_number_of_pieces",
            "gemstone_color",
            "gemstone_clarity",
            "gemstone_treatment",
            "gemstone_lab",
            "gemstone_certificate_number",
            "gemstone_additional_details",
            "gemstone_cut",
            "gemstone_size",
            "gemstone_purchase_budget_total",
            "gemstone_purchase_budget_per_carat",
            "gemstone_suggested_supplier",
            # Gold specific fields
            "gold_purity",
            "gold_weight",
            "gold_mode",
            "gold_suggested_supplier",
            # Unified metal fields (Gold, Silver, Platinum)
            "metal_weight_grams",
            "metal_purity",
            "price_per_gram",
            "total_metal_value",
        ]
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
            "dia_id",
            "price_per_ct_inr",
            "total",
        )

    def create(self, validated_data):
        # Handle FK fields - map *_id fields to actual FK fields and resolve instances
        fk_mappings = [
            ("supplier_id", "supplier", "accounts.Account"),
            ("material_type_id", "material_type", "core.MetalTypeMaster"),
            ("shape_id", "shape", "core.ShapeMaster"),
            ("colour_id", "colour", "core.ColourMaster"),
            ("clarity_id", "clarity", "core.ClarityMaster"),
            ("lab_id", "lab", "core.LabMaster"),
            ("gemstone_type_fk_id", "gemstone_type_fk", "core.GemstoneMaster"),
            ("gemstone_shape_fk_id", "gemstone_shape_fk", "core.GemstoneShapeMaster"),
            ("gemstone_color_fk_id", "gemstone_color_fk", "core.GemstoneColorMaster"),
            ("gemstone_clarity_fk_id", "gemstone_clarity_fk", "core.GemstoneClarityMaster"),
            ("gemstone_treatment_fk_id", "gemstone_treatment_fk", "core.GemstoneTreatmentMaster"),
            ("origin_fk_id", "origin_fk", "core.OriginMaster"),
            ("cut_fk_id", "cut_fk", "core.CutMaster"),
            ("pol_fk_id", "pol_fk", "core.PolishMaster"),
            ("sym_fk_id", "sym_fk", "core.SymmetryMaster"),
            ("master_size_fk_id", "master_size_fk", "core.SizeMaster"),
            ("gemstone_lab_fk_id", "gemstone_lab_fk", "core.LabMaster"),
        ]

        for fk_field, model_field, model_path in fk_mappings:
            val = validated_data.pop(fk_field, None)
            if val is not None:
                try:
                    import uuid
                    from django.apps import apps

                    uuid.UUID(str(val))
                    app_label, model_name = model_path.split(".")
                    model_class = apps.get_model(app_label, model_name)
                    instance = model_class.objects.get(id=val)
                    validated_data[model_field] = instance
                except Exception:
                    pass

        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Handle FK fields - map *_id fields to actual FK fields and resolve instances
        fk_mappings = [
            ("supplier_id", "supplier", "accounts.Account"),
            ("material_type_id", "material_type", "core.MetalTypeMaster"),
            ("shape_id", "shape", "core.ShapeMaster"),
            ("colour_id", "colour", "core.ColourMaster"),
            ("clarity_id", "clarity", "core.ClarityMaster"),
            ("lab_id", "lab", "core.LabMaster"),
            ("gemstone_type_fk_id", "gemstone_type_fk", "core.GemstoneMaster"),
            ("gemstone_shape_fk_id", "gemstone_shape_fk", "core.GemstoneShapeMaster"),
            ("gemstone_color_fk_id", "gemstone_color_fk", "core.GemstoneColorMaster"),
            ("gemstone_clarity_fk_id", "gemstone_clarity_fk", "core.GemstoneClarityMaster"),
            ("gemstone_treatment_fk_id", "gemstone_treatment_fk", "core.GemstoneTreatmentMaster"),
            ("origin_fk_id", "origin_fk", "core.OriginMaster"),
            ("cut_fk_id", "cut_fk", "core.CutMaster"),
            ("pol_fk_id", "pol_fk", "core.PolishMaster"),
            ("sym_fk_id", "sym_fk", "core.SymmetryMaster"),
            ("master_size_fk_id", "master_size_fk", "core.SizeMaster"),
            ("gemstone_lab_fk_id", "gemstone_lab_fk", "core.LabMaster"),
        ]

        for fk_field, model_field, model_path in fk_mappings:
            val = validated_data.pop(fk_field, None)
            if val is not None:
                try:
                    import uuid
                    from django.apps import apps

                    uuid.UUID(str(val))
                    app_label, model_name = model_path.split(".")
                    model_class = apps.get_model(app_label, model_name)
                    instance_obj = model_class.objects.get(id=val)
                    validated_data[model_field] = instance_obj
                except Exception:
                    pass

        return super().update(instance, validated_data)


from .models import RawMaterialInventory, RawMaterialIssuance, DailyBookClose, DailyReport


class RawMaterialInventorySerializer(serializers.ModelSerializer):
    purchase_details = serializers.SerializerMethodField()

    def get_purchase_details(self, obj):
        purchase = obj.purchase
        return {
            "id": str(purchase.id),
            "dia_id": purchase.dia_id,
            "date": str(purchase.date) if purchase.date else None,
            "supplier": purchase.supplier.account_name if purchase.supplier else None,
            "material_type": purchase.material_type.name if purchase.material_type else None,
            "shape": purchase.shape.name if purchase.shape else None,
            "colour": purchase.colour.name if purchase.colour else None,
            "clarity": purchase.clarity.name if purchase.clarity else None,
            "cert_no": purchase.cert_no,
            "total": float(purchase.total) if purchase.total else None,
        }

    class Meta:
        model = RawMaterialInventory
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at", "company")


class RawMaterialIssuanceSerializer(serializers.ModelSerializer):
    inventory_details = serializers.SerializerMethodField(read_only=True)
    issued_by_name = serializers.SerializerMethodField(read_only=True)
    inventory = serializers.PrimaryKeyRelatedField(read_only=True)
    job = serializers.PrimaryKeyRelatedField(read_only=True)
    issued_by = serializers.PrimaryKeyRelatedField(read_only=True)

    inventory_id = serializers.UUIDField(write_only=True, required=True)
    job_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    def get_inventory_details(self, obj):
        inv = obj.inventory
        purchase = inv.purchase
        return {
            "id": str(inv.id),
            "dia_id": purchase.dia_id,
            "available_carat": float(inv.available_carat),
            "original_carat": float(inv.original_carat),
        }

    def get_issued_by_name(self, obj):
        return obj.issued_by.name if obj.issued_by else None

    class Meta:
        model = RawMaterialIssuance
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "company",
            "issued_by",
            "inventory",
            "job",
        )

    def validate(self, data):
        inventory_id = data.get("inventory_id")
        issued_carat = data.get("issued_carat")

        if inventory_id and issued_carat:
            try:
                inventory = RawMaterialInventory.objects.get(pk=inventory_id)
                if issued_carat > inventory.available_carat:
                    raise serializers.ValidationError(
                        {
                            "issued_carat": f"Cannot issue {issued_carat} ct. Only {inventory.available_carat} ct available in inventory."
                        }
                    )
            except RawMaterialInventory.DoesNotExist:
                raise serializers.ValidationError({"inventory_id": "Inventory record not found."})

        return data

    def create(self, validated_data):
        inventory_id = validated_data.pop("inventory_id", None)
        job_id = validated_data.pop("job_id", None)

        if inventory_id:
            validated_data["inventory_id"] = inventory_id
        if job_id:
            validated_data["job_id"] = job_id

        return super().create(validated_data)


class DailyBookCloseSerializer(serializers.ModelSerializer):
    closed_by_name = serializers.SerializerMethodField()

    def get_closed_by_name(self, obj):
        return obj.closed_by.name if obj.closed_by else None

    class Meta:
        model = DailyBookClose
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at", "company")


class DailyReportSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    def get_user_name(self, obj):
        return obj.user.name if obj.user else None

    class Meta:
        model = DailyReport
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at", "company", "user")


from .models import ThreeDDesign, ThreeDDesignImage


class ThreeDDesignImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    is_final = serializers.SerializerMethodField()

    class Meta:
        model = ThreeDDesignImage
        fields = [
            "id",
            "image",
            "image_url",
            "field_type",
            "is_final",
            "is_final_design",
            "is_final_approved",
            "log_group",
            "uploaded_at",
            "uploaded_by",
        ]
        read_only_fields = ["id", "uploaded_at"]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def get_is_final(self, obj):
        if obj.field_type == "design":
            return obj.is_final_design
        elif obj.field_type == "approved":
            return obj.is_final_approved
        return False


class ThreeDDesignSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    images = serializers.SerializerMethodField()
    design_image_url = serializers.SerializerMethodField()
    approved_design_image_url = serializers.SerializerMethodField()

    def get_images(self, obj):
        images = obj.images.all()
        serializer = ThreeDDesignImageSerializer(images, many=True, context=self.context)
        return serializer.data

    def get_design_image_url(self, obj):
        if obj.design_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.design_image.url)
        return None

    def get_approved_design_image_url(self, obj):
        if obj.approved_design_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.approved_design_image.url)
        return None

    def update(self, instance, validated_data):
        for img_field in ("design_image", "approved_design_image"):
            if img_field in validated_data and not validated_data[img_field]:
                validated_data.pop(img_field)
        return super().update(instance, validated_data)

    class Meta:
        model = ThreeDDesign
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
        )


from .models import ThreeDPrintingCAM


class ThreeDPrintingCAMSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    order = serializers.PrimaryKeyRelatedField(read_only=True)
    images = serializers.SerializerMethodField()

    # Write-only field for order validation
    order_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    # Image URLs
    cam_piece_image_url = serializers.SerializerMethodField()
    approved_cam_piece_url = serializers.SerializerMethodField()
    carry_forward_image_url = serializers.SerializerMethodField()

    def get_images(self, obj):
        images = obj.images.all()
        serializer = ThreeDPrintingCAMImageSerializer(images, many=True, context=self.context)
        return serializer.data

    def get_cam_piece_image_url(self, obj):
        if obj.cam_piece_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.cam_piece_image.url)
        return None

    def get_approved_cam_piece_url(self, obj):
        if obj.approved_cam_piece:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.approved_cam_piece.url)
        return None

    def get_carry_forward_image_url(self, obj):
        if obj.carry_forward_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.carry_forward_image.url)
        return None

    def validate_order_id(self, value):
        """Validate that the order exists."""
        if value:
            try:
                Order.objects.get(pk=value)
            except Order.DoesNotExist:
                raise serializers.ValidationError("Order with this ID does not exist.")
        return value

    def create(self, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        for img_field in ("cam_piece_image", "approved_cam_piece", "carry_forward_image"):
            if img_field in validated_data and not validated_data[img_field]:
                validated_data.pop(img_field)
        return super().update(instance, validated_data)

    class Meta:
        model = ThreeDPrintingCAM
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
            "order",
        )


from .models import GhatApproval


class GhatApprovalSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    order = serializers.PrimaryKeyRelatedField(read_only=True)
    images = serializers.SerializerMethodField()

    # Write-only field for order validation
    order_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    # Image URL
    carry_forward_image_url = serializers.SerializerMethodField()

    def get_images(self, obj):
        images = obj.images.all()
        serializer = GhatApprovalImageSerializer(images, many=True, context=self.context)
        return serializer.data

    def get_carry_forward_image_url(self, obj):
        if obj.carry_forward_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.carry_forward_image.url)
        return None

    def validate_order_id(self, value):
        """Validate that the order exists."""
        if value:
            try:
                Order.objects.get(pk=value)
            except Order.DoesNotExist:
                raise serializers.ValidationError("Order with this ID does not exist.")
        return value

    def create(self, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        for img_field in ("carry_forward_image",):
            if img_field in validated_data and not validated_data[img_field]:
                validated_data.pop(img_field)
        return super().update(instance, validated_data)

    class Meta:
        model = GhatApproval
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
            "order",
        )


from .models import GhatQualityCheck


class GhatQualityCheckSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    order = serializers.PrimaryKeyRelatedField(read_only=True)
    images = serializers.SerializerMethodField()

    # Write-only field for order validation
    order_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    # Image URL
    carry_forward_image_url = serializers.SerializerMethodField()

    def get_images(self, obj):
        images = obj.images.all()
        serializer = GhatQualityCheckImageSerializer(images, many=True, context=self.context)
        return serializer.data

    def get_carry_forward_image_url(self, obj):
        if obj.carry_forward_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.carry_forward_image.url)
        return None

    def validate_order_id(self, value):
        """Validate that the order exists."""
        if value:
            try:
                Order.objects.get(pk=value)
            except Order.DoesNotExist:
                raise serializers.ValidationError("Order with this ID does not exist.")
        return value

    def create(self, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        for img_field in ("carry_forward_image",):
            if img_field in validated_data and not validated_data[img_field]:
                validated_data.pop(img_field)
        return super().update(instance, validated_data)

    class Meta:
        model = GhatQualityCheck
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
            "order",
        )


from .models import StoneDemandToBagging


class StoneDemandToBaggingSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    order = serializers.PrimaryKeyRelatedField(read_only=True)
    images = serializers.SerializerMethodField()

    # Write-only field for order validation
    order_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    # Override shape to accept both choice keys AND ShapeMaster UUIDs.
    # DRF would normally enforce choices at field level before validate_shape
    # runs, so we declare it as a plain CharField here and do the resolution
    # ourselves in validate_shape.
    shape = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    # Image URLs
    approved_bagging_list_url = serializers.SerializerMethodField()
    carry_forward_image_url = serializers.SerializerMethodField()

    def get_images(self, obj):
        images = obj.images.all()
        serializer = StoneDemandToBaggingImageSerializer(images, many=True, context=self.context)
        return serializer.data

    def get_approved_bagging_list_url(self, obj):
        if obj.approved_bagging_list:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.approved_bagging_list.url)
        return None

    def get_carry_forward_image_url(self, obj):
        if obj.carry_forward_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.carry_forward_image.url)
        return None

    def validate_shape(self, value):
        if not value:
            return value

        valid_keys = {k for k, _ in StoneDemandToBagging.SHAPE_CHOICES}

        if value.upper() in valid_keys:
            return value.upper()

        try:
            from core.models import ShapeMaster

            shape_obj = ShapeMaster.objects.get(pk=value)
            normalised = shape_obj.name.upper().replace(" ", "_")
            if normalised in valid_keys:
                return normalised
            for key, label in StoneDemandToBagging.SHAPE_CHOICES:
                if label.lower() == shape_obj.name.lower():
                    return key
            raise serializers.ValidationError(
                f"Shape '{shape_obj.name}' from ShapeMaster does not match any known shape choice."
            )
        except Exception as e:
            if "ValidationError" in type(e).__name__:
                raise
            pass

        raise serializers.ValidationError(
            f"'{value}' is not a valid shape. Please select from the dropdown."
        )

    def validate_order_id(self, value):
        """Validate that the order exists."""
        if value:
            try:
                Order.objects.get(pk=value)
            except Order.DoesNotExist:
                raise serializers.ValidationError("Order with this ID does not exist.")
        return value

    def create(self, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        for img_field in ("approved_bagging_list", "carry_forward_image"):
            if img_field in validated_data and not validated_data[img_field]:
                validated_data.pop(img_field)
        return super().update(instance, validated_data)

    class Meta:
        model = StoneDemandToBagging
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
            "order",
        )


from .models import PreRhodiumQualityCheck


class PreRhodiumQualityCheckSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    order = serializers.PrimaryKeyRelatedField(read_only=True)
    images = serializers.SerializerMethodField()

    # Write-only field for order validation
    order_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    # Image URL
    quality_check_image_url = serializers.SerializerMethodField()

    def get_images(self, obj):
        images = obj.images.all()
        serializer = PreRhodiumQualityCheckImageSerializer(images, many=True, context=self.context)
        return serializer.data

    def get_quality_check_image_url(self, obj):
        if obj.quality_check_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.quality_check_image.url)
        return None

    def validate_order_id(self, value):
        """Validate that the order exists."""
        if value:
            try:
                Order.objects.get(pk=value)
            except Order.DoesNotExist:
                raise serializers.ValidationError("Order with this ID does not exist.")
        return value

    def create(self, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        for img_field in ("quality_check_image",):
            if img_field in validated_data and not validated_data[img_field]:
                validated_data.pop(img_field)
        return super().update(instance, validated_data)

    class Meta:
        model = PreRhodiumQualityCheck
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
            "order",
        )


from .models import FinalQualityCheck


class FinalQualityCheckSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    order = serializers.PrimaryKeyRelatedField(read_only=True)

    # Write-only field for order validation
    order_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    # Image URL
    final_quality_check_image_url = serializers.SerializerMethodField()

    def get_final_quality_check_image_url(self, obj):
        if obj.final_quality_check_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.final_quality_check_image.url)
        return None

    def validate_order_id(self, value):
        """Validate that the order exists."""
        if value:
            try:
                Order.objects.get(pk=value)
            except Order.DoesNotExist:
                raise serializers.ValidationError("Order with this ID does not exist.")
        return value

    def create(self, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        for img_field in ("final_quality_check_image",):
            if img_field in validated_data and not validated_data[img_field]:
                validated_data.pop(img_field)
        return super().update(instance, validated_data)

    class Meta:
        model = FinalQualityCheck
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
            "order",
        )


from .models import ItemFinalPackingList


class ItemFinalPackingListSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    order = serializers.PrimaryKeyRelatedField(read_only=True)
    images = serializers.SerializerMethodField()

    # Write-only field for order validation
    order_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    # Image URL
    jewellery_piece_image_url = serializers.SerializerMethodField()

    def get_images(self, obj):
        images = obj.images.all()
        serializer = ItemFinalPackingListImageSerializer(images, many=True, context=self.context)
        return serializer.data

    def get_jewellery_piece_image_url(self, obj):
        if obj.jewellery_piece_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.jewellery_piece_image.url)
        return None

    def validate_order_id(self, value):
        """Validate that the order exists."""
        if value:
            try:
                Order.objects.get(pk=value)
            except Order.DoesNotExist:
                raise serializers.ValidationError("Order with this ID does not exist.")
        return value

    def create(self, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        for img_field in ("jewellery_piece_image",):
            if img_field in validated_data and not validated_data[img_field]:
                validated_data.pop(img_field)
        return super().update(instance, validated_data)

    class Meta:
        model = ItemFinalPackingList
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
            "order",
        )


from .models import RawMaterialTally


class RawMaterialTallySerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    order = serializers.PrimaryKeyRelatedField(read_only=True)
    images = serializers.SerializerMethodField()

    # Write-only field for order validation
    order_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    # Image URL
    carry_forward_image_url = serializers.SerializerMethodField()

    def get_images(self, obj):
        images = obj.images.all()
        serializer = RawMaterialTallyImageSerializer(images, many=True, context=self.context)
        return serializer.data

    def get_carry_forward_image_url(self, obj):
        if obj.carry_forward_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.carry_forward_image.url)
        return None

    def validate_raw_material_movement(self, value):
        """
        Validate and parse raw_material_movement field.
        Accepts both JSON string (from FormData) and Python list/dict.
        """
        import json

        # If it's already a list/dict, return as-is
        if isinstance(value, (list, dict)):
            return value

        # If it's a string, try to parse it as JSON
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                return parsed
            except (json.JSONDecodeError, ValueError) as e:
                raise serializers.ValidationError(f"Invalid JSON format: {str(e)}")

        # If it's None or empty, return None
        if value is None or value == "":
            return None

        raise serializers.ValidationError("Value must be a valid JSON array or object")

    def validate_order_id(self, value):
        """Validate that the order exists."""
        if value:
            try:
                Order.objects.get(pk=value)
            except Order.DoesNotExist:
                raise serializers.ValidationError("Order with this ID does not exist.")
        return value

    def create(self, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        for img_field in ("carry_forward_image",):
            if img_field in validated_data and not validated_data[img_field]:
                validated_data.pop(img_field)
        return super().update(instance, validated_data)

    class Meta:
        model = RawMaterialTally
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
            "order",
        )


from .models import MetalIssue, BaggingReady, DiamondPurchaseIssue, GemstonePurchaseIssue


class MetalIssueSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    order = serializers.PrimaryKeyRelatedField(read_only=True)

    # Write-only field for order validation
    order_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    # Image URL
    carry_forward_image_url = serializers.SerializerMethodField()

    def get_carry_forward_image_url(self, obj):
        if obj.carry_forward_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.carry_forward_image.url)
        return None

    def validate_order_id(self, value):
        """Validate that the order exists."""
        if value:
            try:
                Order.objects.get(pk=value)
            except Order.DoesNotExist:
                raise serializers.ValidationError("Order with this ID does not exist.")
        return value

    def create(self, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        for img_field in ("carry_forward_image",):
            if img_field in validated_data and not validated_data[img_field]:
                validated_data.pop(img_field)
        return super().update(instance, validated_data)

    class Meta:
        model = MetalIssue
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
            "order",
        )


class BaggingReadySerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    order = serializers.PrimaryKeyRelatedField(read_only=True)

    # Write-only field for order validation
    order_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    # Image URL
    carry_forward_image_url = serializers.SerializerMethodField()

    def get_carry_forward_image_url(self, obj):
        if obj.carry_forward_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.carry_forward_image.url)
        return None

    def validate_order_id(self, value):
        """Validate that the order exists."""
        if value:
            try:
                Order.objects.get(pk=value)
            except Order.DoesNotExist:
                raise serializers.ValidationError("Order with this ID does not exist.")
        return value

    def create(self, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        for img_field in ("carry_forward_image",):
            if img_field in validated_data and not validated_data[img_field]:
                validated_data.pop(img_field)
        return super().update(instance, validated_data)

    class Meta:
        model = BaggingReady
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
            "order",
        )


class DiamondPurchaseIssueSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    order = serializers.PrimaryKeyRelatedField(read_only=True)

    # Write-only field for order validation
    order_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    # Image URL
    carry_forward_image_url = serializers.SerializerMethodField()

    def get_carry_forward_image_url(self, obj):
        if obj.carry_forward_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.carry_forward_image.url)
        return None

    def validate_order_id(self, value):
        """Validate that the order exists."""
        if value:
            try:
                Order.objects.get(pk=value)
            except Order.DoesNotExist:
                raise serializers.ValidationError("Order with this ID does not exist.")
        return value

    def create(self, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        return super().update(instance, validated_data)

    class Meta:
        model = DiamondPurchaseIssue
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
            "order",
        )


class GemstonePurchaseIssueSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    order = serializers.PrimaryKeyRelatedField(read_only=True)

    # Write-only field for order validation
    order_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    # Image URL
    carry_forward_image_url = serializers.SerializerMethodField()

    def get_carry_forward_image_url(self, obj):
        if obj.carry_forward_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.carry_forward_image.url)
        return None

    def validate_order_id(self, value):
        """Validate that the order exists."""
        if value:
            try:
                Order.objects.get(pk=value)
            except Order.DoesNotExist:
                raise serializers.ValidationError("Order with this ID does not exist.")
        return value

    def create(self, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        order_id = validated_data.pop("order_id", None)
        if order_id:
            validated_data["order_id"] = order_id
        return super().update(instance, validated_data)

    class Meta:
        model = GemstonePurchaseIssue
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
            "order",
        )


# =============================================================================
# INVOICE SERIALIZERS
# =============================================================================

from .models import Invoice, InvoiceLineItem, InvoicePayment, InvoiceSequence


class InvoiceLineItemSerializer(serializers.ModelSerializer):
    """Serializer for invoice line items"""

    class Meta:
        model = InvoiceLineItem
        fields = [
            "id",
            "particulars",
            "description",
            "shape",
            "colour",
            "clarity",
            "quantity",
            "weight",
            "unit",
            "rate",
            "amount",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "created_at", "updated_at")


class InvoicePaymentSerializer(serializers.ModelSerializer):
    """Serializer for invoice payments"""

    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = InvoicePayment
        fields = [
            "id",
            "payment_date",
            "amount",
            "payment_method",
            "reference_number",
            "notes",
            "recorded_by",
            "recorded_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "recorded_by", "created_at", "updated_at")

    def get_recorded_by_name(self, obj):
        if obj.recorded_by:
            return (
                f"{obj.recorded_by.first_name} {obj.recorded_by.last_name}".strip()
                or obj.recorded_by.username
            )
        return None


class InvoiceSerializer(serializers.ModelSerializer):
    """Main invoice serializer with nested line items and payments"""

    line_items = InvoiceLineItemSerializer(many=True, read_only=True)
    payments = InvoicePaymentSerializer(many=True, read_only=True)

    # Read-only nested representations
    sale_details = serializers.SerializerMethodField()
    estimate_details = serializers.SerializerMethodField()
    sales_query_details = serializers.SerializerMethodField()

    # Write-only fields for creating invoice
    sale_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    estimate_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    sales_query_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "invoice_date",
            "due_date",
            "payment_terms",
            "sale",
            "sale_id",
            "sale_details",
            "estimate",
            "estimate_id",
            "estimate_details",
            "sales_query",
            "sales_query_id",
            "sales_query_details",
            "customer_name",
            "sub_account",
            "phone_number",
            "email",
            "address",
            "pan_gstin",
            "item_name",
            "jewellery_type",
            "size_details",
            "sales_person_name",
            "subtotal",
            "gst_rate",
            "gst_amount",
            "total_amount",
            "amount_paid",
            "balance_due",
            "status",
            "notes",
            "terms_and_conditions",
            "product_image",
            "line_items",
            "payments",
            "account",
            "company",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "is_deleted",
        ]
        read_only_fields = (
            "id",
            "invoice_number",
            "balance_due",
            "company",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "sale",
            "estimate",
            "sales_query",
        )

    def get_sale_details(self, obj):
        if obj.sale:
            return {
                "id": str(obj.sale.id),
                "order_no": obj.sale.order_no,
                "item_name": obj.sale.item_name,
            }
        return None

    def get_estimate_details(self, obj):
        if obj.estimate:
            return {
                "id": str(obj.estimate.id),
                "item_name": obj.estimate.item_name,
                "grand_total": str(obj.estimate.grand_total),
            }
        return None

    def get_sales_query_details(self, obj):
        if obj.sales_query:
            return {
                "id": str(obj.sales_query.id),
                "jewellery_type": obj.sales_query.jewellery_type,
                "customer_name": obj.sales_query.account.account_name
                if obj.sales_query.account
                else None,
            }
        return None

    def create(self, validated_data):
        # Handle FK IDs
        sale_id = validated_data.pop("sale_id", None)
        estimate_id = validated_data.pop("estimate_id", None)
        sales_query_id = validated_data.pop("sales_query_id", None)

        # Enforce: Invoice requires an estimate
        if not estimate_id and not sale_id:
            raise serializers.ValidationError(
                {
                    "estimate_id": [
                        "An invoice cannot be created without an estimate. Please create an estimate first."
                    ]
                }
            )

        if sale_id:
            validated_data["sale_id"] = sale_id
        if estimate_id:
            validated_data["estimate_id"] = estimate_id
        if sales_query_id:
            validated_data["sales_query_id"] = sales_query_id

        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Handle FK IDs
        sale_id = validated_data.pop("sale_id", None)
        estimate_id = validated_data.pop("estimate_id", None)
        sales_query_id = validated_data.pop("sales_query_id", None)

        if sale_id is not None:
            validated_data["sale_id"] = sale_id
        if estimate_id is not None:
            validated_data["estimate_id"] = estimate_id
        if sales_query_id is not None:
            validated_data["sales_query_id"] = sales_query_id

        return super().update(instance, validated_data)


class CreateInvoiceFromSaleSerializer(serializers.Serializer):
    """Serializer for creating an invoice from a completed sale"""

    sale_id = serializers.UUIDField(required=True)
    invoice_date = serializers.DateField(required=False)
    due_date = serializers.DateField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    terms_and_conditions = serializers.CharField(required=False, allow_blank=True)

    def validate_sale_id(self, value):
        """Validate that the sale exists and has an estimate with a sales query"""
        from .models import Sale

        try:
            sale = Sale.objects.select_related("selected_estimate").get(pk=value)

            # 1. Must have an estimate
            if not sale.selected_estimate:
                raise serializers.ValidationError(
                    "Sale must have a selected estimate to create an invoice."
                )

            # 2. Estimate must be linked to a Sales Query
            if not sale.selected_estimate.sales_query_id:
                raise serializers.ValidationError(
                    "The estimate for this sale is not linked to a Sales Query. "
                    "An invoice can only be created after the Sales Queries form is filled."
                )

        except Sale.DoesNotExist:
            raise serializers.ValidationError("Sale with this ID does not exist.")
        return value

    def create(self, validated_data):
        """Create invoice from sale with estimate data"""
        from .models import Sale, Invoice, InvoiceLineItem
        from django.utils import timezone

        sale_id = validated_data["sale_id"]
        sale = Sale.objects.select_related("selected_estimate", "account", "company").get(
            pk=sale_id
        )
        estimate = sale.selected_estimate

        # Get user and company from context
        user = self.context.get("user")
        company = self.context.get("company")

        # Calculate due date if not provided (default: 30 days from invoice date)
        invoice_date = validated_data.get("invoice_date", timezone.now().date())
        due_date = validated_data.get("due_date")
        if not due_date:
            from datetime import timedelta

            due_date = invoice_date + timedelta(days=30)

        # Calculate GST rate from estimate (if possible)
        if estimate.total_taxable_value and estimate.total_taxable_value > 0:
            gst_rate = (estimate.gst_amount / estimate.total_taxable_value) * 100
        else:
            gst_rate = 3.00  # Default GST rate

        # Create invoice
        invoice = Invoice.objects.create(
            company=company,
            sale=sale,
            estimate=estimate,
            sales_query=None,  # Can be linked if needed
            invoice_date=invoice_date,
            due_date=due_date,
            customer_name=sale.account.account_name if sale.account else "",
            email=getattr(sale.account, "email", ""),
            phone_number=getattr(sale.account, "phone", ""),
            address=getattr(sale.account, "address", ""),
            pan_gstin=getattr(sale.account, "gstin", ""),
            item_name=estimate.item_name or "",
            jewellery_type=estimate.jewellery_type or "",
            subtotal=estimate.total_taxable_value,
            gst_rate=gst_rate,
            gst_amount=estimate.gst_amount,
            total_amount=estimate.grand_total,
            amount_paid=0,
            balance_due=estimate.grand_total,
            status="draft",
            notes=validated_data.get("notes", ""),
            terms_and_conditions=validated_data.get("terms_and_conditions", ""),
            created_by=user,
        )

        # Copy line items from estimate
        for idx, line in enumerate(estimate.line_items.all(), start=1):
            InvoiceLineItem.objects.create(
                invoice=invoice,
                particulars=line.particulars,
                description="",  # EstimateLineItem doesn't have description field
                shape=line.shape or "",
                colour=line.colour or "",
                clarity=line.clarity or "",
                quantity=line.pc or 1,
                weight=line.weight,
                unit=line.unit or "",
                rate=line.rate or 0,
                amount=line.amount,
                order=idx,
            )

        return invoice


class CreateInvoiceFromEstimateSerializer(serializers.Serializer):
    """Serializer for creating an invoice directly from an estimate (without sale)"""

    estimate_id = serializers.UUIDField(required=True)
    sales_query_id = serializers.UUIDField(required=False, allow_null=True)
    invoice_date = serializers.DateField(required=False)
    due_date = serializers.DateField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    terms_and_conditions = serializers.CharField(required=False, allow_blank=True)

    def validate_estimate_id(self, value):
        """Validate that the estimate exists"""
        from .models import EstimateVoucher

        try:
            EstimateVoucher.objects.get(pk=value)
        except EstimateVoucher.DoesNotExist:
            raise serializers.ValidationError("Estimate with this ID does not exist.")
        return value

    def validate_sales_query_id(self, value):
        """Validate that the sales query exists if provided"""
        if value:
            from sales_queries.models import SalesQuery

            try:
                SalesQuery.objects.get(pk=value)
            except SalesQuery.DoesNotExist:
                raise serializers.ValidationError("Sales Query with this ID does not exist.")
        return value

    def validate(self, attrs):
        """Ensure the estimate is linked to a sales query (either directly or via the provided field)."""
        from .models import EstimateVoucher

        estimate_id = attrs.get("estimate_id")
        sales_query_id = attrs.get("sales_query_id")

        if estimate_id and not sales_query_id:
            # Check if the estimate itself is linked to a sales query
            try:
                estimate = EstimateVoucher.objects.get(pk=estimate_id)
                if not estimate.sales_query:
                    raise serializers.ValidationError(
                        {
                            "sales_query_id": [
                                "A sales query is required to create an invoice. "
                                "Please fill out the sales query form first."
                            ]
                        }
                    )
            except EstimateVoucher.DoesNotExist:
                pass  # Already handled in validate_estimate_id

        return attrs

    def create(self, validated_data):
        """Create invoice from estimate with sales query data"""
        from .models import EstimateVoucher, Invoice, InvoiceLineItem
        from sales_queries.models import SalesQuery
        from django.utils import timezone

        estimate_id = validated_data["estimate_id"]
        sales_query_id = validated_data.get("sales_query_id")

        estimate = EstimateVoucher.objects.select_related("company").get(pk=estimate_id)
        sales_query = None
        if sales_query_id:
            sales_query = SalesQuery.objects.select_related("account").get(pk=sales_query_id)

        # Get user and company from context
        user = self.context.get("user")
        company = self.context.get("company")

        # Get customer details from sales query if available, otherwise from estimate
        if sales_query and sales_query.account:
            customer_name = sales_query.account.account_name
            email = sales_query.email or getattr(sales_query.account, "email", "")
            phone_number = sales_query.phone_number or getattr(sales_query.account, "phone", "")
            address = sales_query.city or getattr(sales_query.account, "address", "")
            pan_gstin = sales_query.pan_gstin or getattr(sales_query.account, "gstin", "")
        else:
            # Fallback to estimate or empty
            customer_name = estimate.item_name or "Customer"
            email = ""
            phone_number = ""
            address = ""
            pan_gstin = ""

        # Calculate due date if not provided (default: 30 days from invoice date)
        invoice_date = validated_data.get("invoice_date", timezone.now().date())
        due_date = validated_data.get("due_date")
        if not due_date:
            from datetime import timedelta

            due_date = invoice_date + timedelta(days=30)

        # Calculate GST rate from estimate (if possible)
        if estimate.total_taxable_value and estimate.total_taxable_value > 0:
            gst_rate = (estimate.gst_amount / estimate.total_taxable_value) * 100
        else:
            gst_rate = 3.00  # Default GST rate

        # Create invoice
        invoice = Invoice.objects.create(
            company=company,
            sale=None,  # No sale required
            estimate=estimate,
            sales_query=sales_query,
            invoice_date=invoice_date,
            due_date=due_date,
            customer_name=customer_name,
            email=email,
            phone_number=phone_number,
            address=address,
            pan_gstin=pan_gstin,
            item_name=estimate.item_name or "",
            jewellery_type=estimate.jewellery_type or "",
            subtotal=estimate.total_taxable_value,
            gst_rate=gst_rate,
            gst_amount=estimate.gst_amount,
            total_amount=estimate.grand_total,
            amount_paid=0,
            balance_due=estimate.grand_total,
            status="draft",
            notes=validated_data.get("notes", ""),
            terms_and_conditions=validated_data.get("terms_and_conditions", ""),
            created_by=user,
        )

        # Copy line items from estimate
        for idx, line in enumerate(estimate.line_items.all(), start=1):
            InvoiceLineItem.objects.create(
                invoice=invoice,
                particulars=line.particulars,
                description="",  # EstimateLineItem doesn't have description field
                shape=line.shape or "",
                colour=line.colour or "",
                clarity=line.clarity or "",
                quantity=line.pc or 1,
                weight=line.weight,
                unit=line.unit or "",
                rate=line.rate or 0,
                amount=line.amount,
                order=idx,
            )

        return invoice


# ============================================================================
# ADDITIONAL IMAGE SERIALIZERS (ThreeDDesignImageSerializer moved to top)
# ============================================================================


class ThreeDDesignSerializerWithImages(serializers.ModelSerializer):
    images = ThreeDDesignImageSerializer(many=True, read_only=True)
    final_design_image_url = serializers.SerializerMethodField()
    final_approved_design_image_url = serializers.SerializerMethodField()
    order_id = serializers.PrimaryKeyRelatedField(
        queryset=Order.objects.all(),
        source="order",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = ThreeDDesign
        fields = [
            "id",
            "account_order_id",
            "order",
            "order_id",
            "images",
            "final_design_image_url",
            "final_approved_design_image_url",
            "is_draft",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by", "updated_by"]

    def get_final_design_image_url(self, obj):
        final_image = obj.images.filter(is_final_design=True).first()
        if final_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(final_image.image.url)
            return final_image.image.url
        return None

    def get_final_approved_design_image_url(self, obj):
        final_image = obj.images.filter(is_final_approved=True).first()
        if final_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(final_image.image.url)
            return final_image.image.url
        return None


class TwoDDesignImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    is_final = serializers.SerializerMethodField()

    class Meta:
        model = TwoDDesignImage
        fields = [
            "id",
            "image",
            "image_url",
            "field_type",
            "is_final",
            "is_final_design",
            "is_final_approved",
            "log_group",
            "uploaded_at",
            "uploaded_by",
        ]
        read_only_fields = ["id", "uploaded_at"]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def get_is_final(self, obj):
        if obj.field_type == "design":
            return obj.is_final_design
        elif obj.field_type == "approved":
            return obj.is_final_approved
        return False


class TwoDDesignSerializer(serializers.ModelSerializer):
    images = TwoDDesignImageSerializer(many=True, read_only=True)
    final_design_image_url = serializers.SerializerMethodField()
    final_approved_design_image_url = serializers.SerializerMethodField()
    order_id = serializers.PrimaryKeyRelatedField(
        queryset=Order.objects.all(),
        source="order",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = TwoDDesign
        fields = [
            "id",
            "account_order_id",
            "order",
            "order_id",
            "images",
            "final_design_image_url",
            "final_approved_design_image_url",
            "is_draft",
            "selected_log_group",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "company",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by", "updated_by", "company"]

    def get_final_design_image_url(self, obj):
        final_image = obj.images.filter(is_final_design=True).first()
        if final_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(final_image.image.url)
            return final_image.image.url
        return None

    def get_final_approved_design_image_url(self, obj):
        final_image = obj.images.filter(is_final_approved=True).first()
        if final_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(final_image.image.url)
            return final_image.image.url
        return None


# Image Serializers for remaining models
class ThreeDPrintingCAMImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ThreeDPrintingCAMImage
        fields = [
            "id",
            "image",
            "image_url",
            "field_type",
            "is_final",
            "log_group",
            "uploaded_at",
            "uploaded_by",
        ]
        read_only_fields = ["id", "uploaded_at"]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class GhatApprovalImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = GhatApprovalImage
        fields = ["id", "image", "image_url", "is_final", "log_group", "uploaded_at", "uploaded_by"]
        read_only_fields = ["id", "uploaded_at"]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class GhatQualityCheckImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = GhatQualityCheckImage
        fields = ["id", "image", "image_url", "is_final", "log_group", "uploaded_at", "uploaded_by"]
        read_only_fields = ["id", "uploaded_at"]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class StoneDemandToBaggingImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = StoneDemandToBaggingImage
        fields = [
            "id",
            "image",
            "image_url",
            "field_type",
            "is_final",
            "log_group",
            "uploaded_at",
            "uploaded_by",
        ]
        read_only_fields = ["id", "uploaded_at"]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class PreRhodiumQualityCheckImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PreRhodiumQualityCheckImage
        fields = ["id", "image", "image_url", "is_final", "log_group", "uploaded_at", "uploaded_by"]
        read_only_fields = ["id", "uploaded_at"]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ItemFinalPackingListImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ItemFinalPackingListImage
        fields = ["id", "image", "image_url", "is_final", "log_group", "uploaded_at", "uploaded_by"]
        read_only_fields = ["id", "uploaded_at"]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class RawMaterialTallyImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = RawMaterialTallyImage
        fields = ["id", "image", "image_url", "is_final", "log_group", "uploaded_at", "uploaded_by"]
        read_only_fields = ["id", "uploaded_at"]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
