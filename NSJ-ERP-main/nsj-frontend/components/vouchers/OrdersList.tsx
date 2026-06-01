"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  vouchersList,
  voucherDelete,
  exportVouchersAll,
  voucherDetail,
  accountDetail,
  type Voucher,
  type QueryValue,
} from "@/lib/backend";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VouchersHeader } from "./VouchersHeader";
import OrderIssueModal from "@/components/issues/OrderIssueModal";

const PAGE_SIZE = 10;

function buildQuery(page: number, search: string, status: string) {
  const params: Record<string, QueryValue> = { page, page_size: PAGE_SIZE };
  if (search.trim()) params.search = search.trim();
  if (status !== "all") params.status = status;
  return params;
}

export function OrdersList() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // Export Popup State
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [newOrderDetails, setNewOrderDetails] = useState<{
    id: string;
    billNo: string;
  } | null>(null);

  useEffect(() => {
    const newOrderId = searchParams.get("new_order");
    if (newOrderId) {
      voucherDetail(newOrderId)
        .then((order) => {
          setNewOrderDetails({
            id: order.id,
            billNo: order.bill_no || order.id,
          });
          setShowExportPopup(true);

          // Clear the param from URL without refreshing the page
          const newUrl = window.location.pathname;
          window.history.replaceState({ ...window.history.state }, "", newUrl);
        })
        .catch((err) =>
          console.error("Failed to fetch new order details", err)
        );
    }
  }, [searchParams]);

  const totalPages = useMemo(() => {
    if (meta.count === 0) return 1;
    return Math.max(1, Math.ceil(meta.count / PAGE_SIZE));
  }, [meta.count]);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildQuery(page, search, status);
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
  }, [page, search, status, toast]);

  useEffect(() => {
    void fetchVouchers();
  }, [fetchVouchers]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSearch(searchInput.trim());
      setPage(1);
    },
    [searchInput]
  );

  const { user } = useAuth();

  const canDeleteOrders = user && (user.is_staff || user.is_superuser || user.department === 'FOUNDER');

  const handleDelete = useCallback(
    async (id: string) => {
      // Check if user has permission before showing confirm dialog
      if (!canDeleteOrders) {
        toast({
          variant: "destructive",
          title: "Permission denied",
          description: "You don't have permission to delete orders. Only admin or founder can delete orders.",
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
        if (err instanceof Error && err.message.includes("Only admin or founder can delete orders")) {
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

  const handleExportSingle = async (orderId: string) => {
    try {
      // Fetch full order details
      const orderDetails = await voucherDetail(orderId);

      // Extract account ID and name
      let accountId: string | null = null;
      let accountName = "Unknown";

      if (orderDetails.account && typeof orderDetails.account === "object") {
        accountId = (orderDetails.account as any).id;
        accountName =
          (orderDetails.account as any).account_name ||
          (orderDetails.account as any).name ||
          "Unknown";
      } else if (typeof orderDetails.account === "string") {
        accountId = orderDetails.account;
        accountName = orderDetails.account;
      }

      // Fetch account details to get phone number
      let phoneNumber = "";
      if (accountId) {
        try {
          const accountData = await accountDetail(accountId);
          phoneNumber =
            accountData.contact?.phone || accountData.contact?.mobile || "";
        } catch (err) {
          console.warn("Could not fetch account details:", err);
        }
      }

      // Prepare data for PDF
      const pdfData = {
        orderId: orderDetails.bill_no || orderDetails.id,
        queryInDate:
          orderDetails.date || new Date().toISOString().split("T")[0],
        accountName,
        subaccount: (orderDetails as any).subaccount || "",
        itemName: orderDetails.item_name || "—",
        goldCarat:
          orderDetails.stamp || (orderDetails as any).gold_carat || "—",
        size: orderDetails.size || "—",
        location: (orderDetails as any).location || "",
        deliveryType: (orderDetails as any).delivery_type || "",
        phoneNumber,
        referenceImage: (orderDetails as any).upload_file || undefined,
        referenceImageType: (orderDetails as any).upload_file
          ? "image/jpeg"
          : undefined,
      };

      // Generate PDF
      generateOrderTrackingPDF(pdfData);

      toast({ title: "Order tracking sheet generated" });
    } catch (err) {
      console.error("Export error:", err);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const formattedRecords = useMemo(() => {
    return records.map((record) => {
      // Debug log to see what account data we're receiving
      if (record.account) {
        console.log(
          `[DEBUG] Order Record ${record.id} account data:`,
          record.account
        );
        console.log(`[DEBUG] Order Record ${record.id} full data:`, record);
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

      {/* Export Popup Modal */}
      <Dialog open={showExportPopup} onOpenChange={setShowExportPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Created Successfully</DialogTitle>
            <DialogDescription>
              Order #{newOrderDetails?.billNo} is now active.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <p className="text-sm text-gray-600">
              The order has been confirmed and locked. You can now download the
              official tracking sheet.
            </p>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="default"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => {
                if (newOrderDetails?.id) {
                  handleExportSingle(newOrderDetails.id);
                  setShowExportPopup(false);
                }
              }}
            >
              📄 Download Tracking Sheet
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowExportPopup(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">Orders list</CardTitle>
              <CardDescription>Maintain orders in one place.</CardDescription>
            </div>
            <div className="ml-auto">
              {/* Add New Order Button */}
              <Link href="/vouchers/new">
                <Button className="mr-2 bg-blue-600 hover:bg-blue-700 text-white">
                  + New Order
                </Button>
              </Link>

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
            <div className="flex flex-1 items-center gap-2">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by order number or description"
                className="w-full"
              />
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </div>
          </form>
        </CardHeader>

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
                          (typeof record.item_name === "string" &&
                          record.item_name &&
                          record.item_name !== "STOCK_JEWELRY"
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
                          (record as any).sale?.item_name ||
                          (record as any).name ||
                          (record as any).order_data?.item_name ||
                          (record as any).order_data?.itemName ||
                          (record as any).order_data?.jewellery_type ||
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

                      <td className="flex items-center justify-end gap-2 px-4 py-4 text-sm">
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
                          onClick={() => handleExportSingle(record.id)}
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
