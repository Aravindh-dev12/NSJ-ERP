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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  getSalesQuery,
  getReceiptsDropdown,
  initiateSalesQueryOrderConversion,
  SalesQuery,
} from "@/lib/backend";
import { validateWorkflow } from "@/lib/goldRateApi";

interface OrderConversionFormProps {
  salesQueryId?: string;
  onClose?: () => void;
  onSuccess?: (draftId: string) => void;
}

export function OrderConversionForm({
  salesQueryId: propSalesQueryId,
  onClose,
  onSuccess,
}: OrderConversionFormProps = {}) {
  const params = useParams();
  const salesQueryId = propSalesQueryId || (params.id as string);
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [queryData, setQueryData] = useState<SalesQuery | null>(null);
  const [receipts, setReceipts] = useState<{ id: string; name: string }[]>([]);

  // Form state
  const [receiptVoucherId, setReceiptVoucherId] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState<number | "">("");
  const [advanceNotes, setAdvanceNotes] = useState("");

  // Order Data state
  const [itemName, setItemName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [query, receiptsList] = await Promise.all([
          getSalesQuery(salesQueryId as string),
          getReceiptsDropdown(),
        ]);

        setQueryData(query);
        setReceipts(receiptsList);

        // Pre-fill from query
        setItemName(query.jewellery_type || "");

        // Check if order already exists
        if (query.workflow_status === "converted_to_order") {
          toast({
            title: "Order Already Created",
            description:
              "An order has already been created for this sales lead. Redirecting to view the order.",
          });

          // Redirect to view the existing order
          setTimeout(() => {
            router.push(
              `/vouchers/orders/${query.order_id || query.id}/tracking`
            );
          }, 2000);
        }
      } catch (error) {
        console.error("Failed to fetch conversion data", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load sales lead details.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (salesQueryId) {
      fetchData();
    }
  }, [salesQueryId, toast, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if order already exists
    if (queryData?.workflow_status === "converted_to_order") {
      toast({
        title: "Order Already Created",
        description: "An order has already been created for this sales lead.",
      });
      return;
    }

    if (!itemName || !queryData?.account?.id) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: !itemName
          ? "Item name is required."
          : "Customer account is missing.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        receipt_voucher_id: receiptVoucherId || undefined,
        advance_amount: advanceAmount === "" ? 0 : Number(advanceAmount),
        advance_notes: advanceNotes || undefined,
        order_data: {
          item_name: itemName,
          account: queryData.account.id,
          account_name:
            queryData.account.account_name || queryData.account.name,
          // Product specs from sales query
          stamp: queryData.gold_quality || "",
          size: queryData.size_details || "",
          gender: (queryData as any).gender || "",
          location: queryData.city || (queryData as any).location || "",
          delivery_type: queryData.client_delivery_type || "",
          sub_account:
            queryData.sub_account_record?.sub_account_name ||
            queryData.sub_account ||
            "",
          // Notes
          remarks: advanceNotes || "",
        },
      };

      console.log(
        "[DEBUG] Order Conversion Payload:",
        JSON.stringify(payload, null, 2)
      );

      const result = await initiateSalesQueryOrderConversion(
        salesQueryId as string,
        payload as any
      );

      // Check if gold rate is updated
      let warningMessage = "";
      try {
        const validation = await validateWorkflow({
          workflow_type: "order_creation",
          allow_draft: false,
        });
        if (!validation.can_proceed) {
          warningMessage =
            " Order saved as draft. Cannot submit until gold rate is updated.";
        }
      } catch (e) {
        console.error("Failed to check workflow validation", e);
      }

      toast({
        title: "Conversion Initialized",
        description: "Order draft created successfully." + warningMessage,
        variant: warningMessage ? "destructive" : "default",
      });

      // Navigate to process confirmation
      if (onSuccess) {
        onSuccess(result.draft_id);
      } else {
        router.push(`/order-drafts/${result.draft_id}/process-confirmation/`);
      }
    } catch (error: any) {
      console.error("Conversion failed", error);

      // Handle specific error cases
      let errorMessage = "An unknown error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Check for duplicate conversion errors
      if (
        errorMessage.includes("already exists") ||
        errorMessage.includes("already created")
      ) {
        toast({
          variant: "destructive",
          title: "Order Already Exists",
          description:
            "An order has already been created for this sales lead. Redirecting to view the existing order.",
        });

        // Redirect to view the existing order
        setTimeout(() => {
          router.push(`/vouchers/orders/${salesQueryId}/tracking`);
        }, 2000);
      } else {
        toast({
          variant: "destructive",
          title: "Conversion Failed",
          description: errorMessage,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Convert to Order</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Advance Payment Details</CardTitle>
            <CardDescription>
              Optional: Link a receipt voucher and specify advance payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="receiptVoucher">Receipt Voucher</Label>
              <select
                id="receiptVoucher"
                value={receiptVoucherId}
                onChange={(e) => setReceiptVoucherId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Select a voucher (Optional)</option>
                {receipts.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="advanceAmount">Advance Amount</Label>
              <Input
                id="advanceAmount"
                type="number"
                placeholder="0.00"
                value={advanceAmount}
                onChange={(e) =>
                  setAdvanceAmount(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="advanceNotes">Advance Notes</Label>
              <Textarea
                id="advanceNotes"
                placeholder="Notes regarding the advance payment..."
                value={advanceNotes}
                onChange={(e) => setAdvanceNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Specifications</CardTitle>
            <CardDescription>
              Basic details about the jewelry item.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="itemName">Item Name *</Label>
              <Input
                id="itemName"
                placeholder="e.g. Diamond Ring"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating Draft..." : "Create Order Draft"}
          </Button>
        </div>
      </form>
    </div>
  );
}
