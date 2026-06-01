"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import {
  Calendar,
  User,
  Package,
  DollarSign,
  Clock,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import {
  voucherDetail,
  getSalesQuery,
  type Voucher,
  type SalesQuery,
} from "@/lib/backend";

interface TimelineEvent {
  date: string;
  event: string;
  description: string;
  amount?: number;
  status?: string;
}

interface OrderHistory {
  order_id: string;
  bill_no: string;
  timeline: TimelineEvent[];
  current_status: string;
  customer_name: string;
  item: string;
  delivery_date?: string;
  advance_payment: string;
  days_since_order: number;
  days_since_advance?: number;
}

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  HOME: "Home Delivery",
  PICKUP: "Pickup",
  INSTORE: "In-Store",
  LOCAL_PARCEL: "Local Parcel",
  JAY_AMBE: "Jay Ambe Express Logistics",
  MAA_BHAWANI: "Maa Bhawani Logistics",
  BVC: "BVC Logistics",
  SEQUEL: "Sequel Logistics",
};

function formatDeliveryType(value?: string | null): string {
  if (!value) return "—";
  return (
    DELIVERY_TYPE_LABELS[value] ??
    value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export default function OrderHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [history, setHistory] = useState<OrderHistory | null>(null);
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [salesQuery, setSalesQuery] = useState<SalesQuery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchData().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [historyRes, voucherData] = await Promise.all([
        fetch(`${API_BASE_URL}/vouchers/${orderId}/history/`, {
          headers: { Accept: "application/json" },
          credentials: "include",
        }),
        voucherDetail(orderId),
      ]);

      if (historyRes.ok) setHistory(await historyRes.json());
      setVoucher(voucherData);

      // Fetch sales query only if this order was converted from one
      const sqId =
        (voucherData as any).sales_query_id || (voucherData as any).query_id;
      if (sqId) {
        try {
          const sq = await getSalesQuery(sqId);
          setSalesQuery(sq);
        } catch {
          // Sales query not found or deleted — just skip it silently
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load order information");
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (img: any): string => {
    if (!img || typeof img !== "string") return "";
    return img.startsWith("http")
      ? img
      : `${API_BASE_URL.replace("/api", "")}${img}`;
  };

  const orderData = (voucher as any)?.order_data || {};

  // Helper: read from direct order field first, then fall back to order_data JSON
  const val = (directKey: string, dataKey?: string) => {
    const v = (voucher as any)?.[directKey];
    if (v !== null && v !== undefined && v !== "") return v;
    return orderData?.[dataKey ?? directKey] ?? null;
  };

  const refImage = getImageUrl(
    orderData?.reference_image ||
      (voucher as any)?.reference_image ||
      voucher?.upload_file
  );
  const remarks =
    orderData?.remarks ||
    (voucher as any)?.remarks ||
    (voucher as any)?.source_draft?.advance_notes;

  const itemName =
    typeof voucher?.item_name === "object"
      ? (voucher.item_name as any)?.name
      : voucher?.item_name || orderData?.item_name;

  const accountName =
    typeof voucher?.account === "object"
      ? (voucher.account as any)?.name || (voucher.account as any)?.account_name
      : voucher?.account || orderData?.account_name;

  if (loading) {
    return (
      <div className="container mx-auto p-6 text-center py-12">
        <p className="text-muted-foreground">Loading order details...</p>
      </div>
    );
  }

  if (error || (!history && !voucher)) {
    return (
      <div className="container mx-auto p-6">
        <PreviousBackButton />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error || "Order not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PreviousBackButton />
        <Button
          onClick={() => router.push(`/vouchers/orders/${orderId}/tracking`)}
        >
          <Clock className="mr-2 h-4 w-4" />
          Track Production
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="text-2xl">
                Order: {voucher?.bill_no || history?.bill_no}
              </CardTitle>
              <CardDescription className="mt-1">
                {(voucher as any)?.job_no && (
                  <span className="mr-3">Job: {(voucher as any).job_no}</span>
                )}
                {voucher?.date && (
                  <span>
                    Date: {new Date(voucher.date).toLocaleDateString()}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">
                {history?.current_status || voucher?.status || "Active"}
              </Badge>
              {history?.advance_payment === "YES" && (
                <Badge className="bg-green-600 text-white">Advance Paid</Badge>
              )}
              {salesQuery && (
                <Badge className="bg-blue-600 text-white">
                  From Sales Query
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="text-sm font-semibold">
                  {accountName || history?.customer_name || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Item</p>
                <p className="text-sm font-semibold">
                  {itemName || history?.item || "—"}
                </p>
              </div>
            </div>
            {history?.delivery_date && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Expected Delivery
                  </p>
                  <p className="text-sm font-semibold">
                    {new Date(history.delivery_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Days Since Order
                </p>
                <p className="text-sm font-semibold">
                  {history?.days_since_order ?? "—"} days
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      {voucher && (
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client Information */}
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                Client Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="Account Name" value={accountName} />
                <Field
                  label="Sub-Account"
                  value={val("subaccount") || orderData?.sub_account}
                />
                <Field label="Gender" value={val("gender")} />
                <Field label="Location" value={val("location")} />
                <Field
                  label="Delivery Type"
                  value={formatDeliveryType(
                    val("delivery_type") || val("client_delivery_type")
                  )}
                />
              </div>
            </section>

            {/* Product Specifications */}
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                Product Specifications
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="Jewellery Type" value={itemName} />
                <Field
                  label="Gold Karat"
                  value={
                    val("stamp", "gold_carat") || val("gold_carat", "stamp")
                  }
                />
                <Field label="Size" value={val("size")} />
                <Field label="Quantity" value={val("number_of_pieces")} />
                <Field label="Design" value={val("design")} />
                <Field label="Base Metal" value={val("base_metal")} />
                <Field label="Net Weight" value={val("net_wt")} />
                <Field label="Tag No" value={val("tag_no")} />
              </div>
            </section>

            {/* Remarks */}
            {remarks && (
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                  Remarks
                </h3>
                <p className="text-sm text-foreground whitespace-pre-line">
                  {remarks}
                </p>
              </section>
            )}

            {/* Reference Image */}
            {refImage && (
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                  Reference Image
                </h3>
                <div className="flex items-start gap-4">
                  <div className="rounded-lg overflow-hidden border shadow-sm bg-white max-w-xs">
                    <img
                      src={refImage}
                      alt="Reference"
                      className="w-full h-auto max-h-64 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <a
                    href={refImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 mt-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open Full Image
                  </a>
                </div>
              </section>
            )}

            {/* Advance / Receipt */}
            {(voucher as any).source_draft && (
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                  Advance Payment
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field
                    label="Advance Amount"
                    value={
                      (voucher as any).source_draft?.advance_amount
                        ? `₹${(voucher as any).source_draft.advance_amount}`
                        : undefined
                    }
                  />
                  <Field
                    label="Receipt Voucher No"
                    value={
                      (voucher as any).source_draft?.receipt_voucher?.voucher_no
                    }
                  />
                  <Field
                    label="Payment Date"
                    value={
                      (voucher as any).source_draft?.receipt_voucher?.date
                        ? new Date(
                            (voucher as any).source_draft.receipt_voucher.date
                          ).toLocaleDateString()
                        : undefined
                    }
                  />
                  <Field
                    label="Payment Mode"
                    value={
                      (voucher as any).source_draft?.receipt_voucher
                        ?.payment_mode
                    }
                  />
                  <Field
                    label="Notes"
                    value={(voucher as any).source_draft?.advance_notes}
                  />
                </div>
              </section>
            )}
          </CardContent>
        </Card>
      )}

      {/* Order Timeline */}
      {history && history.timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Order Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-6">
                {history.timeline.map((event, index) => (
                  <div key={index} className="relative pl-12">
                    <div className="absolute left-0 top-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      {event.event.includes("Payment") ? (
                        <DollarSign className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Package className="h-4 w-4 text-primary-foreground" />
                      )}
                    </div>
                    <Card className="border-l-4 border-l-primary">
                      <CardContent className="pt-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold">{event.event}</h3>
                            <p className="text-xs text-muted-foreground">
                              {new Date(event.date).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </p>
                          </div>
                          {event.amount && (
                            <Badge className="bg-green-600 text-white">
                              ₹{event.amount.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{event.description}</p>
                        {event.status && (
                          <Badge variant="outline" className="mt-2">
                            {event.status}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales Query Section — only if order was converted from one */}
      {salesQuery && (
        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50/50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-blue-900">
                  Converted from Sales Query
                </CardTitle>
                <CardDescription className="text-blue-700">
                  This order originated from a sales query
                </CardDescription>
              </div>
              <Button
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() =>
                  router.push(`/vouchers/sales-queries/${salesQuery.id}`)
                }
              >
                View Sales Query
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field
                label="Account"
                value={
                  salesQuery.account?.account_name || salesQuery.account?.name
                }
              />
              <Field
                label="Sub-Account"
                value={
                  salesQuery.sub_account_record?.sub_account_name ||
                  salesQuery.sub_account
                }
              />
              <Field
                label="Jewellery Type"
                value={
                  salesQuery.jewellery_type_master?.name ||
                  salesQuery.jewellery_type
                }
              />
              <Field label="Gold Quality" value={salesQuery.gold_quality} />
              <Field label="Size" value={salesQuery.size_details} />
              <Field
                label="Order Date"
                value={
                  salesQuery.order_date
                    ? new Date(salesQuery.order_date).toLocaleDateString()
                    : undefined
                }
              />
              <Field
                label="Required Delivery"
                value={
                  salesQuery.required_delivery_date
                    ? new Date(
                        salesQuery.required_delivery_date
                      ).toLocaleDateString()
                    : undefined
                }
              />
              <Field label="City" value={salesQuery.city} />
              <Field
                label="Delivery Type"
                value={salesQuery.client_delivery_type}
              />
            </div>
            {salesQuery.sample_details && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                  Sample Details
                </p>
                <p className="text-sm">{salesQuery.sample_details}</p>
              </div>
            )}
            {(salesQuery as any).reference_image && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">
                  Reference Image (from Query)
                </p>
                <div className="flex items-start gap-4">
                  <img
                    src={getImageUrl((salesQuery as any).reference_image)}
                    alt="Query Reference"
                    className="max-w-xs rounded-lg border shadow-sm max-h-48 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : Array.isArray(value)
        ? value.length === 0
          ? "—"
          : value.join(", ")
        : String(value);
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm font-semibold text-foreground">{display}</p>
    </div>
  );
}
