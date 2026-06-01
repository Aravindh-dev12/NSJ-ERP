"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLocalFirstOfMonth, getLocalToday } from "@/lib/date";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { SalesLeadsHeader } from "./SalesLeadsHeader";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import {
  getSalesQueries,
  getOrderFromSalesQuery,
  SalesQuery,
} from "@/lib/backend";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { exportRowsToExcel, exportToExcel } from "@/lib/export";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Search,
  Filter,
  FileText,
  ChevronRight,
  ChevronLeft,
  SearchX,
  Eye,
  Loader2,
  Download,
  FileSpreadsheet,
} from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    color: string;
  }
> = {
  inquiry_received: {
    label: "Inquiry Received",
    variant: "secondary",
    color: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  },
  estimates_pending: {
    label: "Estimates Pending",
    variant: "outline",
    color: "bg-orange-100 text-orange-800 hover:bg-orange-200",
  },
  estimates_ready: {
    label: "Estimates Ready",
    variant: "default",
    color: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  },
  estimate_selected: {
    label: "Estimate Selected",
    variant: "default",
    color: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
  },
  converted_to_sale: {
    label: "Converted to Sale",
    variant: "default",
    color: "bg-green-100 text-green-800 hover:bg-green-200",
  },
  converted_to_order: {
    label: "Order Created",
    variant: "outline",
    color: "bg-purple-100 text-purple-800 hover:bg-purple-200",
  },
  cancelled: {
    label: "Cancelled",
    variant: "destructive",
    color: "bg-red-100 text-red-800 hover:bg-red-200",
  },
};

const PAGE_SIZE = 10;

export function SalesLeadsList() {
  const router = useRouter();
  const { toast } = useToast();
  const [queries, setQueries] = useState<SalesQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewProcessLoading, setViewProcessLoading] = useState<
    Record<string, boolean>
  >({});

  const getDefaultDateFrom = () => {
    return getLocalFirstOfMonth();
  };

  const getDefaultDateTo = () => {
    return getLocalToday();
  };

  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom());
  const [dateTo, setDateTo] = useState(getDefaultDateTo());

  useEffect(() => {
    const loadQueries = async () => {
      setLoading(true);
      try {
        const response = await getSalesQueries({
          page,
          page_size: PAGE_SIZE,
          search: searchTerm,
          date_from: dateFrom,
          date_to: dateTo,
          // Try both parameter names to ensure compatibility with different backend versions
          workflow_status: statusFilter === "all" ? undefined : statusFilter,
          status: statusFilter === "all" ? undefined : statusFilter,
        });

        const items = response.items || [];
        const count =
          (response.total as number) ||
          (response.count as number) ||
          items.length;

        // Client-side filtering fallback:
        // If backend returns all items (ignoring filter), filter them here for the current page
        const filteredItems = items.filter((query) => {
          if (
            statusFilter !== "all" &&
            query.workflow_status !== statusFilter
          ) {
            return false;
          }
          return true;
        });

        setQueries(filteredItems);
        setTotalCount(count);
        setTotalPages(Math.max(1, Math.ceil(count / PAGE_SIZE)));
      } catch (error) {
        console.error("Failed to fetch sales leads", error);
      } finally {
        setLoading(false);
      }
    };
    loadQueries();
  }, [page, searchTerm, statusFilter, dateFrom, dateTo]);

  // Reset to first page when filters change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleViewProcess = async (queryId: string) => {
    setViewProcessLoading((prev) => ({ ...prev, [queryId]: true }));
    try {
      const response = await getOrderFromSalesQuery(queryId);

      if (response.success && response.order_id) {
        // Redirect to order tracking page
        router.push(`/vouchers/orders/${response.order_id}/tracking/`);
      } else {
        // Show error message
        toast({
          variant: "destructive",
          title: "Cannot View Process",
          description: response.message || "Failed to load order details.",
        });
      }
    } catch (error: any) {
      console.error("Failed to get order from sales lead:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.message || "Failed to load order details. Please try again.",
      });
    } finally {
      setViewProcessLoading((prev) => ({ ...prev, [queryId]: false }));
    }
  };

  const handleExportSingleExcel = async (query: SalesQuery) => {
    try {
      const response = await fetch(`/api/sales-queries/${query.id}/`);
      const q = await response.json();

      const fmtArr = (v: any) =>
        Array.isArray(v) ? v.join(", ") : String(v ?? "");
      const fmtBool = (v: any) =>
        v === true ? "Yes" : v === false ? "No" : "";
      const fmtStr = (v: any) => String(v ?? "");

      const headers = [
        "Lead ID",
        "Order Date",
        "Sales Person",
        "Vendor",
        "Account",
        "Sub Account",
        "Phone",
        "Email",
        "City",
        "Delivery Type",
        "PAN / GSTIN",
        "Reference Source",
        "Occasion",
        "Required Delivery Date",
        "Stock In Deadline",
        "Purpose",
        "Jewellery Type",
        "Gold Quality",
        "Size Details",
        "Fit Details",
        "Style Preference",
        "Metal Preference",
        "Diamond Shape",
        "Color Clarity",
        "Origin",
        "Diamond Budget",
        "Diamond Priority",
        "Gemstone Preference",
        "Gemstone Color Clarity",
        "Gemstone Origin",
        "Other Details",
        "Sample",
        "Sample Details",
        "Budget Range",
        "Urgency Level",
        "Must Have",
        "Must Avoid",
        "Special Instructions",
        "Transfer Department",
        "Advance Type",
        "Amount / Weight",
        "Date Received",
        "Receipt Generated",
        "Accounts Notified",
        "Gold Rate Locked",
        "Gold Rate Fixed",
        "Gold Rate Date",
        "ERP Entry Done",
        "Next Dept Triggered",
        "Verified By",
        "Colour Stone Demand",
        "Raw Material Instructions",
        "Design Dept Instructions",
        "Production Dept Instructions",
        "Accounts Dept Instructions",
        "Reminders",
        "Rough Work",
        "Final Design",
        "Delivery Notes",
        "Follow Up Notes",
        "Status",
        "Created At",
        "Updated At",
      ];

      const dataRow = [
        fmtStr(q.id ?? query.id),
        fmtStr(q.order_date ?? query.order_date),
        fmtStr(q.sales_person ?? query.sales_person),
        fmtStr(q.vendor),
        fmtStr(
          q.account?.account_name ?? q.account?.name ?? query.account?.name
        ),
        fmtStr(q.sub_account),
        fmtStr(q.phone_number),
        fmtStr(q.email),
        fmtStr(q.city),
        fmtStr(q.client_delivery_type ?? q.delivery_type),
        fmtStr(q.pan_gstin),
        fmtStr(q.reference_source),
        fmtArr(q.occasion),
        fmtStr(q.required_delivery_date),
        fmtStr(q.stock_in_deadline),
        fmtArr(q.purpose),
        fmtStr(
          q.jewellery_type_master?.name ??
            q.jewellery_type ??
            query.jewellery_type_master?.name ??
            query.jewellery_type
        ),
        fmtStr(q.gold_quality ?? query.gold_quality),
        fmtStr(q.size_details),
        fmtStr(q.fit_details),
        fmtStr(q.style_preference),
        fmtStr(q.metal_preference),
        fmtStr(q.diamond_shape),
        fmtStr(q.color_clarity),
        fmtStr(q.origin),
        fmtStr(q.diamond_budget),
        fmtStr(q.diamond_priority),
        fmtStr(q.gemstone_preference),
        fmtStr(q.gemstone_color_clarity),
        fmtStr(q.gemstone_origin),
        fmtStr(q.other_details),
        fmtStr(q.sample),
        fmtStr(q.sample_details),
        fmtStr(q.budget_range),
        fmtStr(q.urgency_level),
        fmtStr(q.must_have),
        fmtStr(q.must_avoid),
        fmtStr(q.special_instructions),
        fmtStr(q.transfer_department),
        fmtStr(q.advance_type),
        fmtStr(q.amount_weight),
        fmtStr(q.date_received),
        fmtBool(q.receipt_generated),
        fmtBool(q.accounts_notified),
        fmtBool(q.gold_rate_locked),
        fmtStr(q.gold_rate_fixed),
        fmtStr(q.gold_rate_date),
        fmtBool(q.erp_entry_done),
        fmtStr(q.next_dept_triggered),
        fmtStr(q.verified_by),
        fmtStr(q.colour_stone_demand),
        fmtStr(q.raw_material_instructions),
        fmtStr(q.design_dept_instructions),
        fmtStr(q.production_dept_instructions),
        fmtStr(q.accounts_dept_instructions),
        fmtStr(q.reminders),
        fmtStr(q.rough_work_notes ?? q.rough_work),
        fmtStr(q.final_design_url ?? q.final_design),
        fmtStr(q.delivery_notes),
        fmtStr(q.follow_up_notes ?? q.follow_up_log),
        fmtStr(
          STATUS_CONFIG[q.workflow_status ?? query.workflow_status]?.label ??
            q.workflow_status ??
            query.workflow_status
        ),
        fmtStr(q.created_at),
        fmtStr(q.updated_at),
      ];

      // Generate custom filename: queryid_date_customername
      const queryId = q.id ?? query.id ?? "";
      const orderDate =
        q.order_date ??
        query.order_date ??
        new Date().toISOString().split("T")[0];
      const customerName =
        q.account?.account_name ||
        q.account?.name ||
        query.account?.account_name ||
        query.account?.name ||
        "Unknown";

      // Format date as YYYY-MM-DD
      const formattedDate = orderDate.split("T")[0];

      // Clean customer name to remove special characters
      const cleanCustomerName = customerName.replace(/[^a-zA-Z0-9]/g, "_");

      const customFilename = `${queryId}_${formattedDate}_${cleanCustomerName}.xlsx`;

      const result = exportToExcel({
        formName: "Sales Lead",
        headers,
        dataRow,
        includeFooterTimestamp: true,
        filename: customFilename,
      });

      if (result.ok) {
        toast({
          title: "Excel exported",
          description: `Sales lead exported to ${result.filename}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Export failed",
          description: "Failed to export to Excel. Please try again.",
        });
      }
    } catch (error) {
      console.error("Failed to export Excel:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export Excel. Please try again.",
      });
    }
  };

  const handleExportExcel = async () => {
    const headers = [
      "Account",
      "Sales Person",
      "Item",
      "Gold Quality",
      "Status",
      "Order Date",
    ];

    try {
      // Fetch all data without pagination
      const response = await getSalesQueries({
        page: 1,
        page_size: 10000, // Large number to get all records
        search: searchTerm,
        date_from: dateFrom,
        date_to: dateTo,
        workflow_status: statusFilter === "all" ? undefined : statusFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      const allQueries = response.items || [];

      const rows = allQueries.map((query) => [
        query.account?.name || "N/A",
        query.sales_person || "N/A",
        query.jewellery_type_master?.name || query.jewellery_type || "-",
        query.gold_quality || "-",
        STATUS_CONFIG[query.workflow_status]?.label ||
          query.workflow_status ||
          "N/A",
        query.order_date || "N/A",
      ]);

      const result = exportRowsToExcel({
        formName: "Sales Leads",
        headers,
        rows,
        includeFooterTimestamp: true,
      });

      if (result.ok) {
        toast({
          title: "Export successful",
          description: `Sales leads exported to ${result.filename}`,
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
        search: searchTerm,
        date_from: dateFrom,
        date_to: dateTo,
        workflow_status: statusFilter === "all" ? undefined : statusFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      const allQueries = response.items || [];

      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.text("Sales Leads Report", 14, 20);

      // Add date range info
      doc.setFontSize(10);
      doc.text(`Date Range: ${dateFrom} to ${dateTo}`, 14, 28);
      doc.text(`Total Records: ${allQueries.length}`, 14, 34);

      // Prepare table data
      const tableData = allQueries.map((query) => [
        query.account?.name || "N/A",
        query.sales_person || "N/A",
        query.jewellery_type_master?.name || query.jewellery_type || "-",
        query.gold_quality || "-",
        STATUS_CONFIG[query.workflow_status]?.label ||
          query.workflow_status ||
          "N/A",
        query.order_date || "N/A",
      ]);

      // Add table
      autoTable(doc, {
        head: [
          [
            "Account",
            "Sales Person",
            "Item",
            "Gold Quality",
            "Status",
            "Order Date",
          ],
        ],
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
      doc.save(`Sales_Leads_${dateFrom}_to_${dateTo}.pdf`);

      toast({
        title: "PDF exported",
        description: "Sales leads exported to PDF successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to fetch data for export. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PreviousBackButton />
      <SalesLeadsHeader
        title="Sales Leads"
        description="View and manage all sales inquiries."
      />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Inquiries</CardTitle>
              <CardDescription>
                List of all sales leads and their workflow status.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={loading || queries.length === 0}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={loading || queries.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Link href="/vouchers/sales-leads/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Create New Lead
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by account, item, or salesperson..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <div className="w-[200px]">
              <Label htmlFor="status">Status Filter</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={handleStatusChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
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
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : queries.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center bg-muted/20">
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "No leads match your search"
                  : "No sales leads found."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Account
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Sales Person
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Item
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Gold Quality
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Order Date
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {queries.map((query) => {
                      const status = STATUS_CONFIG[query.workflow_status] || {
                        label: query.workflow_status || "N/A",
                        variant: "secondary" as const,
                        color: "bg-gray-100 text-gray-800 hover:bg-gray-200",
                      };
                      return (
                        <tr
                          key={query.id}
                          className="border-t hover:bg-muted/30"
                        >
                          <td className="px-4 py-3 font-medium">
                            {query.account?.name || "N/A"}
                          </td>
                          <td className="px-4 py-3">{query.sales_person}</td>
                          <td className="px-4 py-3">
                            {query.jewellery_type_master?.name ||
                              query.jewellery_type ||
                              "-"}
                          </td>
                          <td className="px-4 py-3">
                            {query.gold_quality || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">{query.order_date}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              {query.workflow_status ===
                              "converted_to_order" ? (
                                <>
                                  <Link
                                    href={`/vouchers/sales-leads/${query.id}/estimates`}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-blue-600 text-blue-600"
                                    >
                                      Estimates
                                    </Button>
                                  </Link>
                                  <Link
                                    href={`/vouchers/sales-leads/${query.id}`}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-amber-600 text-amber-600"
                                    >
                                      View
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => handleViewProcess(query.id)}
                                    disabled={viewProcessLoading[query.id]}
                                  >
                                    {viewProcessLoading[query.id] ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading...
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Process
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleExportSingleExcel(query)
                                    }
                                    title="Export Excel"
                                  >
                                    <FileSpreadsheet className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : query.workflow_status ===
                                "converted_to_sale" ? (
                                <>
                                  <Link
                                    href={`/vouchers/sales-leads/${query.id}/estimates`}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-blue-600 text-blue-600"
                                    >
                                      Estimates
                                    </Button>
                                  </Link>
                                  <Link
                                    href={`/vouchers/sales-leads/${query.id}`}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-amber-600 text-amber-600"
                                    >
                                      View
                                    </Button>
                                  </Link>
                                  <Link
                                    href={`/vouchers/sales-leads/${query.id}/convert-to-order`}
                                  >
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      Convert to Order
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleExportSingleExcel(query)
                                    }
                                    title="Export Excel"
                                  >
                                    <FileSpreadsheet className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Link
                                    href={`/vouchers/sales-leads/${query.id}/estimates`}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                    >
                                      Estimates
                                    </Button>
                                  </Link>
                                  <Link
                                    href={`/vouchers/sales-leads/${query.id}`}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-amber-600 text-amber-600 hover:bg-amber-50"
                                    >
                                      View
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleExportSingleExcel(query)
                                    }
                                    title="Export Excel"
                                  >
                                    <FileSpreadsheet className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {queries.length} of {totalCount} inquiries
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <div className="text-sm font-medium">
                    Page {page} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
