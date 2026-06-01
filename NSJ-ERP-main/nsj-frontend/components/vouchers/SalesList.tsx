"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  saleDelete,
  deleteSalesQuery,
  getSalesQueries,
  type SalesQuery,
  type QueryValue,
} from "@/lib/backend";
import { getLocalFirstOfMonth, getLocalToday } from "@/lib/date";
import { Button } from "@/components/ui/button";
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
import { SalesHeader } from "./SalesHeader";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { exportRowsToExcel } from "@/lib/export";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saleGeneratePDF } from "@/lib/backend";

const PAGE_SIZE = 10;

// Mapping status to badges
const STATUS_CONFIG: Record<
  string,
  { label: string; variant: string; icon?: any }
> = {
  draft: { label: "Draft", variant: "secondary" },
  active: { label: "Active Sale", variant: "default", icon: TrendingUp },
  completed: { label: "Completed", variant: "outline", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", variant: "destructive", icon: AlertCircle },
};

function buildQuery(page: number, search: string) {
  const params: Record<string, QueryValue> = {
    page,
    page_size: PAGE_SIZE,
    ordering: "-date",
  };
  if (search.trim()) params.search = search.trim();
  return params;
}

export function SalesList() {
  const { toast } = useToast();
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getDefaultDateFrom = () => {
    return getLocalFirstOfMonth();
  };

  const getDefaultDateTo = () => {
    return getLocalToday();
  };

  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom());
  const [dateTo, setDateTo] = useState(getDefaultDateTo());

  const totalPages = useMemo(() => {
    if (meta.count === 0) return 1;
    return Math.max(1, Math.ceil(meta.count / PAGE_SIZE));
  }, [meta.count]);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildQuery(page, search);
      const queryParams = {
        ...params,
        date_from: dateFrom,
        date_to: dateTo,
        workflow_status: "converted_to_sale",
      };
      const response = await getSalesQueries(queryParams);

      setRecords(response.results || response.items || []);
      setMeta({
        count: Number(
          response.total ||
            response.count ||
            (response.results || response.items)?.length ||
            0
        ),
        next: (response.next as string) || null,
        previous: (response.previous as string) || null,
      });
    } catch (err) {
      setRecords([]);
      setMeta({ count: 0, next: null, previous: null });
      setError("Failed to load sales. Please try again.");
      toast({
        variant: "destructive",
        title: "Unable to load sales",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, dateFrom, dateTo, toast]);

  useEffect(() => {
    void fetchSales();
  }, [fetchSales]);

  // Auto-refresh when page becomes visible (e.g., after confirming an order)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchSales();
      }
    };

    const handleFocus = () => {
      void fetchSales();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchSales]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSearch(searchInput.trim());
      setPage(1);
    },
    [searchInput]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this sale?"
      );
      if (!confirmed) return;
      setDeletingId(id);
      try {
        await deleteSalesQuery(id);
        toast({
          title: "Sale removed",
          description: "The sale has been deleted successfully.",
        });
        await fetchSales();
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Delete failed",
          description:
            err instanceof Error ? err.message : "Could not delete sale.",
        });
      } finally {
        setDeletingId(null);
      }
    },
    [fetchSales, toast]
  );

  const handleExportExcel = async () => {
    const headers = ["Sale / Bill No", "Customer", "Item", "Date", "Status"];

    try {
      // Fetch all data without pagination
      const response = await getSalesQueries({
        page: 1,
        page_size: 10000, // Large number to get all records
        search: search,
        date_from: dateFrom,
        date_to: dateTo,
        workflow_status: "converted_to_sale",
      });

      const allRecords = response.results || response.items || [];
      const allFormattedRecords = allRecords.map((record: any) => ({
        displayId: record.sale_no || record.bill_no || record.id || "N/A",
        customerName: record.account?.name || record.party_name || "N/A",
        itemName:
          record.jewellery_type_master?.name || record.jewellery_type || "-",
        dateFormatted: record.order_date || record.date || "N/A",
        statusKey: record.workflow_status || record.status || "unknown",
      }));

      const rows = allFormattedRecords.map((record) => [
        record.displayId,
        record.customerName,
        record.itemName,
        record.dateFormatted,
        STATUS_CONFIG[record.statusKey]?.label || "N/A",
      ]);

      const result = exportRowsToExcel({
        formName: "Sales",
        headers,
        rows,
        includeFooterTimestamp: true,
      });

      if (result.ok) {
        toast({
          title: "Export successful",
          description: `Sales exported to ${result.filename}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Export failed",
          description: "Failed to export to Excel. Please try again.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to fetch data for export. Please try again.",
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      // Fetch all data without pagination
      const response = await getSalesQueries({
        page: 1,
        page_size: 10000, // Large number to get all records
        search: search,
        date_from: dateFrom,
        date_to: dateTo,
        workflow_status: "converted_to_sale",
      });

      const allRecords = response.results || response.items || [];
      const allFormattedRecords = allRecords.map((record: any) => ({
        displayId: record.sale_no || record.bill_no || record.id || "N/A",
        customerName: record.account?.name || record.party_name || "N/A",
        itemName:
          record.jewellery_type_master?.name || record.jewellery_type || "-",
        dateFormatted: record.order_date || record.date || "N/A",
        statusKey: record.workflow_status || record.status || "unknown",
      }));

      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.text("Sales Report", 14, 20);

      // Add date range info
      doc.setFontSize(10);
      doc.text(`Date Range: ${dateFrom} to ${dateTo}`, 14, 28);
      doc.text(`Total Records: ${allFormattedRecords.length}`, 14, 34);

      // Prepare table data
      const tableData = allFormattedRecords.map((record) => [
        record.displayId,
        record.customerName,
        record.itemName,
        record.dateFormatted,
        STATUS_CONFIG[record.statusKey]?.label || "N/A",
      ]);

      // Add table
      autoTable(doc, {
        head: [["Sale / Bill No", "Customer", "Item", "Date", "Status"]],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [74, 14, 14],
          textColor: 255,
          fontStyle: "bold",
        },
      });

      // Save PDF
      doc.save(`Sales_${dateFrom}_to_${dateTo}.pdf`);

      toast({
        title: "PDF exported",
        description: "Sales exported to PDF successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to fetch data for export. Please try again.",
      });
    }
  };

  const handleExportSinglePDF = async (record: any) => {
    try {
      const doc = new jsPDF();

      // Maroon color scheme matching the branded template
      const maroon = "#4a0e0e";

      // Add header with maroon background
      doc.setFillColor(74, 14, 14);
      doc.rect(0, 0, 210, 25, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("SALE DETAILS", 105, 15, { align: "center" });

      // Add content with list fields only
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");

      let y = 40;
      const lineHeight = 10;

      // Sale/Bill No
      doc.setFont("helvetica", "bold");
      doc.text("Sale/Bill No:", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(record.bill_no || record.id?.slice(0, 8) || "N/A", 70, y);
      y += lineHeight;

      // Customer
      doc.setFont("helvetica", "bold");
      doc.text("Customer:", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(
        record.account?.account_name || record.account?.name || "N/A",
        70,
        y
      );
      y += lineHeight;

      // Item
      doc.setFont("helvetica", "bold");
      doc.text("Item:", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(record.item_name || record.jewellery_type || "-", 70, y);
      y += lineHeight;

      // Date
      doc.setFont("helvetica", "bold");
      doc.text("Date:", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(
        record.created_at
          ? new Date(record.created_at).toLocaleDateString()
          : "N/A",
        70,
        y
      );
      y += lineHeight;

      // Status
      doc.setFont("helvetica", "bold");
      doc.text("Status:", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(STATUS_CONFIG[record.status]?.label || "N/A", 70, y);
      y += lineHeight;

      // Add footer with maroon line
      doc.setDrawColor(74, 14, 14);
      doc.setLineWidth(1);
      doc.line(20, y + 10, 190, y + 10);

      // Save PDF
      doc.save(`Sale_${record.id}.pdf`);

      toast({
        title: "PDF exported",
        description: "Sale exported to PDF successfully.",
      });
    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export PDF. Please try again.",
      });
    }
  };

  const formattedRecords = useMemo(() => {
    return records
      .map((record) => {
        // Guide says: Remove once confirmed as an order.
        // Check multiple fields to determine if this sale has been converted to an order
        const isAlreadyOrder = !!(
          (record as any).order_id ||
          (record as any).order_no ||
          (record as any).production_order_id ||
          (record as any).status === "converted_to_order" ||
          (record as any).converted_to_order === true
        );

        // Debug logging
        if (isAlreadyOrder) {
          console.log("[SalesList] Filtering out converted sale:", {
            id: record.id,
            order_id: (record as any).order_id,
            order_no: (record as any).order_no,
            status: (record as any).status,
          });
        }

        const statusKey = isAlreadyOrder ? "converted_to_order" : "active";

        return {
          ...record,
          statusKey,
          isAlreadyOrder,
          // Guide says: Use first 8 chars of id if bill_no is missing
          displayId:
            record.bill_no || (record.id ? record.id.slice(0, 8) : "—"),
          // Guide: CUSTOMER -> account.account_name
          customerName:
            record.account?.account_name || record.account?.name || "—",
          // Guide: ITEM -> Try item_name first, then jewellery_type as fallback
          itemName:
            record.item_name ||
            record.jewellery_type ||
            (record as any).item_name_custom ||
            (record as any).product_name ||
            "—",
          // Guide: DATE -> created_at
          dateFormatted: record.created_at
            ? new Intl.DateTimeFormat(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              }).format(new Date(record.created_at))
            : "—",
        };
      })
      .filter((record) => !record.isAlreadyOrder);
  }, [records]);

  return (
    <div className="space-y-8">
      <PreviousBackButton />
      <SalesHeader title="Sales" description="Manage confirmed sales." />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Sales list</CardTitle>
              <CardDescription>
                Confirmed sales ready for billing or order conversion.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={loading || formattedRecords.length === 0}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={loading || formattedRecords.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col gap-3 md:flex-row md:items-center"
          >
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by ID, Customer Name, or Item..."
                className="flex-1"
              />
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </div>
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
              No sales found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Sale / Bill No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {formattedRecords.map((record) => {
                    const statusConfig = STATUS_CONFIG[record.statusKey] || {
                      label: "Draft",
                      variant: "secondary",
                    };
                    const StatusIcon = statusConfig.icon;
                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <td className="px-4 py-4 text-sm font-medium">
                          {record.displayId}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium">
                          {record.customerName}
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {record.itemName}
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {record.dateFormatted}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <Badge
                            variant={statusConfig.variant as any}
                            className="gap-1"
                          >
                            {StatusIcon && <StatusIcon className="h-3 w-3" />}
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="flex items-center justify-end gap-2 px-4 py-4 text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportSinglePDF(record)}
                            title="Export PDF"
                          >
                            <FileText className="h-4 w-4" />
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <span>
              Showing page {page} of {totalPages} · {meta.count} total sales
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
    </div>
  );
}
