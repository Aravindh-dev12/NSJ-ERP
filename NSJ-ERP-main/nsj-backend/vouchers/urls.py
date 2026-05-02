from django.urls import path, include
from .views import (
    vouchers_collection_view,
    voucher_detail_view,
    voucher_history_view,
    voucher_receipt_view,
    voucher_export_view,
    vouchers_export_all_view,
    vouchers_aggregates_view,
    vouchers_master_list_view,
    archives_list_view,
    archives_detail_view,
    archives_export_view,
    item_names_master_view,
    clarity_master_view,
    shape_master_view,
    unit_master_view,
    colour_master_view,
    lab_master_view,
    # Enhanced master data views for raw material purchase
    gemstone_master_view,
    gemstone_shape_master_view,
    gemstone_color_master_view,
    gemstone_clarity_master_view,
    gemstone_treatment_master_view,
    origin_master_view,
    metal_type_master_view,
    sales_collection_view,
    sale_detail_view,
    sale_estimates_view,
    sale_select_estimate_view,
    sale_deselect_estimate_view,
    sale_convert_to_order_view,
    sale_export_view,
    sales_export_all_view,
    sales_pdf_view,
    sales_pdf_calibration_view,
    pur_return_collection_view,
    pur_return_detail_view,
    pur_return_overview_view,
    receive_collection_view,
    receive_detail_view,
    receive_overview_view,
    sales_return_collection_view,
    sales_return_detail_view,
    sales_return_overview_view,
    approval_loose_collection_view,
    approval_loose_detail_view,
    approval_tag_collection_view,
    approval_tag_detail_view,
    pur_and_approval_collection_view,
    pur_and_approval_detail_view,
    purchase_m_collection_view,
    purchase_m_detail_view,
    purchase_tagwise_collection_view,
    purchase_tagwise_detail_view,
    purchase_diamond_collection_view,
    purchase_diamond_detail_view,
    repair_collection_view,
    repair_detail_view,
    repair_export_view,
    repairs_export_all_view,
    payment_collection_view,
    payment_aggregates_view,
    payment_master_view,
    payment_detail_view,
    journal_collection_view,
    journal_aggregates_view,
    journal_master_view,
    journal_detail_view,
    receipt_collection_view,
    receipt_detail_view,
    receipt_overview_view,
    receipt_next_voucher_no_view,
    payment_voucher_collection_view,
    payment_voucher_detail_view,
    payment_voucher_next_no_view,
    payment_voucher_overview_view,
    journal_voucher_collection_view,
    journal_voucher_detail_view,
    journal_voucher_overview_view,
    journal_voucher_next_no_view,
    contra_voucher_collection_view,
    contra_voucher_detail_view,
    contra_voucher_overview_view,
    contra_voucher_next_no_view,
    voucher_next_no_view,
    account_ledger_balance_view,
    estimate_collection_view,
    estimate_gold_qualities_view,
    estimate_detail_view,
    estimate_pdf_view,
    estimate_pdf_calibration_view,
    estimate_landscape_pdf_view,
    estimate_landscape_pdf_calibration_view,
    dashboard_stats_view,
    gold_rate_view,
    live_rates_view,
    currency_exchange_view,
    calculate_material_price_view,
    raw_material_purchase_list_create,
    raw_material_purchase_detail,
    raw_material_purchase_aggregates,
    raw_material_suppliers_view,
    raw_material_field_schema,
    raw_material_inventory_list,
    raw_material_inventory_summary,
    raw_material_issuance_list_create,
    raw_material_issuance_detail,
    daily_book_close_list_create,
    daily_book_close_status,
    daily_report_list_create,
    daily_report_dashboard,
    orders_dropdown,
    three_d_design_overview_view,
    three_d_design_collection_view,
    three_d_design_detail_view,
    two_d_design_overview_view,
    two_d_design_collection_view,
    two_d_design_detail_view,
    order_id_preview_view,
    order_sequence_status_view,
    three_d_printing_cam_overview_view,
    three_d_printing_cam_collection_view,
    three_d_printing_cam_detail_view,
    ghat_approval_overview_view,
    ghat_approval_collection_view,
    ghat_approval_detail_view,
    ghat_quality_check_overview_view,
    ghat_quality_check_collection_view,
    ghat_quality_check_detail_view,
    stone_demand_to_bagging_overview_view,
    stone_demand_to_bagging_collection_view,
    stone_demand_to_bagging_detail_view,
    pre_rhodium_quality_check_overview_view,
    pre_rhodium_quality_check_collection_view,
    pre_rhodium_quality_check_detail_view,
    final_quality_check_collection_view,
    final_quality_check_detail_view,
    item_final_packing_list_overview_view,
    item_final_packing_list_collection_view,
    item_final_packing_list_detail_view,
    raw_material_tally_overview_view,
    raw_material_tally_collection_view,
    raw_material_tally_detail_view,
    metal_issue_collection_view,
    metal_issue_detail_view,
    bagging_ready_collection_view,
    bagging_ready_detail_view,
    diamond_purchase_issue_collection_view,
    diamond_purchase_issue_detail_view,
    gemstone_purchase_issue_collection_view,
    gemstone_purchase_issue_detail_view,
    # Invoice views
    invoice_collection_view,
    invoice_detail_view,
    invoice_from_sale_view,
    invoice_from_estimate_view,
    invoice_record_payment_view,
    invoice_pdf_view,
    invoice_stats_view,
)

# Order Process Management Views (now in views.py)
from .views import (
    initiate_order_conversion,
    get_order_draft,
    update_process_steps,
    confirm_and_create_order,
    get_order_process_steps,
    update_step_status,
    save_process_step_data,
    get_step_status_by_name,
    mark_step_done_from_process_tab,
    auto_complete_process_step,
    mark_courier_dispatched,
    prevent_locked_step_modification,
    create_order_with_process,
    get_receipts_for_dropdown,
    get_or_create_sale_from_query,
    search_order_by_id,
    get_or_create_estimate_for_approval,
)

# All views now consolidated in views.py

urlpatterns = [
    # Dashboard stats endpoint
    path("dashboard/stats/", dashboard_stats_view, name="dashboard-stats"),
    # Live rates endpoints
    path("gold-rate/", gold_rate_view, name="gold-rate"),
    path("live-rates/", live_rates_view, name="live-rates"),
    path("currency-exchange/", currency_exchange_view, name="currency-exchange"),
    path(
        "calculate-material-price/", calculate_material_price_view, name="calculate-material-price"
    ),
    path("vouchers/", vouchers_collection_view, name="vouchers-list"),
    path("vouchers/<uuid:pk>/", voucher_detail_view, name="voucher-detail"),
    path("vouchers/<uuid:pk>/history/", voucher_history_view, name="voucher-history"),
    path("vouchers/<uuid:pk>/receipt/", voucher_receipt_view, name="voucher-receipt"),
    path("vouchers/<uuid:pk>/export/", voucher_export_view, name="voucher-export"),
    path("vouchers/export/", vouchers_export_all_view, name="vouchers-export-all"),
    path("vouchers/aggregates/", vouchers_aggregates_view, name="vouchers-aggregates"),
    path("vouchers/masters/", vouchers_master_list_view, name="vouchers-masters"),
    path(
        "vouchers/masters/item-names/", item_names_master_view, name="vouchers-masters-item-names"
    ),
    path("vouchers/masters/clarities/", clarity_master_view, name="vouchers-masters-clarities"),
    path("vouchers/masters/colours/", colour_master_view, name="vouchers-masters-colours"),
    path("vouchers/masters/labs/", lab_master_view, name="vouchers-masters-labs"),
    path("vouchers/masters/shapes/", shape_master_view, name="vouchers-masters-shapes"),
    path("vouchers/masters/units/", unit_master_view, name="vouchers-masters-units"),
    # Enhanced master data APIs for raw material purchase
    path("vouchers/masters/gemstones/", gemstone_master_view, name="vouchers-masters-gemstones"),
    path(
        "vouchers/masters/gemstone-shapes/",
        gemstone_shape_master_view,
        name="vouchers-masters-gemstone-shapes",
    ),
    path(
        "vouchers/masters/gemstone-colors/",
        gemstone_color_master_view,
        name="vouchers-masters-gemstone-colors",
    ),
    path(
        "vouchers/masters/gemstone-clarities/",
        gemstone_clarity_master_view,
        name="vouchers-masters-gemstone-clarities",
    ),
    path(
        "vouchers/masters/gemstone-treatments/",
        gemstone_treatment_master_view,
        name="vouchers-masters-gemstone-treatments",
    ),
    path("vouchers/masters/origins/", origin_master_view, name="vouchers-masters-origins"),
    path(
        "vouchers/masters/metal-types/", metal_type_master_view, name="vouchers-masters-metal-types"
    ),
    path("vouchers/archives/", archives_list_view, name="vouchers-archives"),
    path("vouchers/archives/<uuid:pk>/", archives_detail_view, name="vouchers-archives-detail"),
    path(
        "vouchers/archives/<uuid:pk>/export/", archives_export_view, name="vouchers-archives-export"
    ),
    path("payments/purchase-m/", purchase_m_collection_view, name="purchase-m-list"),
    path("payments/purchase-m/<uuid:pk>/", purchase_m_detail_view, name="purchase-m-detail"),
    path(
        "payments/purchase-tagwise/", purchase_tagwise_collection_view, name="purchase-tagwise-list"
    ),
    path(
        "payments/purchase-tagwise/<uuid:pk>/",
        purchase_tagwise_detail_view,
        name="purchase-tagwise-detail",
    ),
    # Payment -> Approval Loose M
    path("payments/approval-loose/", approval_loose_collection_view, name="approval-loose-list"),
    path(
        "payments/approval-loose/<uuid:pk>/",
        approval_loose_detail_view,
        name="approval-loose-detail",
    ),
    path("payments/approval-tag/", approval_tag_collection_view, name="approval-tag-list"),
    path("payments/approval-tag/<uuid:pk>/", approval_tag_detail_view, name="approval-tag-detail"),
    path(
        "payments/pur-and-approval/", pur_and_approval_collection_view, name="pur-and-approval-list"
    ),
    path(
        "payments/pur-and-approval/<uuid:pk>/",
        pur_and_approval_detail_view,
        name="pur-and-approval-detail",
    ),
    path(
        "payments/purchase-diamond/", purchase_diamond_collection_view, name="purchase-diamond-list"
    ),
    path(
        "payments/purchase-diamond/<uuid:pk>/",
        purchase_diamond_detail_view,
        name="purchase-diamond-detail",
    ),
    path("payments/repair/", repair_collection_view, name="repair-list"),
    path("payments/repair/<uuid:pk>/", repair_detail_view, name="repair-detail"),
    path("payments/repair/<uuid:pk>/export/", repair_export_view, name="repair-export"),
    path("payments/repair/export/", repairs_export_all_view, name="repairs-export-all"),
    # New Payment and Journal voucher endpoints
    path("payments/payment/", payment_collection_view, name="payment-list"),
    path("payments/payment/aggregates/", payment_aggregates_view, name="payment-aggregates"),
    path("payments/payment/masters/", payment_master_view, name="payment-masters"),
    path("payments/payment/<uuid:pk>/", payment_detail_view, name="payment-detail"),
    path("payments/journal/", journal_collection_view, name="journal-list"),
    path("payments/journal/aggregates/", journal_aggregates_view, name="journal-aggregates"),
    path("payments/journal/masters/", journal_master_view, name="journal-masters"),
    path("payments/journal/<uuid:pk>/", journal_detail_view, name="journal-detail"),
    # Repair Issue (separate module) - include issues app router here so paths are under /payments/repair-issues/
    path("payments/repair-issues/", include("issues.urls")),
    # Sales endpoints
    path("sales/", sales_collection_view, name="sales-list"),
    path("sales/pdf/", sales_pdf_view, name="sales-pdf"),
    path("sales/pdf/calibration/", sales_pdf_calibration_view, name="sales-pdf-calibration"),
    path("sales/<uuid:pk>/", sale_detail_view, name="sale-detail"),
    path("sales/<uuid:pk>/estimates/", sale_estimates_view, name="sale-estimates"),
    path(
        "sales/<uuid:pk>/select_estimate/", sale_select_estimate_view, name="sale-select-estimate"
    ),
    path(
        "sales/<uuid:pk>/deselect_estimate/",
        sale_deselect_estimate_view,
        name="sale-deselect-estimate",
    ),
    path(
        "sales/<uuid:pk>/convert_to_order/",
        sale_convert_to_order_view,
        name="sale-convert-to-order",
    ),
    path("sales/<uuid:pk>/export/", sale_export_view, name="sale-export"),
    path("sales/export/", sales_export_all_view, name="sales-export-all"),
    # Order Process Management - Query → Order Conversion Workflow
    path(
        "sales/<uuid:sale_id>/initiate-order-conversion/",
        initiate_order_conversion,
        name="initiate-order-conversion",
    ),
    path("order-drafts/<uuid:draft_id>/", get_order_draft, name="get-order-draft"),
    path(
        "order-drafts/<uuid:draft_id>/process-steps/",
        update_process_steps,
        name="update-process-steps",
    ),
    path(
        "order-drafts/<uuid:draft_id>/confirm/",
        confirm_and_create_order,
        name="confirm-and-create-order",
    ),
    path(
        "orders/<uuid:order_id>/process-steps/",
        get_order_process_steps,
        name="get-order-process-steps",
    ),
    path(
        "orders/<uuid:order_id>/process-steps/<uuid:step_id>/status/",
        update_step_status,
        name="update-step-status",
    ),
    path(
        "orders/<uuid:order_id>/process-steps/<path:step_name>/save/",
        save_process_step_data,
        name="save-process-step-data",
    ),
    path(
        "orders/<uuid:order_id>/process-steps/<path:step_name>/step-status/",
        get_step_status_by_name,
        name="get-step-status-by-name",
    ),
    path(
        "orders/<uuid:order_id>/process-steps/<uuid:step_id>/mark-done/",
        mark_step_done_from_process_tab,
        name="mark-step-done-from-process-tab",
    ),
    path(
        "orders/<uuid:order_id>/auto-complete-step/",
        auto_complete_process_step,
        name="auto-complete-process-step",
    ),
    path(
        "orders/<uuid:order_id>/courier-dispatched/",
        mark_courier_dispatched,
        name="mark-courier-dispatched",
    ),
    path(
        "orders/<uuid:order_id>/process-steps/modify/",
        prevent_locked_step_modification,
        name="prevent-locked-modification",
    ),
    # Direct Order Creation (from Order Form)
    path(
        "orders/create-with-process/", create_order_with_process, name="create-order-with-process"
    ),
    # Estimate Approval step — get or create the linked estimate for an order
    path(
        "orders/<uuid:order_id>/estimate-approval/",
        get_or_create_estimate_for_approval,
        name="estimate-approval",
    ),
    # Receipt API for dropdown
    path("receipts/dropdown/", get_receipts_for_dropdown, name="receipts-dropdown"),
    # Safe conversion - Get or create Sale from Sales Query
    path(
        "sales-queries/<uuid:query_id>/get-or-create-sale/",
        get_or_create_sale_from_query,
        name="get-or-create-sale",
    ),
    # Pur. Return endpoints
    path("pur-return/overview/", pur_return_overview_view, name="pur-return-overview"),
    path("pur-return/list/", pur_return_collection_view, name="pur-return-list"),
    path("pur-return/", pur_return_collection_view, name="pur-return-create"),
    path("pur-return/<uuid:pk>/", pur_return_detail_view, name="pur-return-detail"),
    # Receive endpoints
    path("receive/overview/", receive_overview_view, name="receive-overview"),
    path("receive/list/", receive_collection_view, name="receive-list"),
    path("receive/", receive_collection_view, name="receive-create"),
    path("receive/<uuid:pk>/", receive_detail_view, name="receive-detail"),
    # Receipt endpoints (Cr/Dr payments)
    path("receipt/overview/", receipt_overview_view, name="receipt-overview"),
    path("receipt/next-voucher-no/", receipt_next_voucher_no_view, name="receipt-next-voucher-no"),
    path(
        "receipts/next-voucher-no/", receipt_next_voucher_no_view, name="receipts-next-voucher-no"
    ),
    path("receipt/list/", receipt_collection_view, name="receipt-list"),
    path("receipt/", receipt_collection_view, name="receipt-create"),
    path("receipt/<uuid:pk>/", receipt_detail_view, name="receipt-detail"),
    path("receipts/overview/", receipt_overview_view, name="receipts-overview"),
    path("receipts/list/", receipt_collection_view, name="receipts-list"),
    path("receipts/", receipt_collection_view, name="receipts-create"),
    path("receipts/<uuid:pk>/", receipt_detail_view, name="receipts-detail"),
    path(
        "payment-vouchers/overview/", payment_voucher_overview_view, name="payment-voucher-overview"
    ),
    path("payment-vouchers/next-no/", payment_voucher_next_no_view, name="payment-voucher-next-no"),
    path("payment-vouchers/", payment_voucher_collection_view, name="payment-voucher-list"),
    path("payment-vouchers/<uuid:pk>/", payment_voucher_detail_view, name="payment-voucher-detail"),
    path(
        "journal-vouchers/overview/", journal_voucher_overview_view, name="journal-voucher-overview"
    ),
    path("journal-vouchers/next-no/", journal_voucher_next_no_view, name="journal-voucher-next-no"),
    path("journal-vouchers/", journal_voucher_collection_view, name="journal-voucher-list"),
    path("journal-vouchers/<uuid:pk>/", journal_voucher_detail_view, name="journal-voucher-detail"),
    path("contra-vouchers/overview/", contra_voucher_overview_view, name="contra-voucher-overview"),
    path("contra-vouchers/next-no/", contra_voucher_next_no_view, name="contra-voucher-next-no"),
    path("contra-vouchers/list/", contra_voucher_collection_view, name="contra-voucher-list-alt"),
    path("contra-vouchers/", contra_voucher_collection_view, name="contra-voucher-list"),
    path("contra-vouchers/<uuid:pk>/", contra_voucher_detail_view, name="contra-voucher-detail"),
    # Shared next voucher number - GET /api/vouchers/next-no/?type=PAYMENT|JOURNAL|CONTRA|RECEIPT
    path("vouchers/next-no/", voucher_next_no_view, name="voucher-next-no"),
    path(
        "accounts/<str:pk>/ledger-balance/",
        account_ledger_balance_view,
        name="account-ledger-balance",
    ),
    # Sales Return endpoints (isolated from Pur. Return)
    path("sales-return/overview/", sales_return_overview_view, name="sales-return-overview"),
    path("sales-return/list/", sales_return_collection_view, name="sales-return-list"),
    path("sales-return/", sales_return_collection_view, name="sales-return-create"),
    path("sales-return/<uuid:pk>/", sales_return_detail_view, name="sales-return-detail"),
    # Estimate Voucher endpoints
    path("estimates/", estimate_collection_view, name="estimate-list"),
    path("estimates/gold-qualities/", estimate_gold_qualities_view, name="estimate-gold-qualities"),
    path("estimates/pdf/", estimate_pdf_view, name="estimate-pdf"),
    path(
        "estimates/pdf/calibration/", estimate_pdf_calibration_view, name="estimate-pdf-calibration"
    ),
    path("estimates/landscape-pdf/", estimate_landscape_pdf_view, name="estimate-landscape-pdf"),
    path(
        "estimates/landscape-pdf/calibration/",
        estimate_landscape_pdf_calibration_view,
        name="estimate-landscape-pdf-calibration",
    ),
    path("estimates/<uuid:pk>/", estimate_detail_view, name="estimate-detail"),
    # Raw Material Purchase endpoints
    path(
        "raw-material-purchases/",
        raw_material_purchase_list_create,
        name="raw-material-purchase-list",
    ),
    path(
        "raw-material-purchases/aggregates/",
        raw_material_purchase_aggregates,
        name="raw-material-purchase-aggregates",
    ),
    path(
        "raw-material-purchases/suppliers/",
        raw_material_suppliers_view,
        name="raw-material-purchase-suppliers",
    ),
    path(
        "raw-material-purchases/field-schema/",
        raw_material_field_schema,
        name="raw-material-purchase-field-schema",
    ),
    path(
        "raw-material-purchases/<uuid:pk>/",
        raw_material_purchase_detail,
        name="raw-material-purchase-detail",
    ),
    # Raw Material Inventory endpoints
    path(
        "raw-material-inventory/",
        raw_material_inventory_list,
        name="raw-material-inventory-list",
    ),
    path(
        "raw-material-inventory/summary/",
        raw_material_inventory_summary,
        name="raw-material-inventory-summary",
    ),
    # Raw Material Issuance endpoints
    path(
        "raw-material-issuances/",
        raw_material_issuance_list_create,
        name="raw-material-issuance-list",
    ),
    path(
        "raw-material-issuances/<uuid:pk>/",
        raw_material_issuance_detail,
        name="raw-material-issuance-detail",
    ),
    # Daily Book Close endpoints
    path(
        "daily-book-close/",
        daily_book_close_list_create,
        name="daily-book-close-list",
    ),
    path(
        "daily-book-close/status/",
        daily_book_close_status,
        name="daily-book-close-status",
    ),
    # Daily Report endpoints
    path(
        "daily-reports/",
        daily_report_list_create,
        name="daily-report-list",
    ),
    path(
        "daily-reports/dashboard/",
        daily_report_dashboard,
        name="daily-report-dashboard",
    ),
    # Orders dropdown for raw material purchase
    path(
        "orders/dropdown/",
        orders_dropdown,
        name="orders-dropdown",
    ),
    # Order search by ID (bill_no or job_no)
    path(
        "orders/search/",
        search_order_by_id,
        name="order-search",
    ),
    # 3D Design endpoints
    path(
        "3d-designs/overview/",
        three_d_design_overview_view,
        name="3d-design-overview",
    ),
    path(
        "3d-designs/",
        three_d_design_collection_view,
        name="3d-design-list",
    ),
    path(
        "3d-designs/add/",
        three_d_design_collection_view,
        name="3d-design-add",
    ),
    path(
        "3d-designs/<uuid:pk>/",
        three_d_design_detail_view,
        name="3d-design-detail",
    ),
    # 2D Design endpoints
    path(
        "2d-designs/overview/",
        two_d_design_overview_view,
        name="2d-design-overview",
    ),
    path(
        "2d-designs/",
        two_d_design_collection_view,
        name="2d-design-list",
    ),
    path(
        "2d-designs/add/",
        two_d_design_collection_view,
        name="2d-design-add",
    ),
    path(
        "2d-designs/<uuid:pk>/",
        two_d_design_detail_view,
        name="2d-design-detail",
    ),
    # 3D Printing/CAM Piece endpoints
    path(
        "3d-printing-cam/overview/",
        three_d_printing_cam_overview_view,
        name="3d-printing-cam-overview",
    ),
    path(
        "3d-printing-cam/",
        three_d_printing_cam_collection_view,
        name="3d-printing-cam-list",
    ),
    path(
        "3d-printing-cam/add/",
        three_d_printing_cam_collection_view,
        name="3d-printing-cam-add",
    ),
    path(
        "3d-printing-cam/<uuid:pk>/",
        three_d_printing_cam_detail_view,
        name="3d-printing-cam-detail",
    ),
    # Ghat Approval endpoints
    path(
        "ghat-approval/overview/",
        ghat_approval_overview_view,
        name="ghat-approval-overview",
    ),
    path(
        "ghat-approval/",
        ghat_approval_collection_view,
        name="ghat-approval-list",
    ),
    path(
        "ghat-approval/add/",
        ghat_approval_collection_view,
        name="ghat-approval-add",
    ),
    path(
        "ghat-approval/<uuid:pk>/",
        ghat_approval_detail_view,
        name="ghat-approval-detail",
    ),
    # Ghat Quality Check endpoints
    path(
        "ghat-quality-check/overview/",
        ghat_quality_check_overview_view,
        name="ghat-quality-check-overview",
    ),
    path(
        "ghat-quality-check/",
        ghat_quality_check_collection_view,
        name="ghat-quality-check-list",
    ),
    path(
        "ghat-quality-check/add/",
        ghat_quality_check_collection_view,
        name="ghat-quality-check-add",
    ),
    path(
        "ghat-quality-check/<uuid:pk>/",
        ghat_quality_check_detail_view,
        name="ghat-quality-check-detail",
    ),
    # Stone Demand to Bagging endpoints
    path(
        "stone-demand-to-bagging/overview/",
        stone_demand_to_bagging_overview_view,
        name="stone-demand-to-bagging-overview",
    ),
    path(
        "stone-demand-to-bagging/",
        stone_demand_to_bagging_collection_view,
        name="stone-demand-to-bagging-list",
    ),
    path(
        "stone-demand-to-bagging/add/",
        stone_demand_to_bagging_collection_view,
        name="stone-demand-to-bagging-add",
    ),
    path(
        "stone-demand-to-bagging/<uuid:pk>/",
        stone_demand_to_bagging_detail_view,
        name="stone-demand-to-bagging-detail",
    ),
    path(
        "ghat-approvals/",
        ghat_approval_collection_view,
        name="ghat-approval-list",
    ),
    path(
        "ghat-approvals/<uuid:pk>/",
        ghat_approval_detail_view,
        name="ghat-approval-detail",
    ),
    # Ghat Quality Check endpoints
    path(
        "ghat-quality-checks/",
        ghat_quality_check_collection_view,
        name="ghat-quality-check-list",
    ),
    path(
        "ghat-quality-checks/<uuid:pk>/",
        ghat_quality_check_detail_view,
        name="ghat-quality-check-detail",
    ),
    # Stone Demand to Bagging endpoints
    path(
        "stone-demand-to-bagging/",
        stone_demand_to_bagging_collection_view,
        name="stone-demand-to-bagging-list",
    ),
    path(
        "stone-demand-to-bagging/<uuid:pk>/",
        stone_demand_to_bagging_detail_view,
        name="stone-demand-to-bagging-detail",
    ),
    # Pre-Rhodium Quality Check endpoints
    path(
        "pre-rhodium-quality-checks/overview/",
        pre_rhodium_quality_check_overview_view,
        name="pre-rhodium-quality-check-overview",
    ),
    path(
        "pre-rhodium-quality-checks/",
        pre_rhodium_quality_check_collection_view,
        name="pre-rhodium-quality-check-list",
    ),
    path(
        "pre-rhodium-quality-checks/add/",
        pre_rhodium_quality_check_collection_view,
        name="pre-rhodium-quality-check-add",
    ),
    path(
        "pre-rhodium-quality-checks/<uuid:pk>/",
        pre_rhodium_quality_check_detail_view,
        name="pre-rhodium-quality-check-detail",
    ),
    # Final Quality Check endpoints
    path(
        "final-quality-checks/",
        final_quality_check_collection_view,
        name="final-quality-check-list",
    ),
    path(
        "final-quality-checks/<uuid:pk>/",
        final_quality_check_detail_view,
        name="final-quality-check-detail",
    ),
    # Item Final Packing List endpoints
    path(
        "item-final-packing-lists/overview/",
        item_final_packing_list_overview_view,
        name="item-final-packing-list-overview",
    ),
    path(
        "item-final-packing-lists/",
        item_final_packing_list_collection_view,
        name="item-final-packing-list-list",
    ),
    path(
        "item-final-packing-lists/add/",
        item_final_packing_list_collection_view,
        name="item-final-packing-list-add",
    ),
    path(
        "item-final-packing-lists/<uuid:pk>/",
        item_final_packing_list_detail_view,
        name="item-final-packing-list-detail",
    ),
    # Raw Material Tally endpoints
    path(
        "raw-material-tallies/overview/",
        raw_material_tally_overview_view,
        name="raw-material-tally-overview",
    ),
    path(
        "raw-material-tallies/",
        raw_material_tally_collection_view,
        name="raw-material-tally-list",
    ),
    path(
        "raw-material-tallies/add/",
        raw_material_tally_collection_view,
        name="raw-material-tally-add",
    ),
    path(
        "raw-material-tallies/<uuid:pk>/",
        raw_material_tally_detail_view,
        name="raw-material-tally-detail",
    ),
    # Metal Issue endpoints
    path(
        "metal-issues/",
        metal_issue_collection_view,
        name="metal-issue-list",
    ),
    path(
        "metal-issues/<uuid:pk>/",
        metal_issue_detail_view,
        name="metal-issue-detail",
    ),
    # Bagging Ready endpoints
    path(
        "bagging-ready/",
        bagging_ready_collection_view,
        name="bagging-ready-list",
    ),
    path(
        "bagging-ready/<uuid:pk>/",
        bagging_ready_detail_view,
        name="bagging-ready-detail",
    ),
    # Diamond Purchase/Issue endpoints
    path(
        "diamond-purchase-issue/",
        diamond_purchase_issue_collection_view,
        name="diamond-purchase-issue-list",
    ),
    path(
        "diamond-purchase-issue/<uuid:pk>/",
        diamond_purchase_issue_detail_view,
        name="diamond-purchase-issue-detail",
    ),
    # Gemstone Purchase/Issue endpoints
    path(
        "gemstone-purchase-issue/",
        gemstone_purchase_issue_collection_view,
        name="gemstone-purchase-issue-list",
    ),
    path(
        "gemstone-purchase-issue/<uuid:pk>/",
        gemstone_purchase_issue_detail_view,
        name="gemstone-purchase-issue-detail",
    ),
    path("order-id/preview/", order_id_preview_view, name="order-id-preview"),
    path("order-id/sequences/", order_sequence_status_view, name="order-sequence-status"),
    # Invoice endpoints
    path("vouchers/invoices/", invoice_collection_view, name="invoice-list"),
    path("vouchers/invoices/<uuid:pk>/", invoice_detail_view, name="invoice-detail"),
    path("vouchers/invoices/from-sale/", invoice_from_sale_view, name="invoice-from-sale"),
    path(
        "vouchers/invoices/from-estimate/", invoice_from_estimate_view, name="invoice-from-estimate"
    ),
    path(
        "vouchers/invoices/<uuid:pk>/record-payment/",
        invoice_record_payment_view,
        name="invoice-record-payment",
    ),
    path("vouchers/invoices/<uuid:pk>/pdf/", invoice_pdf_view, name="invoice-pdf"),
    path("vouchers/invoices/stats/", invoice_stats_view, name="invoice-stats"),
]
