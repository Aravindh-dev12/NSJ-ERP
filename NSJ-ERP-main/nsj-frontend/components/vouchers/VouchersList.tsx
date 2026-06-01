"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  vouchersList,
  voucherDelete,
  exportVouchersAll,
  voucherDetail,
  accountDetail,
  type Voucher,
  type VouchersListResponse,
  type QueryValue,
} from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { exportVoucher } from "@/lib/backend";
import { generateOrderTrackingPDF } from "@/lib/orderTrackingPDF";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { X, Search, Calendar } from "lucide-react";
import { getLocalFirstOfMonth, getLocalToday } from "@/lib/date";
// utilities
import { VouchersHeader } from "./VouchersHeader";
import OrderIssueModal from "@/components/issues/OrderIssueModal";

const PAGE_SIZE = 10;

function buildQuery(
  page: number,
  search: string,
  status: string,
  dateFrom?: string,
  dateTo?: string
) {
  const params: Record<string, QueryValue> = { page, page_size: PAGE_SIZE };
  if (search.trim()) params.search = search.trim();
  if (status !== "all") params.status = status;
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;
  return params;
}

export function VouchersList() {
  const { toast } = useToast();
  const [records, setRecords] = useState<Voucher[]>([]);
  const [meta, setMeta] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [orderIssueModal, setOrderIssueModal] = useState({
    isOpen: false,
    order: null as Voucher | null,
  });

  const [dateFrom, setDateFrom] = useState(getLocalFirstOfMonth());
  const [dateTo, setDateTo] = useState(getLocalToday());

  const totalPages = useMemo(() => {
    if (meta.count === 0) return 1;
    return Math.max(1, Math.ceil(meta.count / PAGE_SIZE));
  }, [meta.count]);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildQuery(page, search, status, dateFrom, dateTo);
      const response = await vouchersList(params);
      setRecords(response.results ?? []);
      setMeta({
        count: response.count ?? response.results?.length ?? 0,
        next: response.next ?? null,
        previous: response.previous ?? null,
      });
    } catch (err) {
      setRecords([]);
      setMeta({ count: 0, next: null, previous: null });
      setError("Failed to load vouchers. Please try again.");
      toast({
        variant: "destructive",
        title: "Unable to load vouchers",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, status, dateFrom, dateTo, toast]);

  useEffect(() => {
    void fetchVouchers();
  }, [fetchVouchers]);

  // Debounced search effect (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1); // Reset to first page on new search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      // Immediate search on form submit (Enter key)
      setSearch(searchInput.trim());
      setPage(1);
    },
    [searchInput]
  );

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }, []);

  const { user } = useAuth();

  const canDeleteOrders =
    user &&
    (user.is_staff || user.is_superuser || user.department === "FOUNDER");

  const handleDelete = useCallback(
    async (id: string) => {
      // Check if user has permission before showing confirm dialog
      if (!canDeleteOrders) {
        toast({
          variant: "destructive",
          title: "Permission denied",
          description:
            "You don't have permission to delete orders. Only admin or founder can delete orders.",
        });
        return;
      }

      const confirmed = window.confirm(
        "Are you sure you want to delete this order?"
      );
      if (!confirmed) return;
      setDeletingId(id);
      try {
        await voucherDelete(id);
        toast({
          title: "Order removed",
          description: "The order has been deleted successfully.",
        });
        await fetchVouchers();
      } catch (err) {
        // Check if it's a 403 error with specific message
        if (
          err instanceof Error &&
          err.message.includes("Only admin or founder can delete orders")
        ) {
          toast({
            variant: "destructive",
            title: "Permission denied",
            description: "Only admin or founder can delete orders",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Delete failed",
            description:
              err instanceof Error ? err.message : "Could not delete order.",
          });
        }
      } finally {
        setDeletingId(null);
      }
    },
    [fetchVouchers, toast, canDeleteOrders]
  );

  const formattedRecords = useMemo(() => {
    return records.map((record) => {
      // Debug log to see what account data we're receiving
      if (record.account) {
        console.log(
          `[DEBUG] Record ${record.id} account data:`,
          record.account
        );
        console.log(`[DEBUG] Record ${record.id} full data:`, record);
      }

      return {
        ...record,
        dateFormatted: record.date
          ? new Intl.DateTimeFormat(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            }).format(new Date(record.date))
          : "—",
      };
    });
  }, [records]);

  return (
    <div className="space-y-8">
      <VouchersHeader
        title="Orders"
        description="Manage orders: create, review status, and keep records tidy."
      />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">Orders list</CardTitle>
              <CardDescription>Maintain orders in one place.</CardDescription>
            </div>
            <div className="ml-auto">
              <Button
                variant="secondary"
                onClick={async () => {
                  setExporting(true);
                  try {
                    const { blob, fileName } = await exportVouchersAll();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = fileName ?? "orders_data.xlsx";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                    toast({ title: "Export complete" });
                  } catch (err) {
                    toast({ variant: "destructive", title: "Export failed" });
                  } finally {
                    setExporting(false);
                  }
                }}
                disabled={exporting}
              >
                {exporting ? "Exporting…" : "Export Data"}
              </Button>
            </div>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col gap-3 md:flex-row md:items-center"
          >
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by Job ID or Order ID..."
                  className="pl-9 pr-9"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            {searchInput && (
              <div className="text-xs text-muted-foreground">
                {loading ? "Searching..." : `${meta.count} results`}
              </div>
            )}
            <div className="flex items-center bg-white border rounded-lg h-10 px-3 text-sm">
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
          </form>
        </CardHeader>

        {/* Duplicate search form removed to keep a single search bar in the header */}

        <CardContent className="space-y-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-6 py-4 text-sm text-destructive">
              {error}
            </div>
          ) : records.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 px-6 py-14 text-center text-sm text-muted-foreground">
              No orders found. Try adjusting filters or create a new order.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Account
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Advance payment
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {formattedRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-muted/40">
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <Link
                            href={`/vouchers/${record.id}/history`}
                            className="text-sm font-semibold text-primary hover:underline cursor-pointer"
                          >
                            {record.bill_no ?? "Unnamed"}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {(record as any).dateFormatted}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {/* Exhaustive item name rendering with maximum fallbacks */}
                        {(typeof record.item_name === "object" &&
                        record.item_name
                          ? (record.item_name as any).name
                          : null) ||
                          (typeof record.item_name === "string"
                            ? record.item_name
                            : null) ||
                          (record as any).item?.name ||
                          (record as any).jewellery_type ||
                          (record as any).item_name_custom ||
                          (record as any).itemName ||
                          (record as any).product_name ||
                          (record as any).description ||
                          (record as any).design ||
                          (record as any).item_category ||
                          (Array.isArray((record as any).details) &&
                            ((record as any).details[0]?.item_name ||
                              (record as any).details[0]?.itemName)) ||
                          (record as any).order_type ||
                          (record as any).sale?.item_name ||
                          (record as any).name ||
                          "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {record.account && typeof record.account === "object"
                          ? (record.account as any).account_name ||
                            (record.account as any).name ||
                            (record as any).account_name || // Fallback to account_name from root
                            "—"
                          : typeof record.account === "string"
                            ? record.account
                            : (record as any).account_name || // Fallback to account_name from root
                              "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {record.advance_payment_received
                          ? String(record.advance_payment_received)
                          : "—"}
                      </td>
                      {/* Status column removed */}
                      <td className="flex items-center justify-end gap-2 px-4 py-4 text-sm">
                        <Link href={`/vouchers/${record.id}/history`}>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="font-semibold"
                          >
                            View
                          </Button>
                        </Link>
                        <Link href={`/vouchers/orders/${record.id}/tracking`}>
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            View Process
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setOrderIssueModal({ isOpen: true, order: record })
                          }
                        >
                          Create Order Issue
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(record.id)}
                          disabled={deletingId === record.id}
                        >
                          {deletingId === record.id ? "Deleting…" : "Delete"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              // Fetch full order details
                              const orderDetails = await voucherDetail(
                                record.id
                              );

                              // Extract account ID and name
                              let accountId: string | null = null;
                              let accountName = "Unknown";

                              if (
                                orderDetails.account &&
                                typeof orderDetails.account === "object"
                              ) {
                                accountId = (orderDetails.account as any).id;
                                accountName =
                                  (orderDetails.account as any).account_name ||
                                  (orderDetails.account as any).name ||
                                  "Unknown";
                              } else if (
                                typeof orderDetails.account === "string"
                              ) {
                                accountId = orderDetails.account;
                                accountName = orderDetails.account;
                              }

                              // Fetch account details to get phone number
                              let phoneNumber = "";
                              if (accountId) {
                                try {
                                  const accountData =
                                    await accountDetail(accountId);
                                  phoneNumber =
                                    accountData.contact?.phone ||
                                    accountData.contact?.mobile ||
                                    "";
                                } catch (err) {
                                  console.warn(
                                    "Could not fetch account details:",
                                    err
                                  );
                                }
                              }

                              // Prepare data for PDF
                              const pdfData = {
                                orderId:
                                  orderDetails.bill_no || orderDetails.id,
                                queryInDate:
                                  orderDetails.date ||
                                  new Date().toISOString().split("T")[0],
                                accountName,
                                subaccount:
                                  (orderDetails as any).subaccount || "",
                                itemName: orderDetails.item_name || "—",
                                goldCarat:
                                  orderDetails.stamp ||
                                  (orderDetails as any).gold_carat ||
                                  "—",
                                size: orderDetails.size || "—",
                                location: (orderDetails as any).location || "",
                                deliveryType:
                                  (orderDetails as any).delivery_type || "",
                                phoneNumber,
                                referenceImage:
                                  (orderDetails as any).upload_file ||
                                  undefined,
                                referenceImageType: (orderDetails as any)
                                  .upload_file
                                  ? "image/jpeg"
                                  : undefined,
                              };

                              // Generate PDF
                              generateOrderTrackingPDF(pdfData);

                              toast({
                                title: "Order tracking sheet generated",
                              });
                            } catch (err) {
                              console.error("Export error:", err);
                              toast({
                                variant: "destructive",
                                title: "Export failed",
                                description:
                                  err instanceof Error
                                    ? err.message
                                    : "Unknown error",
                              });
                            }
                          }}
                        >
                          Export
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <span>
              Showing page {page} of {totalPages} · {meta.count} total orders
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((c) => Math.max(1, c - 1))}
                disabled={page <= 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((c) => c + 1)}
                disabled={page >= totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <OrderIssueModal
        isOpen={orderIssueModal.isOpen}
        onClose={() => setOrderIssueModal({ isOpen: false, order: null })}
        order={orderIssueModal.order}
        onOrderIssueCreated={() => {
          toast({ title: "Order issue created successfully" });
          void fetchVouchers();
        }}
      />
    </div>
  );
}
