"use client";

import { useState, useEffect, Suspense as _Suspense } from "react";
import Link from "next/link";
import {
  Calendar,
  Plus,
  ArrowLeft,
  Eye,
  FileText,
  Loader2,
  Workflow as _Workflow,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { vouchersList } from "@/lib/backend";
import { ProcessStepsSearch as _ProcessStepsSearch } from "@/components/vouchers/ProcessStepsSearch";

export default function DailyLogOrdersPage() {
  const [fromDate, setFromDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [results, setResults] = useState<any[]>([]);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all orders
  useEffect(() => {
    setLoading(true);
    vouchersList({
      ordering: "-id",
      page_size: 1000,
    })
      .then((res: any) => {
        const records = Array.isArray(res)
          ? res
          : res.results || res.items || [];
        setAllResults(records);
        const filtered = records.filter((r: any) => {
          if (!r.date) return false;
          const recordDate = String(r.date).split("T")[0];
          return recordDate >= fromDate && recordDate <= toDate;
        });
        setResults(filtered);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [fromDate, toDate]);

  const columns = [
    { key: "date", label: "Date" },
    { key: "bill_no", label: "Bill No" },
    {
      key: "account",
      label: "Account",
      render: (val: any) =>
        (typeof val === "object" ? val.account_name || val.name : val) || "—",
    },
    { key: "item_name", label: "Item" },
    { key: "status", label: "Status" },
  ];

  // When searching, search in all results (ignore date filter)
  // When not searching, use date-filtered results
  const filteredResults = searchQuery.trim()
    ? allResults.filter((r) => {
        const q = searchQuery.toLowerCase();
        return (
          String(r.bill_no || "")
            .toLowerCase()
            .includes(q) ||
          String(r.id || "")
            .toLowerCase()
            .includes(q)
        );
      })
    : results;

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
              <div className="p-2.5 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 text-fuchsia-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-none">
                  Orders List
                </h1>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Daily Transaction Audit
                </p>
              </div>
            </div>
          </div>

          <Button
            asChild
            className="h-11 px-6 rounded-xl bg-gray-900 hover:bg-black text-white font-bold tracking-tight shadow-lg shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Link href="/vouchers/new">
              <Plus className="h-5 w-5 mr-2" />
              New Order
            </Link>
          </Button>
        </div>

        {/* Date Filter */}
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

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Job ID or Order ID..."
              className="pl-10 pr-10 h-11 border-gray-100 focus:ring-fuchsia-500 rounded-xl font-medium text-sm bg-gray-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Showing
            </span>
            <p className="text-xl font-black text-gray-900 tabular-nums leading-none">
              {filteredResults.length}
            </p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-100">
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-gray-100 text-left"
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
                      colSpan={columns.length + 1}
                      className="p-20 text-center"
                    >
                      <Loader2 className="h-8 w-8 animate-spin text-fuchsia-400 mx-auto mb-4" />
                      <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                        Refreshing Data...
                      </span>
                    </td>
                  </tr>
                ) : filteredResults.length > 0 ? (
                  filteredResults.map((row, rowIdx) => (
                    <tr
                      key={row.id || rowIdx}
                      className="group hover:bg-fuchsia-50/30 transition-colors"
                    >
                      {columns.map((col, colIdx) => (
                        <td
                          key={colIdx}
                          className="px-6 py-4 text-[13px] border-b border-gray-50 transition-colors group-hover:border-fuchsia-100 font-medium text-gray-600"
                        >
                          {col.render
                            ? col.render(row[col.key])
                            : row[col.key] || "—"}
                        </td>
                      ))}
                      <td className="px-6 py-4 border-b border-gray-50 group-hover:border-fuchsia-100 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-gray-400 hover:text-fuchsia-600 hover:bg-fuchsia-50"
                          >
                            <Link href={`/daily-log/orders/${row.id}`}>
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="py-24 text-center"
                    >
                      <div className="max-w-xs mx-auto space-y-4">
                        <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">
                          No entries found
                        </p>
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
