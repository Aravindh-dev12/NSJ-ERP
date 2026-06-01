"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { paymentDetail, paymentDelete } from "@/lib/backend";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { amountInWords } from "@/lib/numberToWords";

interface PaymentDetailProps {
  id: string;
}

export function PaymentDetail({ id }: PaymentDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const loadPayment = useCallback(async () => {
    try {
      const data = await paymentDetail(id);
      setPayment(data);
    } catch (error) {
      console.error("Failed to load payment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load payment details",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    void loadPayment();
  }, [loadPayment]);

  const handleDelete = async () => {
    if (!payment) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this payment record?"
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      await paymentDelete(payment.id);
      toast({
        title: "Payment Deleted",
        description: "Payment record has been deleted successfully.",
      });
      router.push("/vouchers/payment/list");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to delete payment",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h1 className="text-2xl font-bold">Payment Detail</h1>
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="py-20 text-center text-muted-foreground">
          Loading details...
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h1 className="text-2xl font-bold text-destructive">
            Payment Not Found
          </h1>
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <Card className="border-destructive/20 bg-destructive/5 capitalize">
          <CardContent className="p-8 text-center text-destructive">
            Could not find a payment with ID #{id}
          </CardContent>
        </Card>
      </div>
    );
  }

  const voucherDisplayNo =
    payment.voucher_no ||
    payment.voucher_number ||
    payment.v_no ||
    payment.id ||
    "—";
  const debitAccountName = (() => {
    const val =
      payment.account_name ||
      payment.party_name ||
      payment.account ||
      payment.party ||
      payment.account_detail;
    if (!val) return "—";
    if (typeof val === "object") return val.account_name || val.name || "—";
    return val;
  })();

  const dateFormatted = payment.date
    ? new Date(payment.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  let parsedDrNarration = payment.dr_narration || "";
  let parsedGeneralRemarks = payment.narration || payment.remarks || "";

  if (parsedGeneralRemarks.includes(" |GEN_REMARKS| ")) {
    const parts = parsedGeneralRemarks.split(" |GEN_REMARKS| ");
    parsedDrNarration = parts[0];
    parsedGeneralRemarks = parts.slice(1).join(" |GEN_REMARKS| ");
  } else if (!parsedDrNarration && parsedGeneralRemarks) {
    // If no explicit dr_narration, the main narration might be for the DR party
    parsedDrNarration = parsedGeneralRemarks;
  }

  const creditEntries =
    payment.credit_entries ||
    payment.entries ||
    payment.items ||
    payment.debit_entries ||
    [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Payment #{voucherDisplayNo}</h1>
          <p className="text-sm text-muted-foreground">{dateFormatted}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-destructive hover:text-destructive hover:bg-destructive/5"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-lg shadow-sm border">
            <CardHeader className="border-b bg-muted/20 py-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                Transaction Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x border-b">
                <div className="p-4 space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Date
                  </p>
                  <p className="text-sm font-medium">{payment.date || "—"}</p>
                </div>
                <div className="p-4 space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Voucher No
                  </p>
                  <p className="text-sm font-medium uppercase">
                    {voucherDisplayNo}
                  </p>
                </div>
                <div className="p-4 space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Series
                  </p>
                  <p className="text-sm font-medium">
                    {payment.series || "PAYMENT M"}
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Debit Information (Receiver)
                  </h3>

                  <div className="p-5 rounded-lg border bg-blue-50/20 border-blue-100 flex justify-between items-center group">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tight">
                        Account Name
                      </p>
                      <p className="text-lg font-bold text-blue-900">
                        {debitAccountName}
                      </p>
                      {parsedDrNarration && (
                        <div className="mt-3">
                          <p className="text-[10px] font-bold text-blue-400/80 uppercase tracking-tighter">
                            Debit Narration
                          </p>
                          <p className="text-sm text-blue-800/70 italic mt-0.5 leading-relaxed">
                            {parsedDrNarration}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tight">
                        Total Amount
                      </p>
                      <p className="text-2xl font-black text-blue-700">
                        ₹
                        {(payment.dr || payment.total || 0).toLocaleString(
                          "en-IN",
                          { minimumFractionDigits: 2 }
                        )}{" "}
                        Dr
                      </p>
                    </div>
                  </div>
                </div>

                {parsedGeneralRemarks && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      Remarks
                    </p>
                    <div className="p-4 rounded-md border text-sm text-muted-foreground bg-muted/5">
                      {parsedGeneralRemarks}
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-blue-50/30 rounded-lg border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">
                    Total Amount in Words
                  </p>
                  <p className="text-sm font-semibold text-blue-700">
                    {amountInWords(payment.dr || payment.total || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
              Credit Entries (Source)
            </h3>
            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/30 border-b">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-muted-foreground uppercase text-[10px]">
                      Particulars
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground uppercase text-[10px]">
                      Narration
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground uppercase text-[10px]">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans text-sm">
                  {creditEntries.map((ce: any, i: number) => {
                    const amount = ce.cr || ce.amount || 0;
                    const pVal =
                      ce.party_name ||
                      ce.party_detail ||
                      ce.party ||
                      ce.account ||
                      "—";
                    const partyLabel =
                      typeof pVal === "object"
                        ? pVal.account_name || pVal.name || "—"
                        : pVal;

                    return (
                      <tr key={ce.id || i} className="hover:bg-rose-50/20">
                        <td className="px-4 py-4">
                          <p className="font-bold text-rose-900">
                            {partyLabel}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase">
                            {ce.narration || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground text-xs">
                          {ce.narration || "—"}
                        </td>
                        <td className="px-4 py-4 text-right font-black tabular-nums text-rose-600">
                          ₹
                          {parseFloat(String(amount)).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          Cr
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-rose-50/10 font-bold border-t">
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-3 text-right text-[10px] uppercase text-rose-600"
                    >
                      Total Credit
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-rose-700">
                      ₹
                      {(
                        creditEntries.reduce(
                          (s: number, d: any) =>
                            s + parseFloat(String(d.cr || d.amount || 0)),
                          0
                        ) || 0
                      ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="rounded-lg shadow-sm border overflow-hidden">
            <CardHeader className="border-b bg-muted/20 py-3">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground">
                Record Info
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">
                  Internal ID
                </p>
                <p className="text-xs font-mono text-muted-foreground break-all bg-muted/30 p-1 rounded">
                  #{payment.id}
                </p>
              </div>
              {payment.created_at && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    Created At
                  </p>
                  <p className="text-xs font-medium">
                    {new Date(payment.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
              )}
              {payment.updated_at && (
                <div className="space-y-1 pt-2 border-t border-dashed">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase text-emerald-600">
                    Modified At
                  </p>
                  <p className="text-xs font-medium">
                    {new Date(payment.updated_at).toLocaleString("en-IN")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
