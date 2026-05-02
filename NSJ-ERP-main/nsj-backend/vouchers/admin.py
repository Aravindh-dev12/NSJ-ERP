from django.contrib import admin
from .models import (
    Voucher,
    Sale,
    ApprovalLooseM,
    ApprovalTagM,
    PurAndApprovalM,
    PurchaseDiamond,
    Archives,
    PurchaseM,
    PurchaseTagwiseM,
    Repair,
    PaymentEntry,
    JournalEntry,
    PurReturn,
    SalesReturn,
    Receive,
    Receipt,
    RawMaterialPurchase,
    RawMaterialInventory,
    RawMaterialIssuance,
    DailyBookClose,
    DailyReport,
    ThreeDDesign,
    ThreeDPrintingCAM,
    GhatApproval,
    GhatQualityCheck,
    StoneDemandToBagging,
    PreRhodiumQualityCheck,
    FinalQualityCheck,
    ItemFinalPackingList,
    RawMaterialTally,
    MetalIssue,
    BaggingReady,
    DiamondPurchaseIssue,
    GemstonePurchaseIssue,
    OrderDraft,
    OrderProcessStep,
    OrderProcessLock,
)


@admin.register(Voucher)
class VoucherAdmin(admin.ModelAdmin):
    list_display = ("bill_no", "account", "date", "advance_payment_received", "created_at")
    search_fields = ("bill_no", "item_name", "job_no")
    list_filter = ("base_metal",)


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ("order_no", "item_name", "account", "created_at")
    search_fields = ("order_no", "item_name", "tag_no")
    list_filter = ("item_name", "unit")


@admin.register(ApprovalLooseM)
class ApprovalLooseMAdmin(admin.ModelAdmin):
    list_display = ("order_number", "account", "item_name", "piece", "created_at")
    search_fields = ("order_number", "item_name__name", "account__account_name")
    list_filter = ("unit", "stamp")


@admin.register(ApprovalTagM)
class ApprovalTagMAdmin(admin.ModelAdmin):
    list_display = ("order_number", "item_name", "piece", "created_at")
    search_fields = ("order_number", "item_name__name", "design")
    list_filter = ("unit", "stamp")


@admin.register(PurAndApprovalM)
class PurAndApprovalMAdmin(admin.ModelAdmin):
    list_display = ("order_no", "tag_no", "account", "item_name", "piece", "created_at")
    search_fields = ("order_no", "tag_no", "item_name__name", "account__account_name")
    list_filter = ("unit", "shape")


@admin.register(PurchaseDiamond)
class PurchaseDiamondAdmin(admin.ModelAdmin):
    list_display = ("batch", "account", "item_name", "piece", "wt", "created_at")
    search_fields = ("batch", "item_name__name", "account__account_name")
    list_filter = ("shape", "size", "colour", "clarity")


@admin.register(Archives)
class ArchivesAdmin(admin.ModelAdmin):
    list_display = ("bill_no", "account", "date", "advance_payment_received", "created_at")
    search_fields = ("bill_no", "item_name", "job_no")
    list_filter = ("base_metal",)


@admin.register(PurchaseM)
class PurchaseMAdmin(admin.ModelAdmin):
    list_display = ("order_no", "tag_no", "account", "item_name", "piece", "created_at")
    search_fields = ("order_no", "tag_no", "item_name__name", "account__account_name")
    list_filter = ("unit", "stamp")


@admin.register(PurchaseTagwiseM)
class PurchaseTagwiseMAdmin(admin.ModelAdmin):
    list_display = ("order_no", "account", "item_name", "piece", "created_at")
    search_fields = ("order_no", "item_name__name", "supplier_name")
    list_filter = ("unit", "stamp")


@admin.register(PurReturn)
class PurReturnAdmin(admin.ModelAdmin):
    list_display = ("order_no", "tag_no", "account", "item_name", "piece", "created_at")
    search_fields = ("order_no", "tag_no", "item_name__name", "account__account_name")
    list_filter = ("unit", "shape")


@admin.register(SalesReturn)
class SalesReturnAdmin(admin.ModelAdmin):
    list_display = ("order_no", "tag_no", "account", "item_name", "piece", "created_at")
    search_fields = ("order_no", "tag_no", "item_name__name", "account__account_name")
    list_filter = ("unit", "shape")


@admin.register(Repair)
class RepairAdmin(admin.ModelAdmin):
    list_display = ("tag_no", "account", "item_name", "piece", "total", "created_at")
    search_fields = ("tag_no", "item_name__name", "account__account_name")
    list_filter = ("stamp",)


@admin.register(PaymentEntry)
class PaymentEntryAdmin(admin.ModelAdmin):
    list_display = ("id", "account", "party", "date", "dr", "cr", "total", "created_at")
    search_fields = ("narration", "account__account_name", "party__account_name")
    list_filter = ("type",)


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ("id", "account", "party", "date", "dr", "cr", "total", "created_at")
    search_fields = ("narration", "account__account_name", "party__account_name")
    list_filter = ("type",)


@admin.register(Receive)
class ReceiveAdmin(admin.ModelAdmin):
    list_display = ("tag_no", "account", "date", "pc", "net_wt", "rate", "total", "created_at")
    search_fields = ("tag_no", "item_name__name", "account__account_name")
    list_filter = ("unit", "stamp")


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ("id", "party_name", "date", "type", "dr", "cr", "balance", "created_at")
    search_fields = ("party_name__account_name", "party_name__name", "narration")
    list_filter = ("type",)

    def changelist_view(self, request, extra_context=None):
        """Show a friendly message instead of a Django crash when the DB table is missing."""
        from django.db.utils import OperationalError
        from django.http import HttpResponse

        try:
            return super().changelist_view(request, extra_context=extra_context)
        except OperationalError:
            return HttpResponse(
                "<h2>Receipt table not available</h2><p>Please run <code>python manage.py migrate vouchers</code> to create the table.</p>",
                status=500,
            )


@admin.register(RawMaterialPurchase)
class RawMaterialPurchaseAdmin(admin.ModelAdmin):
    list_display = ("dia_id", "supplier", "date", "carat", "total", "created_at")
    search_fields = ("dia_id", "order_id", "cert_no", "supplier__account_name")
    list_filter = ("shape", "colour", "clarity", "lab")
    readonly_fields = ("dia_id", "price_per_ct_inr", "total")


@admin.register(RawMaterialInventory)
class RawMaterialInventoryAdmin(admin.ModelAdmin):
    list_display = ("purchase", "available_carat", "issued_carat", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("purchase__dia_id", "purchase__supplier__account_name")
    readonly_fields = ("available_carat", "issued_carat", "original_carat", "status")


@admin.register(RawMaterialIssuance)
class RawMaterialIssuanceAdmin(admin.ModelAdmin):
    list_display = ("inventory", "job_no", "issued_carat", "date", "issued_by", "created_at")
    list_filter = ("date",)
    search_fields = ("job_no", "inventory__purchase__dia_id")
    readonly_fields = ("issued_by",)


@admin.register(DailyBookClose)
class DailyBookCloseAdmin(admin.ModelAdmin):
    list_display = (
        "date",
        "is_closed",
        "closed_by",
        "total_purchases",
        "total_orders",
        "closed_at",
    )
    list_filter = ("is_closed", "date")
    readonly_fields = ("closed_at", "closed_by")


@admin.register(DailyReport)
class DailyReportAdmin(admin.ModelAdmin):
    list_display = (
        "date",
        "user",
        "is_submitted",
        "tasks_completed",
        "orders_processed",
        "submitted_at",
    )
    list_filter = ("is_submitted", "date")
    search_fields = ("user__name", "user__email")
    readonly_fields = ("submitted_at",)


@admin.register(ThreeDDesign)
class ThreeDDesignAdmin(admin.ModelAdmin):
    list_display = ("account_order_id", "created_by", "created_at", "updated_at")
    search_fields = ("account_order_id",)
    list_filter = ("created_at",)
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by")


@admin.register(ThreeDPrintingCAM)
class ThreeDPrintingCAMAdmin(admin.ModelAdmin):
    list_display = (
        "account_order_id",
        "order",
        "cam_piece_quality_check",
        "created_by",
        "created_at",
    )
    search_fields = ("account_order_id", "order__bill_no", "order__job_no")
    list_filter = ("cam_piece_quality_check", "created_at")
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by", "order")


@admin.register(GhatApproval)
class GhatApprovalAdmin(admin.ModelAdmin):
    list_display = ("account_order_id", "order", "ghat_approval", "created_by", "created_at")
    search_fields = ("account_order_id", "order__bill_no", "order__job_no")
    list_filter = ("ghat_approval", "created_at")
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by", "order")


@admin.register(GhatQualityCheck)
class GhatQualityCheckAdmin(admin.ModelAdmin):
    list_display = ("account_order_id", "order", "created_by", "created_at")
    search_fields = ("account_order_id", "order__bill_no", "order__job_no")
    list_filter = ("created_at",)
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by", "order")


@admin.register(StoneDemandToBagging)
class StoneDemandToBaggingAdmin(admin.ModelAdmin):
    list_display = ("account_order_id", "order", "created_by", "created_at")
    search_fields = ("account_order_id", "order__bill_no", "order__job_no")
    list_filter = ("created_at",)
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by", "order")


@admin.register(PreRhodiumQualityCheck)
class PreRhodiumQualityCheckAdmin(admin.ModelAdmin):
    list_display = ("account_order_id", "order", "quality_check", "created_by", "created_at")
    search_fields = ("account_order_id", "order__bill_no", "order__job_no")
    list_filter = ("quality_check", "created_at")
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by", "order")


@admin.register(FinalQualityCheck)
class FinalQualityCheckAdmin(admin.ModelAdmin):
    list_display = ("account_order_id", "order", "final_quality_check", "created_by", "created_at")
    search_fields = ("account_order_id", "order__bill_no", "order__job_no")
    list_filter = ("final_quality_check", "created_at")
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by", "order")


@admin.register(ItemFinalPackingList)
class ItemFinalPackingListAdmin(admin.ModelAdmin):
    list_display = ("account_order_id", "order", "created_by", "created_at")
    search_fields = ("account_order_id", "order__bill_no", "order__job_no")
    list_filter = ("created_at",)
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by", "order")


@admin.register(RawMaterialTally)
class RawMaterialTallyAdmin(admin.ModelAdmin):
    list_display = ("account_order_id", "order", "created_by", "created_at")
    search_fields = ("account_order_id", "order__bill_no", "order__job_no")
    list_filter = ("created_at",)
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by", "order")


@admin.register(MetalIssue)
class MetalIssueAdmin(admin.ModelAdmin):
    list_display = ("account_order_id", "order", "created_by", "created_at")
    search_fields = ("account_order_id", "order__bill_no", "order__job_no")
    list_filter = ("created_at",)
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by", "order")


@admin.register(BaggingReady)
class BaggingReadyAdmin(admin.ModelAdmin):
    list_display = ("account_order_id", "order", "created_by", "created_at")
    search_fields = ("account_order_id", "order__bill_no", "order__job_no")
    list_filter = ("created_at",)
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by", "order")


@admin.register(DiamondPurchaseIssue)
class DiamondPurchaseIssueAdmin(admin.ModelAdmin):
    list_display = ("account_order_id", "order", "created_by", "created_at")
    search_fields = ("account_order_id", "order__bill_no", "order__job_no")
    list_filter = ("created_at",)
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by", "order")


@admin.register(GemstonePurchaseIssue)
class GemstonePurchaseIssueAdmin(admin.ModelAdmin):
    list_display = ("account_order_id", "order", "created_by", "created_at")
    search_fields = ("account_order_id", "order__bill_no", "order__job_no")
    list_filter = ("created_at",)
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by", "order")


# Order Process Management Models
@admin.register(OrderDraft)
class OrderDraftAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "source_sale",
        "company",
        "status",
        "advance_amount",
        "created_at",
        "confirmed_at",
    )
    search_fields = ("source_sale__order_no", "company__name")
    list_filter = ("status", "created_at")
    readonly_fields = ("id", "created_at", "updated_at", "confirmed_at", "final_order")


@admin.register(OrderProcessStep)
class OrderProcessStepAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "step_name",
        "position",
        "status",
        "department",
        "order_draft",
        "order",
        "created_at",
    )
    search_fields = ("step_name", "description", "department")
    list_filter = ("status", "department")
    readonly_fields = ("id", "created_at", "updated_at", "completed_at")
    ordering = ["position"]


@admin.register(OrderProcessLock)
class OrderProcessLockAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "lock_level", "courier_dispatched", "locked_by", "locked_at")
    search_fields = ("order__bill_no", "order__job_no")
    list_filter = ("lock_level", "courier_dispatched", "locked_at")
    readonly_fields = ("id", "locked_at", "locked_by", "courier_dispatched_at")
