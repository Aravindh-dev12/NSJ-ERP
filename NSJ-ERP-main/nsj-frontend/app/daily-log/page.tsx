"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  Plus,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  ShoppingBag,
  Truck,
  Undo2,
  RotateCcw,
  Wrench,
  Layers,
  FileText,
  Workflow,
  CheckSquare,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  receiptList,
  paymentsList,
  journalsList,
  contraList,
  salesList,
  salesReturnList,
  purReturnList,
  purchaseMList,
  repairList,
  vouchersList,
  receiveList,
  metalIssueList,
  orderIssueList,
  getSalesQueries,
  rawMaterialPurchaseList,
  gemstonePurchaseIssueList,
  preRhodiumQualityCheckList,
  itemFinalPackingListList,
  rawMaterialTallyList,
  ghatApprovalList,
  estimatesList,
} from "@/lib/backend";
import { cn } from "@/lib/utils";

type CategoryFilter =
  | "all"
  | "accounting"
  | "sales"
  | "production"
  | "inventory";

interface CategoryColorScheme {
  color: string;
  bgColor: string;
  borderColor: string;
}

const CATEGORY_COLORS: Record<CategoryFilter, CategoryColorScheme> = {
  all: {
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-100",
  },
  accounting: {
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
  },
  sales: {
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-100",
  },
  production: {
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-100",
  },
  inventory: {
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-100",
  },
};

interface LogEntry {
  id: string;
  date: string;
  party_name?: string | { name: string; account_name?: string } | null;
  account?: { account_name?: string; name?: string } | null;
  amount?: number | string;
  cr?: number | string;
  dr?: number | string;
  grand_total?: number | string;
  voucher_no?: string;
  narration?: string;
}

interface LogTypeConfig {
  id: string;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  addRoute: string;
  viewAllRoute: string;
  fetcher: any;
  category: CategoryFilter; // Category for filtering
}

const LOG_TYPES: LogTypeConfig[] = [
  {
    id: "receipt",
    label: "Receipt",
    icon: ArrowDownLeft,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-100",
    addRoute: "/vouchers/receipt/new",
    viewAllRoute: "/vouchers/receipt/list",
    fetcher: receiptList,
    category: "accounting",
  },
  {
    id: "payment",
    label: "Payment",
    icon: ArrowUpRight,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-100",
    addRoute: "/vouchers/payment/new",
    viewAllRoute: "/vouchers/payment/list",
    fetcher: paymentsList,
    category: "accounting",
  },
  {
    id: "journal",
    label: "Journal",
    icon: RefreshCw,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
    addRoute: "/vouchers/journal/new",
    viewAllRoute: "/vouchers/journal/list",
    fetcher: journalsList,
    category: "accounting",
  },
  {
    id: "contra",
    label: "Contra",
    icon: Layers,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-100",
    addRoute: "/vouchers/contra/new",
    viewAllRoute: "/vouchers/contra/list",
    fetcher: contraList,
    category: "accounting",
  },
  {
    id: "estimate",
    label: "Estimate",
    icon: FileText,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-100",
    addRoute: "/vouchers/estimates/new",
    viewAllRoute: "/vouchers/estimate/list",
    fetcher: estimatesList,
    category: "accounting",
  },
  {
    id: "sales",
    label: "Sales",
    icon: ShoppingBag,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-100",
    addRoute: "/vouchers/sale/new",
    viewAllRoute: "/vouchers/sale/list",
    fetcher: salesList,
    category: "sales",
  },
  {
    id: "purchase",
    label: "Purchase",
    icon: ShoppingBag,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50/50",
    borderColor: "border-indigo-100",
    addRoute: "/vouchers/purchase/new",
    viewAllRoute: " ",
    fetcher: purchaseMList,
    category: "inventory",
  },
  {
    id: "sales-return",
    label: "Sales Return",
    icon: Undo2,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-100",
    addRoute: "/vouchers/sales-return/add-new",
    viewAllRoute: "/vouchers/sales-return/list",
    fetcher: salesReturnList,
    category: "sales",
  },
  {
    id: "pur-return",
    label: "Pur. Return",
    icon: RotateCcw,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-100",
    addRoute: "/vouchers/pur-return/add-new",
    viewAllRoute: "/vouchers/pur-return/list",
    fetcher: purReturnList,
    category: "inventory",
  },
  {
    id: "repair",
    label: "Repair",
    icon: Wrench,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-100",
    addRoute: "/vouchers/repair/new",
    viewAllRoute: "/vouchers/repair/list",
    fetcher: repairList,
    category: "production",
  },
  {
    id: "orders",
    label: "Order",
    icon: FileText,
    color: "text-fuchsia-600",
    bgColor: "bg-fuchsia-50",
    borderColor: "border-fuchsia-100",
    addRoute: "/vouchers/new/",
    viewAllRoute: "/vouchers/list",
    fetcher: vouchersList,
    category: "production",
  },
  {
    id: "issues",
    label: "Issue",
    icon: Tag,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-100",
    addRoute: "/issues/new",
    viewAllRoute: "/issues/list",
    fetcher: orderIssueList,
    category: "production",
  },
  {
    id: "metal-issue",
    label: "Metal Issue",
    icon: ArrowUpRight,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
    addRoute: "/process/metal-issue",
    viewAllRoute: "/process/metal-issue",
    fetcher: metalIssueList,
    category: "production",
  },
  {
    id: "receive",
    label: "Receive",
    icon: ArrowDownLeft,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-100",
    addRoute: "/vouchers/receive/new",
    viewAllRoute: "/vouchers/receive/list",
    fetcher: receiveList,
    category: "production",
  },
  {
    id: "sales-queries",
    label: "Sales Leads",
    icon: FileText,
    color: "text-blue-500",
    bgColor: "bg-blue-50/50",
    borderColor: "border-blue-100",
    addRoute: "/vouchers/sales-leads/new",
    viewAllRoute: "/vouchers/sales-leads/list",
    fetcher: getSalesQueries,
    category: "sales",
  },
  {
    id: "raw-material-purchase",
    label: "Raw Material Purchase",
    icon: ShoppingBag,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50/50",
    borderColor: "border-emerald-100",
    addRoute: "/raw-material-purchase/new",
    viewAllRoute: "/raw-material-purchase",
    fetcher: rawMaterialPurchaseList,
    category: "inventory",
  },
  {
    id: "gemstone-issue",
    label: "Gemstone Purchase/Issue",
    icon: Workflow,
    color: "text-fuchsia-500",
    bgColor: "bg-fuchsia-50/50",
    borderColor: "border-fuchsia-100",
    addRoute: "/process/gemstone-purchase-issue",
    viewAllRoute: "/process/gemstone-purchase-issue",
    fetcher: gemstonePurchaseIssueList,
    category: "production",
  },
  {
    id: "pre-rhodium-qa",
    label: "Pre-Rhodium QA",
    icon: Wrench,
    color: "text-teal-500",
    bgColor: "bg-teal-50/50",
    borderColor: "border-teal-100",
    addRoute: "/process/pre-rhodium-quality-check/add",
    viewAllRoute: "/process/pre-rhodium-quality-check/list",
    fetcher: preRhodiumQualityCheckList,
    category: "production",
  },
  {
    id: "final-packing",
    label: "Final Packing",
    icon: Truck,
    color: "text-violet-500",
    bgColor: "bg-violet-50/50",
    borderColor: "border-violet-100",
    addRoute: "/process/item-final-packing-list/add",
    viewAllRoute: "/process/item-final-packing-list/list",
    fetcher: itemFinalPackingListList,
    category: "production",
  },
  {
    id: "raw-material-tally",
    label: "Raw Material Tally",
    icon: RotateCcw,
    color: "text-rose-500",
    bgColor: "bg-rose-50/50",
    borderColor: "border-rose-100",
    addRoute: "/process/raw-material-tally/add",
    viewAllRoute: "/process/raw-material-tally/list",
    fetcher: rawMaterialTallyList,
    category: "production",
  },
  {
    id: "ghat-approval",
    label: "Ghat Approval",
    icon: CheckSquare,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50/50",
    borderColor: "border-indigo-100",
    addRoute: "/process/ghat-approval/add",
    viewAllRoute: "/process/ghat-approval/list",
    fetcher: ghatApprovalList,
    category: "production",
  },
];

export default function DailyLogPage() {
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [data, setData] = useState<
    Record<string, { count: number; results: LogEntry[] }>
  >({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  // Filter log types based on active category
  const filteredLogTypes = useMemo(() => {
    if (activeCategory === "all") return LOG_TYPES;
    return LOG_TYPES.filter((type) => type.category === activeCategory);
  }, [activeCategory]);

  // Calculate category counts for badges
  const categoryCounts = useMemo(() => {
    const counts = {
      all: LOG_TYPES.length,
      accounting: 0,
      sales: 0,
      production: 0,
      inventory: 0,
    };

    LOG_TYPES.forEach((type) => {
      counts[type.category]++;
    });

    return counts;
  }, []);

  const fetchLogs = useCallback(async () => {
    LOG_TYPES.forEach(async (type) => {
      setLoading((prev) => ({ ...prev, [type.id]: true }));
      try {
        const response = await type.fetcher({
          date: date,
          ordering: "-id",
          page_size: 100,
        });

        // Strict client-side date filter
        const entries = Array.isArray(response)
          ? response
          : response.results || response.items || [];
        const filteredEntries = entries.filter((r: any) => {
          if (!r.date) return false;
          // r.date is usually 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:MM:SSZ'
          return String(r.date).startsWith(date);
        });

        setData((prev) => ({
          ...prev,
          [type.id]: {
            count: filteredEntries.length,
            results: filteredEntries,
          },
        }));
      } catch (error) {
        console.error(`Failed to fetch ${type.label} logs:`, error);
      } finally {
        setLoading((prev) => ({ ...prev, [type.id]: false }));
      }
    });
  }, [date]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 bg-[#fafafa] min-h-screen">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Daily Transaction Log
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Unified view of all vouchers and records
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 h-11 w-full sm:w-[180px] border-gray-200 focus:ring-fuchsia-500 rounded-xl font-bold text-sm"
            />
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Filter by Category
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeCategory === "all"
                ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
            )}
          >
            All Entries
            <span
              className={cn(
                "ml-2 px-2 py-0.5 rounded-full text-xs font-black",
                activeCategory === "all"
                  ? "bg-white/20 text-white"
                  : "bg-gray-200 text-gray-700"
              )}
            >
              {categoryCounts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory("accounting")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeCategory === "accounting"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
            )}
          >
            Accounting
            <span
              className={cn(
                "ml-2 px-2 py-0.5 rounded-full text-xs font-black",
                activeCategory === "accounting"
                  ? "bg-white/20 text-white"
                  : "bg-blue-200 text-blue-800"
              )}
            >
              {categoryCounts.accounting}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory("sales")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeCategory === "sales"
                ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
            )}
          >
            Sales
            <span
              className={cn(
                "ml-2 px-2 py-0.5 rounded-full text-xs font-black",
                activeCategory === "sales"
                  ? "bg-white/20 text-white"
                  : "bg-amber-200 text-amber-800"
              )}
            >
              {categoryCounts.sales}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory("production")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeCategory === "production"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                : "bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200"
            )}
          >
            Production
            <span
              className={cn(
                "ml-2 px-2 py-0.5 rounded-full text-xs font-black",
                activeCategory === "production"
                  ? "bg-white/20 text-white"
                  : "bg-violet-200 text-violet-800"
              )}
            >
              {categoryCounts.production}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory("inventory")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeCategory === "inventory"
                ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20"
                : "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"
            )}
          >
            Inventory
            <span
              className={cn(
                "ml-2 px-2 py-0.5 rounded-full text-xs font-black",
                activeCategory === "inventory"
                  ? "bg-white/20 text-white"
                  : "bg-teal-200 text-teal-800"
              )}
            >
              {categoryCounts.inventory}
            </span>
          </button>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredLogTypes.map((type) => {
          const typeData = data[type.id] || { count: 0, results: [] };
          const isLoading = loading[type.id];
          const Icon = type.icon;

          // Use category colors based on the card's category
          const activeColorScheme =
            activeCategory !== "all"
              ? CATEGORY_COLORS[activeCategory]
              : CATEGORY_COLORS[type.category];

          return (
            <Card
              key={type.id}
              className={cn(
                "border overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 group rounded-2xl flex flex-col justify-between",
                activeColorScheme.borderColor
              )}
            >
              <CardHeader
                className={cn("p-4 border-b", activeColorScheme.bgColor)}
              >
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href={type.viewAllRoute}
                    className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-all cursor-pointer"
                  >
                    <div
                      className={cn(
                        "p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5 shrink-0",
                        activeColorScheme.color
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-lg font-black text-gray-900 truncate">
                        {type.label}
                      </CardTitle>
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest truncate">
                        {isLoading
                          ? "Loading..."
                          : `${typeData.count} entries today`}
                      </p>
                    </div>
                  </Link>
                  <Button
                    asChild
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-900 hover:bg-white shrink-0"
                  >
                    <Link href={type.addRoute}>
                      <Plus className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>

              <CardFooter className="p-3 bg-gray-50/50 border-t flex justify-center mt-auto">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:bg-white active:scale-95 transition-all"
                >
                  <Link
                    href={type.viewAllRoute}
                    className="flex items-center gap-2"
                  >
                    View All Records
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
