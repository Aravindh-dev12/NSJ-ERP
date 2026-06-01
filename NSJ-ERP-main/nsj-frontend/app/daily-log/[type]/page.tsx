"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  ShoppingBag,
  Truck,
  Undo2,
  RotateCcw,
  Wrench,
  Layers,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  receiptList,
  paymentsList,
  journalsList,
  contraList,
  salesList,
  purchaseMList,
  salesReturnList,
  purReturnList,
  repairList,
  receiveList,
  orderIssueList,
  metalIssueList,
} from "@/lib/backend";
import { cn } from "@/lib/utils";

interface LogTypeConfig {
  label: string;
  icon: any;
  color: string;
  fetcher: any;
  addRoute: string;
  columns: Array<{
    key: string;
    label: string;
    align?: "left" | "right" | "center";
    render?: (val: any, row: any) => React.ReactNode;
  }>;
}

const TABLE_CONFIGS: Record<string, LogTypeConfig> = {
  receipt: {
    label: "Receipt",
    icon: ArrowDownLeft,
    color: "text-emerald-600",
    addRoute: "/vouchers/receipt/new",
    fetcher: receiptList,
    columns: [
      { key: "date", label: "Date" },
      { key: "voucher_no", label: "Voucher No" },
      {
        key: "party_name",
        label: "Credit Party",
        render: (val) =>
          (typeof val === "object" ? val.account_name || val.name : val) || "—",
      },
      {
        key: "cr",
        label: "Cr Amount",
        align: "right",
        render: (val) =>
          `₹${parseFloat(String(val || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      },
      { key: "narration", label: "Narration" },
    ],
  },
  payment: {
    label: "Payment",
    icon: ArrowUpRight,
    color: "text-rose-600",
    addRoute: "/vouchers/payment/new",
    fetcher: paymentsList,
    columns: [
      { key: "date", label: "Date" },
      {
        key: "party_name",
        label: "Party",
        render: (val) =>
          (typeof val === "object" ? val.account_name || val.name : val) || "—",
      },
      {
        key: "dr",
        label: "Dr",
        align: "right",
        render: (val) =>
          `₹${parseFloat(String(val || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      },
      {
        key: "cr",
        label: "Cr",
        align: "right",
        render: (val) =>
          `₹${parseFloat(String(val || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      },
      { key: "narration", label: "Narration" },
    ],
  },
  journal: {
    label: "Journal",
    icon: RefreshCw,
    color: "text-blue-600",
    addRoute: "/vouchers/journal/new",
    fetcher: journalsList,
    columns: [
      { key: "date", label: "Date" },
      {
        key: "party_name",
        label: "Party",
        render: (val) =>
          (typeof val === "object" ? val.account_name || val.name : val) || "—",
      },
      {
        key: "dr",
        label: "Dr",
        align: "right",
        render: (val) =>
          `₹${parseFloat(String(val || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      },
      {
        key: "cr",
        label: "Cr",
        align: "right",
        render: (val) =>
          `₹${parseFloat(String(val || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      },
      { key: "narration", label: "Narration" },
    ],
  },
  sales: {
    label: "Sales",
    icon: ShoppingBag,
    color: "text-amber-600",
    addRoute: "/vouchers/sale/new",
    fetcher: salesList,
    columns: [
      { key: "date", label: "Date" },
      {
        key: "account",
        label: "Account",
        render: (val) =>
          (typeof val === "object" ? val.account_name || val.name : val) || "—",
      },
      { key: "item_name", label: "Item" },
      {
        key: "grand_total",
        label: "Total",
        align: "right",
        render: (val) =>
          `₹${parseFloat(String(val || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      },
    ],
  },
  purchase: {
    label: "Purchase",
    icon: Truck,
    color: "text-indigo-600",
    addRoute: "/vouchers/purchase/new",
    fetcher: purchaseMList,
    columns: [
      { key: "date", label: "Date" },
      { key: "party_name", label: "Party" },
      {
        key: "amount",
        label: "Amount",
        align: "right",
        render: (val) =>
          `₹${parseFloat(String(val || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      },
      { key: "narration", label: "Narration" },
    ],
  },
  "sales-return": {
    label: "Sales Return",
    icon: Undo2,
    color: "text-orange-600",
    addRoute: "/vouchers/sales-return/new",
    fetcher: salesReturnList,
    columns: [
      { key: "date", label: "Date" },
      { key: "account_name", label: "Account" },
      { key: "item_name", label: "Item" },
      {
        key: "amount",
        label: "Amount",
        align: "right",
        render: (val) =>
          `₹${parseFloat(String(val || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      },
    ],
  },
  "pur-return": {
    label: "Pur. Return",
    icon: RotateCcw,
    color: "text-teal-600",
    addRoute: "/vouchers/pur-return/new",
    fetcher: purReturnList,
    columns: [
      { key: "date", label: "Date" },
      { key: "party_name", label: "Party" },
      {
        key: "amount",
        label: "Amount",
        align: "right",
        render: (val) =>
          `₹${parseFloat(String(val || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      },
      { key: "narration", label: "Narration" },
    ],
  },
  repair: {
    label: "Repair",
    icon: Wrench,
    color: "text-violet-600",
    addRoute: "/vouchers/repair/new",
    fetcher: repairList,
    columns: [
      { key: "date", label: "Date" },
      {
        key: "account",
        label: "Account",
        render: (val) =>
          (typeof val === "object" ? val.account_name || val.name : val) || "—",
      },
      { key: "item_name", label: "Item" },
      {
        key: "amount",
        label: "Amount",
        align: "right",
        render: (val) =>
          `₹${parseFloat(String(val || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      },
    ],
  },
  contra: {
    label: "Contra",
    icon: Layers,
    color: "text-purple-600",
    addRoute: "/vouchers/contra/new",
    fetcher: contraList,
    columns: [
      { key: "date", label: "Date" },
      { key: "voucher_no", label: "Voucher No" },
      {
        key: "party_name",
        label: "Party",
        render: (val) =>
          (typeof val === "object" ? val.account_name || val.name : val) || "—",
      },
      {
        key: "dr",
        label: "Dr",
        align: "right",
        render: (val) =>
          `₹${parseFloat(String(val || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      },
      { key: "narration", label: "Narration" },
    ],
  },
  receive: {
    label: "Receive",
    icon: ArrowDownLeft,
    color: "text-emerald-600",
    addRoute: "/vouchers/receive/new",
    fetcher: receiveList,
    columns: [
      { key: "date", label: "Date" },
      {
        key: "account",
        label: "Account",
        render: (val) =>
          (typeof val === "object" ? val.account_name || val.name : val) || "—",
      },
      { key: "item_name", label: "Item" },
      {
        key: "amount",
        label: "Amount",
        align: "right",
        render: (val) =>
          `₹${parseFloat(String(val || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      },
    ],
  },
  "order-issues": {
    label: "Order Issues",
    icon: Tag,
    color: "text-red-600",
    addRoute: "/order-issues/new",
    fetcher: orderIssueList,
    columns: [
      { key: "date", label: "Date" },
      {
        key: "order",
        label: "Order",
        render: (val) =>
          (typeof val === "object" ? val.order_no || val.id : val) || "—",
      },
      { key: "issue", label: "Issue" },
      { key: "status", label: "Status" },
    ],
  },
  "metal-issue": {
    label: "Metal Issue",
    icon: ArrowUpRight,
    color: "text-blue-600",
    addRoute: "/process/metal-issue",
    fetcher: metalIssueList,
    columns: [
      { key: "date", label: "Date" },
      { key: "tag_no", label: "Tag No" },
      { key: "account_order_id", label: "Order ID" },
      { key: "net_wt", label: "Net Weight", align: "right" },
    ],
  },
};

export default function DailyLogTypePage({
  params,
}: {
  params: { type: string };
}) {
  const { type } = params;
  const config = TABLE_CONFIGS[type];

  const [fromDate, setFromDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!config) return;
    setLoading(true);
    config
      .fetcher({
        ordering: "-id",
        page_size: 1000,
      })
      .then((res: any) => {
        const records = Array.isArray(res)
          ? res
          : res.results || res.items || [];
        const filtered = records.filter((r: any) => {
          if (!r.date) return false;
          const recordDate = String(r.date).split("T")[0];
          return recordDate >= fromDate && recordDate <= toDate;
        });
        setResults(filtered);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [fromDate, toDate, config]);

  if (!config)
    return (
      <div className="p-10 text-center font-bold text-rose-500">
        Invalid Transaction Type
      </div>
    );

  const Icon = config.icon;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#fafafa] min-h-screen">
      {/* Enhanced Header Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="ghost"
              className="h-10 w-10 p-0 rounded-full hover:bg-gray-50 border border-gray-100 shadow-sm"
            >
              <Link href="/daily-log">
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2.5 rounded-2xl bg-white shadow-sm ring-1 ring-black/5",
                  config.color
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-none">
                  {config.label} Records
                </h1>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Detailed Daily Transaction Audit
                </p>
              </div>
            </div>
          </div>

          <Button
            asChild
            className="h-11 px-6 rounded-xl bg-gray-900 hover:bg-black text-white font-bold tracking-tight shadow-lg shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Link href={config.addRoute}>
              <Plus className="h-5 w-5 mr-2" />
              New {config.label}
            </Link>
          </Button>
        </div>

        <div className="h-px bg-gray-50 w-full" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="pl-10 h-11 w-full sm:w-[180px] border-gray-100 focus:ring-fuchsia-500 rounded-xl font-bold text-sm bg-gray-50/50"
                placeholder="From Date"
              />
            </div>
            <span className="text-gray-400 font-bold text-sm">to</span>
            <div className="relative flex-1 sm:flex-none">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="pl-10 h-11 w-full sm:w-[180px] border-gray-100 focus:ring-fuchsia-500 rounded-xl font-bold text-sm bg-gray-50/50"
                placeholder="To Date"
              />
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Total Entries
            </span>
            <p className="text-xl font-black text-gray-900 tabular-nums leading-none">
              {results.length}
            </p>
          </div>
        </div>
      </div>

      {/* Modern Spreadsheet Table */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-100">
                  {config.columns.map((col, idx) => (
                    <th
                      key={idx}
                      className={cn(
                        "px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-gray-100",
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                            ? "text-center"
                            : "text-left"
                      )}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-gray-100 w-[100px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={config.columns.length + 1}
                      className="p-20 text-center"
                    >
                      <Loader2 className="h-8 w-8 animate-spin text-fuchsia-400 mx-auto mb-4" />
                      <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                        Refreshing Data...
                      </span>
                    </td>
                  </tr>
                ) : results.length > 0 ? (
                  results.map((row, rowIdx) => (
                    <tr
                      key={row.id || rowIdx}
                      className="group hover:bg-fuchsia-50/30 transition-colors"
                    >
                      {config.columns.map((col, colIdx) => (
                        <td
                          key={colIdx}
                          className={cn(
                            "px-6 py-4 text-[13px] border-b border-gray-50 transition-colors group-hover:border-fuchsia-100",
                            col.align === "right"
                              ? "text-right font-black tabular-nums"
                              : "font-medium text-gray-600"
                          )}
                        >
                          {col.render
                            ? col.render(row[col.key], row)
                            : row[col.key] || "—"}
                        </td>
                      ))}
                      <td className="px-6 py-4 border-b border-gray-50 group-hover:border-fuchsia-100 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={config.columns.length + 1}
                      className="py-24 text-center"
                    >
                      <div className="max-w-xs mx-auto space-y-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto ring-1 ring-gray-100">
                          <span className="text-3xl grayscale">📭</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-gray-900">
                            No Records Found
                          </h3>
                          <p className="text-[11px] font-bold text-gray-400 uppercase mt-1 leading-relaxed">
                            No transactions recorded from{" "}
                            {new Date(fromDate).toLocaleDateString("en-IN", {
                              dateStyle: "medium",
                            })}{" "}
                            to{" "}
                            {new Date(toDate).toLocaleDateString("en-IN", {
                              dateStyle: "medium",
                            })}
                          </p>
                        </div>
                        <Button
                          asChild
                          size="sm"
                          className="bg-gray-900 hover:bg-black text-white rounded-xl"
                        >
                          <Link href={config.addRoute}>Add First Entry</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}
