"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { receiptDetail, receiptDelete } from "@/lib/backend";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { amountInWords } from "@/lib/numberToWords";

interface ReceiptDetailProps {
  id: string;
}

export function ReceiptDetail({ id }: ReceiptDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const loadReceipt = useCallback(async () => {
    try {
      const data = await receiptDetail(id);
      setReceipt(data);
    } catch (error) {
      console.error("Failed to load receipt:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load receipt details",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    void loadReceipt();
  }, [loadReceipt]);

  const handleDelete = async () => {
    if (!receipt) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this receipt record?"
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      await receiptDelete(receipt.id);
      toast({
        title: "Receipt Deleted",
        description: "Receipt record has been deleted successfully.",
      });
      router.push("/vouchers/receipt/list");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to delete receipt",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h1 className="text-2xl font-bold">Receipt Detail</h1>
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

  if (!receipt) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h1 className="text-2xl font-bold text-destructive">
            Receipt Not Found
          </h1>
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <Card className="border-destructive/20 bg-destructive/5 capitalize">
          <CardContent className="p-8 text-center text-destructive">
            Could not find a receipt with ID #{id}
          </CardContent>
        </Card>
      </div>
    );
  }

  const creditPartyName =
    (receipt.party_name || {}).name ||
    receipt.party_name ||
    receipt.party_name_id ||
    "—";
  const dateFormatted = receipt.date
    ? new Date(receipt.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  let parsedCrNarration = receipt.cr_narration || "";
  let parsedGeneralRemarks = receipt.narration || "";
  if (parsedGeneralRemarks.includes(" |GEN_REMARKS| ")) {
    const parts = parsedGeneralRemarks.split(" |GEN_REMARKS| ");
    parsedCrNarration = parts[0];
    parsedGeneralRemarks = parts.slice(1).join(" |GEN_REMARKS| ");
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
      {/* Minimal Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">
            Receipt #{receipt.voucher_no || receipt.id}
          </h1>
          <p className="text-sm text-muted-foreground">{dateFormatted}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Link href={`/vouchers/receipt/${receipt.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
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
                  <p className="text-sm font-medium">{receipt.date || "—"}</p>
                </div>
                <div className="p-4 space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Voucher No
                  </p>
                  <p className="text-sm font-medium uppercase">
                    {receipt.voucher_no || "—"}
                  </p>
                </div>
                <div className="p-4 space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Series
                  </p>
                  <p className="text-sm font-medium">
                    {receipt.series || "RECEIPT M"}
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Credit Information
                  </h3>

                  <div className="p-5 rounded-lg border bg-muted/10 flex justify-between items-center group">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">
                        Party Name
                      </p>
                      <p className="text-lg font-bold">{creditPartyName}</p>
                      {receipt.sub_ac && (
                        <p className="text-xs text-muted-foreground">
                          Sub AC: {receipt.sub_ac}
                        </p>
                      )}
                      {parsedCrNarration && (
                        <div className="mt-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">
                            Credit Narration
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {parsedCrNarration}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">
                        Amount
                      </p>
                      <p className="text-2xl font-bold">
                        ₹
                        {(receipt.cr || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        Cr
                      </p>
                    </div>
                  </div>
                </div>

                {parsedGeneralRemarks && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      General Remarks
                    </p>
                    <div className="p-4 rounded-md border text-sm text-muted-foreground bg-muted/5">
                      {parsedGeneralRemarks}
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-green-50/30 rounded-lg border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">
                    Total Amount in Words
                  </p>
                  <p className="text-sm font-semibold text-blue-700">
                    {amountInWords(receipt.cr || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
              Debit Entries
            </h3>
            <div className="border rounded-lg overflow-hidden bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/30 border-b">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">
                      Particulars
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">
                      Narration
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(receipt.debit_entries || []).map((de: any, i: number) => {
                    const drParty =
                      (de.party || {}).name ||
                      de.party ||
                      de.party_name_id ||
                      de.party_id ||
                      "—";
                    return (
                      <tr key={de.id || i}>
                        <td className="px-4 py-4">
                          <p className="font-bold">{drParty}</p>
                          {(de.sub_account || de.sub_ac) && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-tighter">
                              Sub: {de.sub_account || de.sub_ac}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground text-xs">
                          {de.narration || "—"}
                        </td>
                        <td className="px-4 py-4 text-right font-bold tabular-nums">
                          ₹
                          {parseFloat(String(de.dr || 0)).toLocaleString(
                            "en-IN",
                            { minimumFractionDigits: 2 }
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-muted/10 font-bold border-t">
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-3 text-right text-[10px] uppercase text-muted-foreground"
                    >
                      Total Debit
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      ₹
                      {(
                        receipt.debit_entries?.reduce(
                          (s: number, d: any) =>
                            s + parseFloat(String(d.dr || 0)),
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
          <Card className="rounded-lg shadow-sm border">
            <CardHeader className="border-b bg-muted/20 py-3">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground">
                Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">
                  Record ID
                </p>
                <p className="text-xs font-mono text-muted-foreground">
                  #{receipt.id}
                </p>
              </div>
              {receipt.created_at && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    Created At
                  </p>
                  <p className="text-xs">
                    {new Date(receipt.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
              )}
              {receipt.updated_at && (
                <div className="space-y-1 pt-2 border-t border-dashed">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    Modified At
                  </p>
                  <p className="text-xs">
                    {new Date(receipt.updated_at).toLocaleString("en-IN")}
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
