"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Search,
  X,
  Loader2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { OrderProgressTracker } from "@/components/vouchers/OrderProgressTracker";
import { vouchersList } from "@/lib/backend";
import { getLocalFirstOfMonth, getLocalToday } from "@/lib/date";

export default function ProcessStepsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlOrderId = searchParams.get("order_id");
  const urlAccountOrderId = searchParams.get("account_order_id");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);

  const getDefaultDateFrom = () => {
    return getLocalFirstOfMonth();
  };

  const getDefaultDateTo = () => {
    return getLocalToday();
  };

  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom());
  const [dateTo, setDateTo] = useState(getDefaultDateTo());

  // Fetch records with date filters
  useEffect(() => {
    let mounted = true;
    const fetchRecords = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await vouchersList({
          ordering: "-id",
          page_size: 1000,
          date_from: dateFrom,
          date_to: dateTo,
        });

        const recordsData = Array.isArray(res) ? res : res.results || [];
        if (!mounted) return;
        setRecords(recordsData);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Unable to load orders. Please try again.");
        setRecords([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void fetchRecords();
    return () => {
      mounted = false;
    };
  }, [dateFrom, dateTo]);

  // Filter records based on search query
  const filteredRecords = records.filter(
    (r: { bill_no?: string; id?: string }) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const billNoMatch = String(r.bill_no || "")
        .toLowerCase()
        .includes(query);
      const idMatch = String(r.id || "")
        .toLowerCase()
        .includes(query);
      return billNoMatch || idMatch;
    }
  );

  // Handle order selection
  const handleOrderSelect = (orderId: string, billNo?: string) => {
    setSelectedOrderId(orderId);
    const params = new URLSearchParams();
    params.set("order_id", orderId);
    if (billNo) {
      params.set("account_order_id", billNo);
    }
    router.replace(`/query-orders?${params.toString()}`);
  };

  // Handle back to list
  const handleBackToList = () => {
    setSelectedOrderId(null);
    router.replace("/query-orders");
  };

  // Auto-select order when order_id is in URL
  useEffect(() => {
    if (urlOrderId && !selectedOrderId) {
      setSelectedOrderId(urlOrderId);
    }
  }, [urlOrderId, selectedOrderId]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // Search is handled automatically by filteredRecords
    }
  };

  const handleClear = () => {
    setSearchQuery("");
  };

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
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 text-blue-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-none">
                  Query Orders
                </h1>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Production Workflow Management
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Date Filters and Search Bar in same row */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-2xl w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search by Job ID or Order ID..."
              className="pl-10 pr-10 h-11 border-gray-100 focus:ring-blue-500 rounded-xl font-medium text-sm bg-gray-50/50"
            />
            {searchQuery && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Date Filters */}
          <div className="flex items-center bg-white border rounded-lg h-10 px-3 text-sm w-fit">
            <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
            <span className="text-muted-foreground mr-2">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent border-none outline-none w-[110px] font-medium text-foreground cursor-pointer uppercase text-xs"
            />
            <span className="text-muted-foreground mx-3">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent border-none outline-none w-[110px] font-medium text-foreground cursor-pointer uppercase text-xs"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      {selectedOrderId ? (
        <>
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <Button
                  onClick={handleBackToList}
                  variant="ghost"
                  className="h-10 px-4 rounded-xl hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to List
                </Button>
              </div>
              <OrderProgressTracker orderId={selectedOrderId} />
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 text-lg">⚠</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-red-900">Error</h3>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-20 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-sm text-gray-600">Loading orders...</p>
              </CardContent>
            </Card>
          ) : filteredRecords.length === 0 ? (
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-20 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    No Orders Found
                  </h3>
                  <p className="text-sm text-gray-600">
                    {searchQuery
                      ? "No orders match your search criteria."
                      : "No orders found in the selected date range."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-6">
                <div className="overflow-x-auto rounded-lg border">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Bill No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Order ID
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                      {filteredRecords.map((rec) => (
                        <tr
                          key={rec.id}
                          className="hover:bg-muted/40 transition-colors cursor-pointer"
                          onClick={() => handleOrderSelect(rec.id, rec.bill_no)}
                        >
                          <td className="px-4 py-4 text-sm text-muted-foreground tabular-nums">
                            {rec.date ?? "—"}
                          </td>
                          <td className="px-4 py-4 font-bold text-rose-900 border-r border-rose-50/50 uppercase tabular-nums">
                            {rec.bill_no || "—"}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-800 tabular-nums">
                            {rec.id || "—"}
                          </td>
                          <td className="flex items-center justify-end gap-2 px-4 py-4 text-sm">
                            <Button variant="outline" size="sm" className="h-8">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
