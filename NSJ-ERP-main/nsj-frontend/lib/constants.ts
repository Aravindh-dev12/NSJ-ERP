/**
 * Application constants and API endpoint definitions.
 */

// Keep without trailing slash to avoid double slashes when concatenating with endpoints.
// In Next.js, NEXT_PUBLIC_ env vars are inlined at build time

let envApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
if (envApiUrl.startsWith("http")) {

  envApiUrl = "/api";
}
export const API_BASE_URL = envApiUrl;

// Media base URL (without /api suffix) for serving uploaded files
export const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "https://nsj-backend-production-6642.up.railway.app";

// Helper function to get full media URL from a relative path
export const getMediaUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  // If already a full URL, return as-is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  // Otherwise prepend the media base URL
  return `${MEDIA_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
    CSRF: "/auth/csrf",
  },
  PAYMENT_VOUCHERS: {
    ROOT: "/payment-vouchers/",
    DETAIL: (id: number | string) => `/payment-vouchers/${id}/`,
    OVERVIEW: "/payment-vouchers/overview/",
    NEXT_NO: "/payment-vouchers/next-no/",
  },
  JOURNAL_VOUCHERS: {
    ROOT: "/journal-vouchers/",
    DETAIL: (id: number | string) => `/journal-vouchers/${id}/`,
    OVERVIEW: "/journal-vouchers/overview/",
    NEXT_NO: "/journal-vouchers/next-no/",
  },
  CONTRA_VOUCHERS: {
    ROOT: "/contra-vouchers/",
    DETAIL: (id: number | string) => `/contra-vouchers/${id}/`,
    OVERVIEW: "/contra-vouchers/overview/",
    NEXT_NO: "/contra-vouchers/next-no/",
  },
  COMPANIES: "/companies/",
  ACCOUNTS: {
    ROOT: "/accounts/",
    DETAIL: (id: number | string) => `/accounts/${id}/`,
    LEDGER_BALANCE: (id: number | string) => `/accounts/${id}/ledger-balance/`,
    EXPORT: (id: number | string) => `/accounts/${id}/export/`,
    EXPORT_ALL: "/accounts/export/",
    MASTERS: "/accounts/masters/",
    DROPDOWN: "/accounts/dropdown/",
    SUBACCOUNTS: {
      ROOT: "/accounts/sub-accounts/",
      DETAIL: (id: number | string) => `/accounts/sub-accounts/${id}/`,
      EXPORT: "/accounts/sub-accounts/export/",
    },
    AC_GROUPS: {
      MASTERS: "/accounts/ac-groups/masters/",
      ROOT: "/accounts/ac-groups/",
      DETAIL: (id: number | string) => `/accounts/ac-groups/${id}/`,
    },
    TRANSACTIONS: {
      ROOT: "/accounts/transactions/",
      TALLY_EXPORT: "/accounts/transactions/tally-export/",
    },
  },
  SALES_RECORDS: {
    ROOT: "/sales-records",
    UPLOAD: "/sales-records/upload",
    AGGREGATES: "/sales-records/aggregates",
    EXPORT: "/sales-records/export",
  },
  USERS: {
    ME: "/users/me",
  },
  TEMPLATES: {
    ROOT: "/templates",
    DETAIL: (id: number | string) => `/templates/${id}`,
  },
  VENDORS: {
    ROOT: "/vendors",
    DETAIL: (id: number | string) => `/vendors/${id}`,
  },
  INVOICES: {
    ROOT: "/invoices",
    DETAIL: (id: number | string) => `/invoices/${id}`,
    PENDING: "/invoices/pending",
    UPLOAD: "/invoices/upload",
  },
  VOUCHERS: {
    ROOT: "/vouchers/",
    AGGREGATES: "/vouchers/aggregates/",
    EXPORT_ALL: "/vouchers/export/",
    MASTERS: {
      ROOT: "/vouchers/masters/",
      METAL_TYPES: "/vouchers/masters/metal-types/",
      SHAPES: "/vouchers/masters/shapes/",
      COLOURS: "/vouchers/masters/colours/",
      CLARITIES: "/vouchers/masters/clarities/",
      LABS: "/vouchers/masters/labs/",
      ORIGINS: "/vouchers/masters/origins/",
      GEMSTONES: "/vouchers/masters/gemstones/",
      GEMSTONE_SHAPES: "/vouchers/masters/gemstone-shapes/",
      GEMSTONE_COLORS: "/vouchers/masters/gemstone-colors/",
      GEMSTONE_CLARITIES: "/vouchers/masters/gemstone-clarities/",
      GEMSTONE_TREATMENTS: "/vouchers/masters/gemstone-treatments/",
    },
    DETAIL: (id: number | string) => `/vouchers/${id}/`,
    EXPORT: (id: number | string) => `/vouchers/${id}/export/`,
    PAYMENTS: {
      APPROVAL_LOOSE: {
        ROOT: "/payments/approval-loose/",
        DETAIL: (id: number | string) => `/payments/approval-loose/${id}/`,
      },
      APPROVAL_TAG: {
        ROOT: "/payments/approval-tag/",
        DETAIL: (id: number | string) => `/payments/approval-tag/${id}/`,
      },
      PUR_AND_APPROVAL: {
        ROOT: "/payments/pur-and-approval/",
        DETAIL: (id: number | string) => `/payments/pur-and-approval/${id}/`,
      },
      PURCHASE_DIAMOND: {
        ROOT: "/payments/purchase-diamond/",
        DETAIL: (id: number | string) => `/payments/purchase-diamond/${id}/`,
      },
      PURCHASE_M: {
        ROOT: "/payments/purchase-m/",
        DETAIL: (id: number | string) => `/payments/purchase-m/${id}/`,
      },
      PURCHASE_TAGWISE: {
        ROOT: "/payments/purchase-tagwise/",
        DETAIL: (id: number | string) => `/payments/purchase-tagwise/${id}/`,
      },
      REPAIR: {
        ROOT: "/payments/repair/",
        DETAIL: (id: number | string) => `/payments/repair/${id}/`,
        EXPORT: (id: number | string) => `/payments/repair/${id}/export/`,
        EXPORT_ALL: "/payments/repair/export/",
      },
      PAYMENT: {
        ROOT: "/payments/payment/",
        DETAIL: (id: number | string) => `/payments/payment/${id}/`,
      },
      JOURNAL: {
        ROOT: "/payments/journal/",
        DETAIL: (id: number | string) => `/payments/journal/${id}/`,
      },
    },
  },
  ISSUES: {
    REPAIR_ISSUES: {
      // Exposed under vouchers payments namespace: /payments/repair-issues/
      ROOT: "/payments/repair-issues/",
      DETAIL: (id: number | string) => `/payments/repair-issues/${id}/`,
    },
    ORDER_ISSUES: {
      // Exposed under vouchers payments namespace: /payments/order-issues/
      ROOT: "/payments/order-issues/",
      DETAIL: (id: number | string) => `/payments/order-issues/${id}/`,
    },
    QUERIES: {
      // Query endpoints for customer inquiries before advance payment
      ROOT: "/payments/queries/",
      DETAIL: (id: number | string) => `/payments/queries/${id}/`,
      ARCHIVE: (id: number | string) => `/payments/queries/${id}/archive/`,
      REOPEN: (id: number | string) => `/payments/queries/${id}/reopen/`,
      CONVERT_TO_ORDER: (id: number | string) =>
        `/payments/queries/${id}/convert_to_order/`,
      AUTO_ARCHIVE: "/payments/queries/auto_archive/",
    },
  },
  SALES_QUERIES: {
    ROOT: "/sales-queries/",
    DETAIL: (id: number | string) => `/sales-queries/${id}/`,
    STATS: "/sales-queries/dashboard-stats/",
    AVAILABLE_ESTIMATES: "/sales-queries/available-estimates/",
    LIST_ESTIMATES: (id: string) => `/sales-queries/${id}/list_estimates/`,
    CREATE_ESTIMATE: "/sales-queries/create-estimate/",
    CREATE_ESTIMATE_VARIATION: (id: string | number) =>
      `/sales-queries/${id}/create_estimate_variation/`,
    ESTIMATE_SUMMARY: (id: string | number) =>
      `/sales-queries/${id}/estimate_summary/`,
    SELECT_FINAL_ESTIMATE: (id: string | number) =>
      `/sales-queries/${id}/select_final_estimate/`,
    CONVERT_TO_SALE: (id: string | number) =>
      `/sales-queries/${id}/convert_to_sale/`,
    UPDATE_WORKFLOW_STATUS: (id: string | number) =>
      `/sales-queries/${id}/update_workflow_status/`,
    AVAILABLE_BASE_ESTIMATES: (id: string | number) =>
      `/sales-queries/${id}/available_base_estimates/`,
    JEWELRY_TYPES: "/sales-queries/jewelry-types/",
    CONVERT_TO_ORDER: (id: number | string) =>
      `/sales-queries/${id}/initiate-order-conversion/`,
  },
  CORE: {
    GOLD_QUALITIES: "/masters/gold-qualities/",
  },
  SALES: {
    ROOT: "/sales/",
    DETAIL: (id: number | string) => `/sales/${id}/`,
    ESTIMATES: (id: number | string) => `/sales/${id}/estimates/`,
    SELECT_ESTIMATE: (id: number | string) => `/sales/${id}/select_estimate/`,
    DESELECT_ESTIMATE: (id: number | string) =>
      `/sales/${id}/deselect_estimate/`,
    CONVERT_TO_ORDER: (id: number | string) => `/sales/${id}/convert_to_order/`,
    EXPORT: (id: number | string) => `/sales/${id}/export/`,
    EXPORT_ALL: "/sales/export/",
    PDF: "/sales/pdf/",
    INITIATE_ORDER_CONVERSION: (id: number | string) =>
      `/sales/${id}/initiate-order-conversion/`,
  },
  ORDER_DRAFTS: {
    DETAIL: (id: number | string) => `/order-drafts/${id}/`,
    PROCESS_STEPS: (id: number | string) =>
      `/order-drafts/${id}/process-steps/`,
    CONFIRM: (id: number | string) => `/order-drafts/${id}/confirm/`,
  },
  ORDERS: {
    PROCESS_STEPS: (id: number | string) => `/orders/${id}/process-steps/`,
    STEP_STATUS: (orderId: number | string, stepName: string) =>
      `/orders/${orderId}/process-steps/${encodeURIComponent(stepName)}/step-status/`,
    MARK_DONE_STEP: (orderId: number | string, stepId: number | string) =>
      `/orders/${orderId}/process-steps/${stepId}/mark-done/`,
    SAVE_STEP: (orderId: number | string, stepName: string) =>
      `/orders/${orderId}/process-steps/${encodeURIComponent(stepName)}/save/`,
    ESTIMATE_APPROVAL: (id: number | string) =>
      `/orders/${id}/estimate-approval/`,
    COURIER_DISPATCHED: (id: number | string) =>
      `/orders/${id}/courier-dispatched/`,
    CREATE_WITH_PROCESS: "/orders/create-with-process/",
    AUTO_COMPLETE_STEP: (id: number | string) =>
      `/orders/${id}/auto-complete-step/`,
    SEARCH: "/orders/search/",
  },
  PUR_RETURN: {
    ROOT: "/pur-return/",
    LIST: "/pur-return/list/",
    OVERVIEW: "/pur-return/overview/",
    DETAIL: (id: number | string) => `/pur-return/${id}/`,
  },
  RECEIVE: {
    ROOT: "/receive/",
    LIST: "/receive/list/",
    OVERVIEW: "/receive/overview/",
    DETAIL: (id: number | string) => `/receive/${id}/`,
  },
  RECEIPT: {
    ROOT: "/receipts/",
    LIST: "/receipts/list/",
    OVERVIEW: "/receipts/overview/",
    DETAIL: (id: number | string) => `/receipts/${id}/`,
    DROPDOWN: "/receipts/dropdown/",
    NEXT_VOUCHER_NO: "/receipts/next-voucher-no/",
  },
  SALES_RETURN: {
    ROOT: "/sales-return/",
    LIST: "/sales-return/list/",
    OVERVIEW: "/sales-return/overview/",
    DETAIL: (id: number | string) => `/sales-return/${id}/`,
  },
  ESTIMATES: {
    ROOT: "/estimates/",
    DETAIL: (id: number | string) => `/estimates/${id}/`,
    PDF: "/estimates/pdf/",
    LANDSCAPE_PDF: "/estimates/landscape-pdf/",
  },
  RAW_MATERIAL_PURCHASES: {
    ROOT: "/raw-material-purchases/",
    DETAIL: (id: number | string) => `/raw-material-purchases/${id}/`,
    AGGREGATES: "/raw-material-purchases/aggregates/",
    SUPPLIERS: "/raw-material-purchases/suppliers/",
  },
  RAW_MATERIAL_INVENTORY: {
    ROOT: "/raw-material-inventory/",
    SUMMARY: "/raw-material-inventory/summary/",
  },
  RAW_MATERIAL_ISSUANCES: {
    ROOT: "/raw-material-issuances/",
    DETAIL: (id: number | string) => `/raw-material-issuances/${id}/`,
  },
  DAILY_BOOK_CLOSE: {
    ROOT: "/daily-book-close/",
    STATUS: "/daily-book-close/status/",
  },
  DAILY_REPORTS: {
    ROOT: "/daily-reports/",
    DASHBOARD: "/daily-reports/dashboard/",
  },
  LIVE_RATES: "/live-rates/",
  CURRENCY_EXCHANGE: "/currency-exchange/",
  CALCULATE_MATERIAL_PRICE: "/calculate-material-price/",
  ORDERS_DROPDOWN: "/orders/dropdown/",
  THREE_D_DESIGNS: {
    ROOT: "/3d-designs/",
    DETAIL: (id: number | string) => `/3d-designs/${id}/`,
  },
  TWO_D_DESIGNS: {
    ROOT: "/2d-designs/",
    DETAIL: (id: number | string) => `/2d-designs/${id}/`,
  },
  THREE_D_PRINTING_CAM: {
    ROOT: "/3d-printing-cam/",
    OVERVIEW: "/3d-printing-cam/overview/",
    DETAIL: (id: number | string) => `/3d-printing-cam/${id}/`,
  },
  GHAT_APPROVALS: {
    ROOT: "/ghat-approvals/",
    DETAIL: (id: number | string) => `/ghat-approvals/${id}/`,
  },
  GHAT_QUALITY_CHECKS: {
    ROOT: "/ghat-quality-checks/",
    DETAIL: (id: number | string) => `/ghat-quality-checks/${id}/`,
  },
  STONE_DEMAND_TO_BAGGING: {
    ROOT: "/stone-demand-to-bagging/",
    DETAIL: (id: number | string) => `/stone-demand-to-bagging/${id}/`,
  },
  PRE_RHODIUM_QUALITY_CHECKS: {
    ROOT: "/pre-rhodium-quality-checks/",
    DETAIL: (id: number | string) => `/pre-rhodium-quality-checks/${id}/`,
  },
  FINAL_QUALITY_CHECKS: {
    ROOT: "/final-quality-checks/",
    DETAIL: (id: number | string) => `/final-quality-checks/${id}/`,
  },
  ITEM_FINAL_PACKING_LISTS: {
    ROOT: "/item-final-packing-lists/",
    DETAIL: (id: number | string) => `/item-final-packing-lists/${id}/`,
  },
  RAW_MATERIAL_TALLIES: {
    ROOT: "/raw-material-tallies/",
    OVERVIEW: "/raw-material-tallies/overview/",
    DETAIL: (id: number | string) => `/raw-material-tallies/${id}/`,
  },
  METAL_ISSUES: {
    ROOT: "/metal-issues/",
    DETAIL: (id: number | string) => `/metal-issues/${id}/`,
  },
  BAGGING_READY: {
    ROOT: "/bagging-ready/",
    DETAIL: (id: number | string) => `/bagging-ready/${id}/`,
  },
  DIAMOND_PURCHASE_ISSUE: {
    ROOT: "/diamond-purchase-issue/",
    DETAIL: (id: number | string) => `/diamond-purchase-issue/${id}/`,
  },
  GEMSTONE_PURCHASE_ISSUE: {
    ROOT: "/gemstone-purchase-issue/",
    DETAIL: (id: number | string) => `/gemstone-purchase-issue/${id}/`,
  },
  REMINDERS: {
    ROOT: "/reminders",
    DETAIL: (id: number | string) => `/reminders/${id}`,
    BY_INVOICE: (invoiceId: number | string) =>
      `/reminders/invoice/${invoiceId}`,
  },
  HEALTH: "/health",
  MASTERS: {
    SIZES: "/masters/sizes/",
    VOUCHERS_MASTER: "/vouchers/masters/",
  },
  REPORTS: {
    ACCOUNT_REPORT: {
      ROOT: "/reports/account-report/",
    },
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;

export const TASK_URGENCY_COLORS = {
  LOW: "bg-slate-100 text-slate-700 border-slate-200",
  MEDIUM: "bg-blue-100 text-blue-700 border-blue-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  URGENT: "bg-red-100 text-red-700 border-red-200 animate-pulse",
} as const;

export const TASK_STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  COMPLETED: "bg-green-100 text-green-700 border-green-200",
  STUCK: "bg-red-100 text-red-700 border-red-200",
  NEED_FOUNDER: "bg-purple-100 text-purple-700 border-purple-200",
  TRANSFERRED: "bg-blue-100 text-blue-700 border-blue-200",
} as const;

export const ORDER_TYPE_OPTIONS = [
  { value: "STOCK_JEWELRY", label: "Stock Jewelry (Prefix A)" },
  { value: "BESPOKE_NATURAL", label: "Bespoke Natural (Prefix B)" },
  { value: "BESPOKE_CVD", label: "Bespoke CVD (Prefix C)" },
  { value: "LOOSE_DIAMONDS", label: "Loose Diamonds (Prefix D)" },
];

export const JEWELRY_TYPE_MAPPING: Record<string, string[]> = {
  STOCK_JEWELRY: [
    "Ring",
    "Bangle",
    "Necklace",
    "Earrings",
    "Bracelet",
    "Chain",
    "Pendant",
    "Anklet",
  ],
  BESPOKE_NATURAL: [
    "Custom Ring (Natural)",
    "Bespoke Necklace (Natural)",
    "Custom Earrings (Natural)",
  ],
  BESPOKE_CVD: [
    "Custom Ring (CVD)",
    "Bespoke Necklace (CVD)",
    "Custom Earrings (CVD)",
  ],
  LOOSE_DIAMONDS: ["Loose Diamond", "Diamond Stone", "Unset Diamond"],
};
