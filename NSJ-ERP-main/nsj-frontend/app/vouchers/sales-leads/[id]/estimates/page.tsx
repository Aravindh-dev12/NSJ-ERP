"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SalesLeadsHeader } from "@/components/vouchers/SalesLeadsHeader";
import {
  getEstimateSummary,
  selectFinalEstimate,
  convertToSale,
  updateWorkflowStatus,
  getSalesQuery,
} from "@/lib/backend";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Plus,
  ArrowRight,
  Settings2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  TrendingUp,
  Clock,
  FileText,
  Users,
} from "lucide-react";
import { CreateInvoiceButton } from "@/components/invoices/CreateInvoiceButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  inquiry_received: {
    label: "Inquiry Received",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: AlertCircle,
  },
  estimates_pending: {
    label: "Estimates Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Settings2,
  },
  estimates_ready: {
    label: "Estimates Ready",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: TrendingUp,
  },
  estimate_selected: {
    label: "Estimate Selected",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: CheckCircle,
  },
  converted_to_sale: {
    label: "Converted to Sale",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
};

export default function SalesQueryEstimatesPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [summary, setSummary] = useState<any>(null);
  const [salesQuery, setSalesQuery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showSelectModal, setShowSelectModal] = useState<string | null>(null); // estimate_id

  const [selectNotes, setSelectNotes] = useState("");

  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertData, setConvertData] = useState({
    sale_notes: "",
    advance_amount: "" as string | number,
  });

  const [showOrderConvertModal, setShowOrderConvertModal] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const handleConvertToSale = async () => {
    setActionLoading(true);
    try {
      const res = (await convertToSale(id, {
        confirm_conversion: true,
        sale_notes: convertData.sale_notes,
        advance_amount: convertData.advance_amount
          ? Number(convertData.advance_amount)
          : 0,
        item_name: salesQuery?.item_name || "",
        selected_estimate_id: summary?.selected_estimate?.id || "",
      })) as any;

      const saleId = res.sale_id || res.sale_order_id || res.id;

      toast({
        title: "Converted to Sale",
        description: `Order: ${saleId || ""}${res.sale_bill_no ? ` | Bill: ${res.sale_bill_no}` : ""}${res.sale_job_no ? ` | Job: ${res.sale_job_no}` : ""}`,
      });
      setShowConvertModal(false);

      // Explicitly update workflow status to ensure the UI reflects the change
      try {
        await updateWorkflowStatus(id, "converted_to_sale");
      } catch (statusErr) {
        console.warn(
          "Manual status update failed (might be read-only now):",
          statusErr
        );
      }

      fetchData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to convert to sale.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const {
    workflow_status,
    all_estimates,
    selected_estimate,
    can_create_variation,
    can_select_estimate,
    can_convert_to_sale,
  } = summary || {};

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [summaryData, queryData] = await Promise.all([
        getEstimateSummary(id),
        getSalesQuery(id),
      ]);
      setSummary(summaryData);
      setSalesQuery(queryData);
    } catch (error) {
      console.error("Failed to fetch estimate summary:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load estimate summary.",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (showConvertModal && salesQuery?.advance_handling?.amount_weight) {
      setConvertData((prev) => ({
        ...prev,
        advance_amount: salesQuery.advance_handling.amount_weight,
      }));
    } else if (showConvertModal) {
      setConvertData((prev) => ({ ...prev, advance_amount: "" }));
    }
  }, [showConvertModal, salesQuery]);

  const handleUpdateStatus = async (status: string) => {
    setActionLoading(true);
    try {
      await updateWorkflowStatus(id, status);
      toast({
        title: "Status Updated",
        description: `Workflow status changed to ${status.replace(/_/g, " ")}`,
      });
      fetchData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectEstimate = async () => {
    if (!showSelectModal) return;
    setActionLoading(true);
    try {
      await selectFinalEstimate(id, {
        estimate_id: showSelectModal,
        notes: selectNotes,
      });
      toast({
        title: "Estimate Selected",
        description: "Workflow moved to selection phase.",
      });
      setShowSelectModal(null);
      setSelectNotes("");
      fetchData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to select estimate.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  let filteredEstimates = all_estimates?.filter((est: any) => {
    const estQueryId =
      est.sales_query_id ||
      est.sales_query?.id ||
      est.sales_query_details?.id ||
      est.query_id ||
      est.linked_query_id;

    // Strict comparison for linked estimates
    return estQueryId && String(estQueryId) === String(id);
  });
  // This handles the case where users created an estimate but didn't save/link the query yet.
  if (!filteredEstimates || filteredEstimates.length === 0) {
    const currentJewelryType =
      salesQuery?.jewellery_type || summary?.jewellery_type || "";

    if (currentJewelryType) {
      filteredEstimates = all_estimates?.filter((est: any) => {
        const estQueryId =
          est.sales_query_id ||
          est.sales_query?.id ||
          est.sales_query_details?.id ||
          est.query_id ||
          est.linked_query_id;

        // Condition: Must be UNLINKED (no query ID) matches jewelry type
        const isUnlinked = !estQueryId;
        const matchesType =
          (est.item_name || est.jewellery_type || "").trim().toLowerCase() ===
          currentJewelryType.trim().toLowerCase();

        return isUnlinked && matchesType;
      });
    }
  }
  const StatusIcon = STATUS_CONFIG[workflow_status]?.icon || AlertCircle;

  return (
    <div className="space-y-6">
      {/* Header & Status Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <SalesLeadsHeader
          title={`Estimate Workflow ${summary?.account_name ? `- ${summary.account_name}` : summary?.sales_query?.account?.name ? `- ${summary.sales_query?.account?.name}` : ""}`}
          description={`Current Status: ${STATUS_CONFIG[workflow_status]?.label || "Processing"}`}
        />

        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 lg:gap-3 w-full lg:w-auto shrink-0">
          <Badge
            variant="outline"
            className="px-4 py-1.5 flex items-center gap-2"
          >
            <StatusIcon className="h-4 w-4" />
            {STATUS_CONFIG[workflow_status]?.label}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Estimate Status
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => handleUpdateStatus(key)}
                  className="gap-2"
                >
                  <cfg.icon className="h-4 w-4" />
                  {cfg.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" onClick={() => router.back()} size="sm">
            Back to Query
          </Button>
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex flex-wrap gap-4">
        {can_create_variation && (
          <Button
            onClick={() => {
              const accountId =
                salesQuery?.account?.id ||
                summary?.sales_query?.account?.id ||
                "";
              const accountName =
                salesQuery?.account?.account_name ||
                salesQuery?.account?.name ||
                summary?.sales_query?.account?.account_name ||
                summary?.sales_query?.account?.name ||
                summary?.account_name ||
                "";
              const jewelryType =
                salesQuery?.jewellery_type || summary?.jewellery_type || "";

              // Get sub-account information if available
              const subAccountRecordId =
                salesQuery?.sub_account_record?.id ||
                salesQuery?.sub_account_record_id ||
                summary?.sub_account_record?.id ||
                summary?.sub_account_record_id ||
                "";
              const subAccountName =
                salesQuery?.sub_account_record?.sub_account_name ||
                salesQuery?.sub_account ||
                summary?.sub_account_record?.sub_account_name ||
                summary?.sub_account ||
                "";

              // Build URL with all available parameters
              let url = `/vouchers/estimates/new?sales_query_id=${id}&jewelry_type=${encodeURIComponent(jewelryType)}&account_id=${accountId}&account_name=${encodeURIComponent(accountName)}`;

              if (subAccountRecordId) {
                url += `&sub_account_record_id=${subAccountRecordId}`;
              }
              if (subAccountName) {
                url += `&sub_account_name=${encodeURIComponent(subAccountName)}`;
              }

              router.push(url);
            }}
            className="gap-2 bg-amber-600 hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
            Create New Estimate
          </Button>
        )}
        {can_convert_to_sale && workflow_status !== "converted_to_sale" && (
          <Button
            onClick={() => setShowConvertModal(true)}
            variant="secondary"
            className="gap-2"
            disabled={!selected_estimate}
            title={
              !selected_estimate ? "Please select a final estimate first" : ""
            }
          >
            <CheckCircle2 className="h-4 w-4" />
            Convert to Sale
          </Button>
        )}
      </div>

      {/* Estimates Grid */}
      <div className="grid gap-6">
        {!filteredEstimates || filteredEstimates.length === 0 ? (
          <Card className="border-dashed py-12">
            <CardContent className="flex flex-col items-center justify-center text-muted-foreground gap-4">
              <Clock className="h-12 w-12 opacity-20" />
              <div className="text-center">
                <p className="font-medium">No variations created yet.</p>
                <p className="text-sm">
                  Start by creating the first estimate or a variation.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredEstimates.map((est: any) => {
            const isSelected = selected_estimate?.id === est.id;
            return (
              <Card
                key={est.id}
                className={`overflow-hidden transition-all ${isSelected ? "border-primary ring-1 ring-primary" : ""}`}
              >
                <CardHeader className="bg-muted/10 pb-4 border-b">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-start gap-4">
                      {/* Product Image Thumbnail */}
                      {/* Product Image Thumbnail */}
                      {(est.product_image || est.image || est.image_url) && (
                        <div
                          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-white cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                          onClick={() => {
                            const imgUrl = (
                              est.product_image ||
                              est.image ||
                              est.image_url
                            ).startsWith("http")
                              ? est.product_image || est.image || est.image_url
                              : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${est.product_image || est.image || est.image_url}`;
                            setImagePreviewUrl(imgUrl);
                          }}
                          title="Click to view full size"
                        >
                          <img
                            src={
                              (
                                est.product_image ||
                                est.image ||
                                est.image_url
                              ).startsWith("http")
                                ? est.product_image ||
                                  est.image ||
                                  est.image_url
                                : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${est.product_image || est.image || est.image_url}`
                            }
                            alt="Product"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-xl">
                            {est.variation_description || est.item_name}
                          </CardTitle>
                          {isSelected && <Badge>Selected</Badge>}
                          {est.is_linked && (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              Linked
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className="text-xs font-normal"
                          >
                            {est.date}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                          <span>ID: {est.id}</span>
                          {est.base_estimate_id && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <ArrowRight className="h-3 w-3" />
                              Variation of {est.base_estimate_id.slice(0, 8)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          ₹{est.grand_total.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                          Grand Total
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(
                              `/vouchers/estimates/${est.id}/edit?sales_query_id=${id}`
                            )
                          }
                        >
                          Edit
                        </Button>
                        {(can_select_estimate || !selected_estimate) &&
                          !isSelected && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setShowSelectModal(est.id)}
                            >
                              Select Final
                            </Button>
                          )}
                        <CreateInvoiceButton
                          estimateId={est.id}
                          salesQueryId={id}
                          itemName={est.variation_description || est.item_name}
                          variant="default"
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Customer Details Section */}
                  {(est.account?.account_name ||
                    est.account?.name ||
                    est.sub_account_record?.sub_account_name ||
                    est.sub_account) && (
                    <div className="mb-4 pb-4 border-b">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase">
                          Customer Details
                        </span>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2 text-sm">
                        {(est.account?.account_name || est.account?.name) && (
                          <div>
                            <span className="text-muted-foreground">
                              Account:
                            </span>
                            <span className="ml-2 font-medium">
                              {est.account?.account_name || est.account?.name}
                            </span>
                          </div>
                        )}
                        {(est.sub_account_record?.sub_account_name ||
                          est.sub_account) && (
                          <div>
                            <span className="text-muted-foreground">
                              Sub Account:
                            </span>
                            <span className="ml-2 font-medium">
                              {est.sub_account_record?.sub_account_name ||
                                est.sub_account}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Line Items Table */}
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3 text-left font-bold">
                              Particulars
                            </th>
                            <th className="px-4 py-3 text-right font-bold">
                              PC
                            </th>
                            <th className="px-4 py-3 text-right font-bold">
                              Weight/Qty
                            </th>
                            <th className="px-4 py-3 text-right font-bold">
                              Rate
                            </th>
                            <th className="px-4 py-3 text-right font-bold">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {est.line_items?.map((item: any, idx: number) => (
                            <tr
                              key={item.id || idx}
                              className="hover:bg-muted/5 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="font-semibold text-gray-800">
                                  {item.particulars}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                  {[
                                    item.shape && `Shape: ${item.shape}`,
                                    item.colour &&
                                      (item.color || item.colour) &&
                                      `Color: ${item.color || item.colour}`,
                                    item.clarity && `Clarity: ${item.clarity}`,
                                  ]
                                    .filter(Boolean)
                                    .join(" | ")}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                                {item.pc || "-"}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                                {item.weight
                                  ? `${item.weight} ${item.unit || ""}`
                                  : "-"}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                                {item.rate
                                  ? `₹${item.rate.toLocaleString()}`
                                  : "-"}
                              </td>
                              <td className="px-4 py-3 text-right font-bold tabular-nums text-primary">
                                ₹{item.amount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Selection & Sale Notes */}
                  {isSelected &&
                    (salesQuery?.selection_notes ||
                      salesQuery?.sale_notes ||
                      summary?.selection_notes ||
                      summary?.sale_notes ||
                      est.selection_notes ||
                      est.sale_notes ||
                      selected_estimate?.selection_notes ||
                      selected_estimate?.sale_notes ||
                      salesQuery?.advance_handling?.amount_weight ||
                      salesQuery?.advance_amount ||
                      summary?.advance_amount) && (
                      <div className="mt-6 pt-5 border-t space-y-4">
                        <div className="flex items-center justify-between items-start gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className="bg-indigo-50 text-indigo-700 border-indigo-100 uppercase text-[10px]"
                          >
                            Selection & Sale Details
                          </Badge>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          {(salesQuery?.selection_notes ||
                            summary?.selection_notes ||
                            est.selection_notes ||
                            selected_estimate?.selection_notes) && (
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">
                                Selection Notes
                              </span>
                              <div className="p-3 rounded-md bg-amber-50/50 border border-amber-100 text-sm italic text-gray-700">
                                {salesQuery?.selection_notes ||
                                  summary?.selection_notes ||
                                  est.selection_notes ||
                                  selected_estimate?.selection_notes}
                              </div>
                            </div>
                          )}
                          {(salesQuery?.sale_notes ||
                            summary?.sale_notes ||
                            est.sale_notes ||
                            selected_estimate?.sale_notes) && (
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">
                                Sale Notes
                              </span>
                              <div className="p-3 rounded-md bg-green-50/50 border border-green-100 text-sm italic text-gray-700">
                                {salesQuery?.sale_notes ||
                                  summary?.sale_notes ||
                                  est.sale_notes ||
                                  selected_estimate?.sale_notes}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  <div className="flex flex-wrap justify-end gap-x-12 gap-y-4 mt-6 pt-5 border-t">
                    <div className="flex flex-col items-end">
                      <span className="text-[11px] text-muted-foreground uppercase font-bold">
                        Subtotal
                      </span>
                      <span className="font-semibold tabular-nums text-gray-700">
                        ₹{est.total_taxable_value.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[11px] text-muted-foreground uppercase font-bold">
                        GST
                      </span>
                      <span className="font-semibold tabular-nums text-gray-700">
                        ₹{est.gst_amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col items-end pl-6 border-l">
                      <span className="text-[11px] text-primary uppercase font-bold">
                        Total
                      </span>
                      <span className="font-extrabold text-xl text-primary tabular-nums">
                        ₹{est.grand_total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modals Implementation (Simulated) */}

      {/* Selection Modal */}
      {showSelectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle>Confirm Selection</CardTitle>
              <CardDescription>
                Mark this variation as the final choice for the client.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <Textarea
                  placeholder="Add any selection notes..."
                  className="min-h-[100px]"
                  value={selectNotes}
                  onChange={(e) => setSelectNotes(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowSelectModal(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button onClick={handleSelectEstimate} disabled={actionLoading}>
                  {actionLoading ? "Processing..." : "Select Final"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conversion Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-full">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle>Convert to Sale</CardTitle>
              </div>
              <CardDescription>
                This will generate a formal Sale Order. Ensure advance amount is
                correct.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex gap-3 text-xs text-blue-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>
                  Selected Estimate:{" "}
                  <strong>
                    ₹{selected_estimate?.grand_total.toLocaleString()}
                  </strong>
                </p>
              </div>
              <div className="space-y-2">
                <Label>Sale Notes</Label>
                <Textarea
                  placeholder="Internal notes for production/delivery"
                  value={convertData.sale_notes}
                  onChange={(e) =>
                    setConvertData({
                      ...convertData,
                      sale_notes: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowConvertModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button onClick={handleConvertToSale} disabled={actionLoading}>
                  {actionLoading ? "Processing..." : "Complete Sale"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Image Preview Modal */}
      {imagePreviewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200"
          onClick={() => setImagePreviewUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setImagePreviewUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-2xl font-bold"
            >
              ✕
            </button>
            <img
              src={imagePreviewUrl}
              alt="Product Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
