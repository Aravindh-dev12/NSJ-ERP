import { ExportColumnModal } from "./ExportColumnModal";
// Dashboard visuals: KPI cards, charts, and recent orders table

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DashboardKPIs } from "./DashboardKPIs";
import { DashboardRecentOrders } from "./DashboardRecentOrders";
import { InvoiceUploadModal } from "./InvoiceUploadModal";
import { Download, Loader2, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  backend,
  SalesRecordAggregates,
  SalesRankingEntry,
} from "@/lib/backend";
import { ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface HorizontalBarItem {
  label: string;
  value: number;
}

function parseNumeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/[,\s]/g, ""));
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function normalizeRanking(
  entries: SalesRankingEntry[] | undefined,
  labelKeys: string[]
): HorizontalBarItem[] {
  if (!entries || entries.length === 0) return [];

  return entries
    .map((entry) => {
      const label = labelKeys
        .map((key) => entry[key])
        .find(
          (candidate) =>
            typeof candidate === "string" && candidate.trim() !== ""
        );

      const value = parseNumeric(
        entry.total_sales ?? entry.value ?? entry.total
      );

      if (!label || value === null) return null;

      return {
        label,
        value,
      };
    })
    .filter((item): item is HorizontalBarItem => Boolean(item))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

function HorizontalBarCard({
  title,
  items,
  loading,
  error,
}: {
  title: string;
  items: HorizontalBarItem[];
  loading: boolean;
  error: string | null;
}) {
  let content: ReactNode;

  if (loading) {
    content = (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="h-3 w-24 animate-pulse rounded-full bg-gray-200" />
            <div className="h-3 flex-1 animate-pulse rounded-full bg-gray-100" />
          </div>
        ))}
      </div>
    );
  } else if (error) {
    content = (
      <p className="text-sm text-red-500">
        Unable to load {title.toLowerCase()}. {error}
      </p>
    );
  } else if (!items.length) {
    content = (
      <p className="text-sm text-muted-foreground">No data available.</p>
    );
  } else {
    const maxValue = Math.max(...items.map((item) => item.value));
    content = (
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm font-medium text-gray-700">
              <span className="truncate pr-4" title={item.label}>
                {item.label}
              </span>
              <span className="text-gray-900">
                ₹
                {item.value.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-blue-500"
                style={{
                  width: `${Math.max((item.value / maxValue) * 100, 4)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

export function DashboardVisuals() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportColumns, setExportColumns] = useState<string[]>([]);
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>(
    []
  );
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [aggregates, setAggregates] = useState<SalesRecordAggregates | null>(
    null
  );
  const [aggregatesLoading, setAggregatesLoading] = useState(true);
  const [aggregatesError, setAggregatesError] = useState<string | null>(null);
  const [exportFilters, setExportFilters] = useState<
    Record<string, string | number>
  >({});
  const [exporting, setExporting] = useState(false);
  const [topVendors, setTopVendors] = useState<HorizontalBarItem[]>([]);
  const [topProducts, setTopProducts] = useState<HorizontalBarItem[]>([]);
  const [topCatNos, setTopCatNos] = useState<HorizontalBarItem[]>([]);
  const { toast } = useToast();

  const handleExport = () => {
    setShowExportModal(true);
  };

  // Called when user confirms export in modal
  const handleExportConfirmed = async () => {
    setShowExportModal(false);
    setExporting(true);
    const filtersPayload = Object.keys(exportFilters).length
      ? exportFilters
      : undefined;
    const defaultFileName = `sales-records-${new Date().toISOString().slice(0, 10)}.csv`;
    try {
      const { blob, fileName } = await backend.exportSalesRecords({
        filters: filtersPayload,
        file_name: defaultFileName,
        include_columns: selectedExportColumns,
      });
      if (typeof window !== "undefined") {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName || defaultFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      toast({
        title: "Export ready",
        description: "Your CSV download has started.",
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to export sales records.";
      toast({
        title: "Export failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = () => {
    setShowUploadModal(true);
  };

  // Called after successful upload
  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchAggregates = async () => {
      setAggregatesLoading(true);
      try {
        const response = await backend.getSalesAggregates();
        if (!cancelled) {
          setAggregates(response);
          setAggregatesError(null);
          // Update HorizontalBarCard data on aggregates fetch
          setTopVendors(
            normalizeRanking(
              response?.top_vendors_by_sales ?? response?.by_vendor,
              ["vendor_name", "name", "customer", "customer_name"]
            )
          );
          setTopProducts(
            normalizeRanking(
              response?.top_products_by_sales ?? response?.by_category,
              ["product_name", "name", "category", "sku"]
            )
          );
          setTopCatNos(
            normalizeRanking(
              (response?.top_cat_no_by_sales ?? response?.by_cat_no) as
                | SalesRankingEntry[]
                | undefined,
              ["cat_no", "cat number", "cat_no_name", "name"]
            )
          );
        }
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to load aggregates.";
        if (!cancelled) {
          setAggregates(null);
          setAggregatesError(message);
          setTopVendors([]);
          setTopProducts([]);
          setTopCatNos([]);
        }
      } finally {
        if (!cancelled) {
          setAggregatesLoading(false);
        }
      }
    };

    fetchAggregates();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // (Removed useMemo for topVendors, topProducts, topSalesPersons)

  return (
    <>
      {/* Header with Action Buttons */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleImport}
            className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700"
          >
            <Upload className="h-4 w-4" />
            <span>Import Data</span>
          </button>
          <button
            onClick={() => {
              const defaultColumns = [
                "invoice_no",
                "invoice_date",
                "party_name",
                "city",
                "state",
                "cat_no",
                "product_description",
                "product_category",
                "quantity",
                "rate",
                "total_amt",
                "net_amount",
                "tcs",
                "freight",
                "disc_percent",
                "adjustment_of_goods_return",
                "lr_no",
                "lr_date",
                "transporter_name",
                "order_no",
                "po_no",
                "order_dt",
                "sales_person_name",
              ];
              setExportColumns(defaultColumns);
              setSelectedExportColumns(defaultColumns);
              handleExport();
            }}
            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{exporting ? "Exporting..." : "Export CSV"}</span>
          </button>
        </div>
      </div>

      {showExportModal && (
        <ExportColumnModal
          columns={exportColumns}
          selected={selectedExportColumns}
          onChange={setSelectedExportColumns}
          onClose={() => setShowExportModal(false)}
          onExport={handleExportConfirmed}
          loading={exporting}
        />
      )}

      <DashboardKPIs refreshKey={refreshKey} />

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <HorizontalBarCard
          title="Top Vendors by Sales"
          items={topVendors}
          loading={aggregatesLoading}
          error={aggregatesError}
        />
        <HorizontalBarCard
          title="Top Product Categories by Sales"
          items={topProducts}
          loading={aggregatesLoading}
          error={aggregatesError}
        />
        <HorizontalBarCard
          title="Top Cat No by Sales"
          items={topCatNos}
          loading={aggregatesLoading}
          error={aggregatesError}
        />
      </div>

      <DashboardRecentOrders
        onFiltersChanged={setExportFilters}
        refreshKey={refreshKey}
      />

      {/* Upload Modal */}
      {showUploadModal && (
        <InvoiceUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </>
  );
}
