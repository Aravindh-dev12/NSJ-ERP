"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import {
  queryDetail,
  queryConvertToOrder,
  receiptList,
  type QueryResponse,
  type ReceiptResponse,
} from "@/lib/backend";

export function ConvertClient() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [query, setQuery] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [receipts, setReceipts] = useState<ReceiptResponse[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);

  // Receipt voucher form fields
  const [selectedReceiptId, setSelectedReceiptId] = useState("");
  const [receiptVoucherNo, setReceiptVoucherNo] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMode, setPaymentMode] = useState("");
  const [remarks, setRemarks] = useState("");

  const queryId = params.id as string;

  useEffect(() => {
    const loadQuery = async () => {
      setLoading(true);
      try {
        const data = await queryDetail(queryId);
        setQuery(data);

        // Check if query can be converted
        if (data.status !== "pending") {
          toast({
            variant: "destructive",
            title: "Cannot convert",
            description: "This query has already been processed.",
          });
          router.push(`/vouchers/pending-queries/${queryId}`);
        }
        if (data.is_expired) {
          toast({
            variant: "destructive",
            title: "Cannot convert",
            description:
              "This query has expired. Please archive or reactivate it first.",
          });
          router.push(`/vouchers/pending-queries/${queryId}`);
        }
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Failed to load query",
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setLoading(false);
      }
    };

    void loadQuery();
  }, [queryId, toast, router]);

  // Fetch receipt vouchers
  useEffect(() => {
    const loadReceipts = async () => {
      setLoadingReceipts(true);
      try {
        const data = await receiptList({ page_size: 100 });
        setReceipts((data.results || []) as ReceiptResponse[]);
      } catch (err) {
        console.error("Failed to load receipts:", err);
        toast({
          variant: "destructive",
          title: "Failed to load receipt vouchers",
          description:
            "Could not fetch receipt vouchers. You can still enter the receipt number manually.",
        });
      } finally {
        setLoadingReceipts(false);
      }
    };

    void loadReceipts();
  }, [toast]);

  // Update form fields when a receipt is selected from dropdown
  useEffect(() => {
    if (selectedReceiptId) {
      const selectedReceipt = receipts.find((r) => r.id === selectedReceiptId);
      if (selectedReceipt) {
        // Auto-fill form fields from selected receipt
        setAdvanceAmount(
          selectedReceipt.cr?.toString() || selectedReceipt.dr?.toString() || ""
        );
        setPaymentDate(
          selectedReceipt.date || new Date().toISOString().split("T")[0]
        );
        setRemarks(selectedReceipt.narration || "");
        // Use receipt ID as the voucher number
        setReceiptVoucherNo(selectedReceipt.id);
      }
    }
  }, [selectedReceiptId, receipts]);

  const handleProceedToOrderForm = () => {
    if (!query) return;

    const voucherId = selectedReceiptId || receiptVoucherNo.trim();

    // Navigate to order form with query data pre-filled via URL params
    const queryParams = new URLSearchParams({
      fromQuery: query.id,
      ...(voucherId ? { receiptVoucherId: voucherId } : {}),
      accountId: query.account?.id || "",
      accountName: query.account?.account_name || "",
      itemNameId: query.item_name?.id || "",
      itemName: query.item_name?.name || query.item_name_custom || "",
      goldCarat: query.gold_carat || "",
      size: query.size || "",
      gender: query.gender || "",
      deliveryType: query.delivery_type || "",
      location: query.location || "",
      subaccount: query.subaccount || "",
      ...(query.linked_estimate_id
        ? { linkedEstimateId: query.linked_estimate_id }
        : {}),
      ...(query.reference_image
        ? { referenceImageUrl: query.reference_image }
        : {}),
      ...(remarks.trim() ? { remarks: remarks.trim() } : {}),
      ...(advanceAmount.trim() ? { advanceAmount: advanceAmount.trim() } : {}),
      ...(paymentDate ? { paymentDate } : {}),
      ...(paymentMode ? { paymentMode } : {}),
    });

    router.push(`/vouchers/new?${queryParams.toString()}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!query) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Query not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/vouchers/pending-queries")}
        >
          Back to Pending Queries
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Convert to Order
          </h1>
          <p className="text-muted-foreground mt-2">
            Step 1: Link receipt voucher, then proceed to fill the order form
          </p>
        </div>
        <PreviousBackButton />
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>
            Review the order details before conversion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-sm">Account</Label>
              <p className="font-medium">
                {query.account?.account_name || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-sm">Item</Label>
              <p className="font-medium">
                {query.item_name?.name || query.item_name_custom || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-sm">
                Gold Carat
              </Label>
              <p className="font-medium">{query.gold_carat}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-sm">Size</Label>
              <p className="font-medium">{query.size}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-sm">Gender</Label>
              <p className="font-medium">{query.gender || "—"}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-sm">
                Delivery Type
              </Label>
              <p className="font-medium">{query.delivery_type || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Voucher Form */}
      <Card>
        <CardHeader>
          <CardTitle>Receipt Voucher Details</CardTitle>
          <CardDescription>
            Optionally link a receipt voucher to this query. You can skip this
            step and proceed directly to the order form.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="receiptSelect">Select Receipt Voucher</Label>
              <select
                id="receiptSelect"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={selectedReceiptId}
                onChange={(e) => setSelectedReceiptId(e.target.value)}
                disabled={loadingReceipts}
              >
                <option value="">
                  {loadingReceipts
                    ? "Loading receipts..."
                    : "Select a receipt voucher"}
                </option>
                {receipts.map((receipt) => (
                  <option key={receipt.id} value={receipt.id}>
                    {receipt.party_name?.account_name || "Unknown Party"} -
                    {receipt.type === "Cr" ? " Cr: " : " Dr: "}₹
                    {receipt.cr || receipt.dr || 0} -
                    {receipt.date
                      ? new Date(receipt.date).toLocaleDateString()
                      : "No date"}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Select from existing receipt vouchers or enter manually below
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiptVoucherNo">Receipt Voucher ID</Label>
              <Input
                id="receiptVoucherNo"
                placeholder="Auto-filled from selection"
                value={receiptVoucherNo}
                onChange={(e) => setReceiptVoucherNo(e.target.value)}
                disabled={!!selectedReceiptId}
              />
              <p className="text-xs text-muted-foreground">
                {selectedReceiptId
                  ? "Auto-filled from selected receipt"
                  : "Or enter receipt ID manually"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="advanceAmount">Advance Amount</Label>
              <Input
                id="advanceAmount"
                type="number"
                placeholder="Balance (placeholder)"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Balance amount - to be implemented
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMode">Payment Mode</Label>
              <select
                id="paymentMode"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <option value="">Select payment mode</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Input
              id="remarks"
              placeholder="Any additional notes..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/vouchers/pending-queries/${query.id}`)
              }
            >
              Cancel
            </Button>
            <Button onClick={handleProceedToOrderForm}>
              Proceed to Order Form
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
