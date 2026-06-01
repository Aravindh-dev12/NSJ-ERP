"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDown, Loader2 } from "lucide-react";
import { queryList, queryArchive, type QueryResponse } from "@/lib/backend";
import { generateQueryPDF } from "@/lib/queryPDF";
import { getLocalFirstOfMonth, getLocalToday } from "@/lib/date";

interface Query extends QueryResponse {}

/**
 * Check if a query is expiring within the specified number of days
 * @param expiryDate - The expiry date string (ISO format)
 * @param daysThreshold - Number of days to check (default 3)
 * @returns true if expiring within threshold days, false otherwise
 */
function isExpiringWithinDays(
  expiryDate: string | null | undefined,
  daysThreshold: number = 3
): boolean {
  if (!expiryDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  // If already expired, don't show as "expiring soon"
  if (expiry < today) return false;

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= 0 && diffDays <= daysThreshold;
}

/**
 * Get the number of days until expiry (negative if expired)
 * @param expiryDate - The expiry date string (ISO format)
 * @returns Number of days until expiry, or null if no expiry date
 */
function getDaysUntilExpiry(
  expiryDate: string | null | undefined
): number | null {
  if (!expiryDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function PendingQueriesList() {
  const router = useRouter();
  const { toast } = useToast();
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [filteredQueries, setFilteredQueries] = useState<Query[]>([]);

  const getDefaultDateFrom = () => {
    return getLocalFirstOfMonth();
  };

  const getDefaultDateTo = () => {
    return getLocalToday();
  };

  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom());
  const [dateTo, setDateTo] = useState(getDefaultDateTo());
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [meta, setMeta] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
  });

  const handleExportAll = async () => {
    if (filteredQueries.length === 0) return;
    setIsExportingAll(true);
    try {
      const XLSX = await import("xlsx");

      const rows = filteredQueries.map((q) => ({
        "Account Name": q.account?.account_name || "",
        "Sub-Account": q.subaccount || "",
        Item: q.item_name?.name || q.item_name_custom || "",
        "Gold Carat": q.gold_carat || "",
        Size: q.size || "",
        Gender: q.gender || "",
        Location: q.location || "",
        "Delivery Type": q.delivery_type || "",
        "Query Date": q.query_in_date || "",
        "Expiry Date": q.expiry_date || "",
        Status: q.status || "",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pending Queries");

      // Auto-fit column widths
      const colWidths = Object.keys(rows[0] || {}).map((key) => ({
        wch: Math.max(
          key.length,
          ...rows.map((r) => String((r as any)[key] || "").length)
        ),
      }));
      ws["!cols"] = colWidths;

      XLSX.writeFile(
        wb,
        `Pending_Queries_${new Date().toISOString().slice(0, 10)}.xlsx`
      );

      toast({
        title: "Export Complete",
        description: `Exported ${filteredQueries.length} queries to Excel.`,
      });
    } catch (err) {
      console.error("Export all failed:", err);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export queries. Please try again.",
      });
    } finally {
      setIsExportingAll(false);
    }
  };

  // Check if expiry date was yesterday
  const isExpiryYesterday = useCallback(
    (expiryDate: string | null | undefined): boolean => {
      if (!expiryDate) return false;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const expiry = new Date(expiryDate);
      expiry.setHours(0, 0, 0, 0);

      return expiry.getTime() === yesterday.getTime();
    },
    []
  );

  const loadQueries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await queryList({
        page,
        page_size: pageSize,
        status: "pending",
        search: searchTerm || undefined,
        date_from: dateFrom,
        date_to: dateTo,
      });
      setQueries(data.results || []);
      setMeta({
        count: data.count || 0,
        next: data.next,
        previous: data.previous,
      });

      // Auto-archive queries that expired yesterday
      const queriesToArchive = (data.results || []).filter((q) =>
        isExpiryYesterday(q.expiry_date)
      );

      if (queriesToArchive.length > 0) {
        // Archive queries that expired yesterday in the background
        void autoArchiveExpiredQueries(queriesToArchive);
      }
    } catch (err) {
      console.error("Failed to load queries:", err);

      // Show error toast notification
      toast({
        variant: "destructive",
        title: "Failed to load queries",
        description:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while loading queries. Please try again.",
      });

      // Set empty state on error
      setQueries([]);
      setMeta({
        count: 0,
        next: null,
        previous: null,
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, dateFrom, dateTo, toast, isExpiryYesterday]);

  useEffect(() => {
    void loadQueries();
  }, [loadQueries]);

  // Auto-refresh when page becomes visible (e.g., after converting a query to order)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadQueries();
      }
    };

    const handleFocus = () => {
      void loadQueries();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadQueries]);

  // Auto-archive queries that expired yesterday
  const autoArchiveExpiredQueries = useCallback(
    async (expiredQueries: Query[]) => {
      try {
        // Archive each expired query
        const archivePromises = expiredQueries.map(async (query) => {
          try {
            // Generate PDF first
            const pdfData = {
              accountName: query.account?.account_name || "Unknown",
              subaccount: query.subaccount || "",
              location: query.location || "",
              itemName:
                query.item_name?.name || query.item_name_custom || "Unknown",
              goldCarat: query.gold_carat || "",
              size: query.size || "",
              gender: query.gender || "",
              deliveryType: query.delivery_type || "",
              queryInDate: query.query_in_date,
              expiryDate: query.expiry_date || "",
              referenceImage: query.reference_image || "",
              referenceImageType: "image/jpeg",
            };

            // Generate PDF silently (don't show toast for auto-archive)
            await generateQueryPDF(pdfData);

            // Archive the query
            await queryArchive(query.id);

            return query.id;
          } catch (err) {
            console.error(`Failed to auto-archive query ${query.id}:`, err);
            return null;
          }
        });

        const archivedIds = await Promise.all(archivePromises);
        const successCount = archivedIds.filter((id) => id !== null).length;

        if (successCount > 0) {
          // Remove archived queries from the list
          setQueries((prevQueries) =>
            prevQueries.filter((q) => !archivedIds.includes(q.id))
          );

          // Show notification
          toast({
            title: "Expired Queries Auto-Archived",
            description: `${successCount} ${successCount === 1 ? "query that expired yesterday has" : "queries that expired yesterday have"} been automatically archived.`,
          });
        }
      } catch (err) {
        console.error("Failed to auto-archive expired queries:", err);
      }
    },
    [toast]
  );

  // Update filtered queries whenever queries change (backend already filtered by search)
  // Also filter out queries that have been converted to orders
  useEffect(() => {
    const activeQueries = queries.filter(
      (query) => query.status !== "converted_to_order"
    );
    setFilteredQueries(activeQueries);
  }, [queries]);

  const handleFollowUp = useCallback(
    (queryId: string) => {
      router.push(`/vouchers/pending-queries/${queryId}`);
    },
    [router]
  );

  const handleConvertToOrder = useCallback(
    (queryId: string) => {
      router.push(`/vouchers/pending-queries/${queryId}/convert`);
    },
    [router]
  );

  const handleViewDetails = useCallback(
    (queryId: string) => {
      router.push(`/vouchers/pending-queries/${queryId}`);
    },
    [router]
  );

  const handleArchive = useCallback(
    async (query: Query) => {
      if (
        !confirm(
          `Archive query for ${query.account?.account_name || "this customer"}? This will generate a PDF and move it to the archive.`
        )
      ) {
        return;
      }

      try {
        // Generate PDF first
        const pdfData = {
          accountName: query.account?.account_name || "Unknown",
          subaccount: query.subaccount || "",
          location: query.location || "",
          itemName:
            query.item_name?.name || query.item_name_custom || "Unknown",
          goldCarat: query.gold_carat || "",
          size: query.size || "",
          gender: query.gender || "",
          deliveryType: query.delivery_type || "",
          queryInDate: query.query_in_date,
          expiryDate: query.expiry_date || "",
          referenceImage: query.reference_image || "",
          referenceImageType: "image/jpeg", // Default, adjust if needed
        };

        await generateQueryPDF(pdfData);

        // Then archive the query
        await queryArchive(query.id);

        toast({
          title: "Query Archived",
          description:
            "The query has been archived and PDF has been downloaded.",
        });

        // Refresh the list
        setQueries(queries.filter((q) => q.id !== query.id));
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Archive Failed",
          description:
            err instanceof Error ? err.message : "Failed to archive query",
        });
      }
    },
    [queries, toast]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Queries</CardTitle>
              <CardDescription>
                Customer queries awaiting confirmation and advance payment
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 no-print">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAll}
                disabled={
                  loading || isExportingAll || filteredQueries.length === 0
                }
              >
                {isExportingAll ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" />
                )}
                Export All
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1">
              <Input
                placeholder="Search by account, item name, or carat..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex items-center bg-white border rounded-lg h-10 px-3 text-sm w-fit">
              <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
              <span className="text-muted-foreground mr-2">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent border-none outline-none w-[110px] font-medium text-foreground cursor-pointer uppercase text-xs"
              />
              <span className="text-muted-foreground mx-3">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent border-none outline-none w-[110px] font-medium text-foreground cursor-pointer uppercase text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredQueries.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No queries match your search"
                  : "No pending queries yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Account
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Gold Carat
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Query Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Expiry Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueries.map((query) => {
                    const isExpired = query.is_expired;
                    const isExpiringSoon =
                      !isExpired && isExpiringWithinDays(query.expiry_date, 3);
                    const daysUntilExpiry = getDaysUntilExpiry(
                      query.expiry_date
                    );

                    // Determine row styling based on expiry status
                    let rowClassName = "border-t hover:bg-muted/30";
                    if (isExpired) {
                      rowClassName =
                        "border-t hover:bg-red-100/50 bg-red-50/30";
                    } else if (isExpiringSoon) {
                      rowClassName =
                        "border-t hover:bg-amber-100/50 bg-amber-50/30";
                    }

                    return (
                      <tr key={query.id} className={rowClassName}>
                        <td className="px-4 py-3 font-medium">
                          {query.account?.account_name || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {query.item_name?.name ||
                            query.item_name_custom ||
                            "—"}
                        </td>
                        <td className="px-4 py-3">{query.gold_carat}</td>
                        <td className="px-4 py-3">{query.size}</td>
                        <td className="px-4 py-3">
                          {new Date(query.query_in_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span
                              className={
                                isExpired
                                  ? "text-destructive font-semibold"
                                  : isExpiringSoon
                                    ? "text-amber-700 font-medium"
                                    : "text-muted-foreground"
                              }
                            >
                              {query.expiry_date
                                ? new Date(
                                    query.expiry_date
                                  ).toLocaleDateString()
                                : "—"}
                            </span>
                            {isExpired && (
                              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                                Expired
                              </span>
                            )}
                            {isExpiringSoon && daysUntilExpiry !== null && (
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                {daysUntilExpiry === 0
                                  ? "Expires today"
                                  : daysUntilExpiry === 1
                                    ? "Expires tomorrow"
                                    : `Expires in ${daysUntilExpiry} days`}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800">
                            Pending
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(query.id)}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleArchive(query)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              📦 Archive
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleConvertToOrder(query.id)}
                              className="bg-amber-600 hover:bg-amber-700"
                            >
                              Convert
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredQueries.length} of {queries.length} queries
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={filteredQueries.length < pageSize}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
