"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { journalDetail, journalDelete } from "@/lib/backend";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { amountInWords } from "@/lib/numberToWords";

interface JournalDetailProps {
  id: string;
}

export function JournalDetail({ id }: JournalDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [journal, setJournal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const loadJournal = useCallback(async () => {
    try {
      const data = await journalDetail(id);
      setJournal(data);
    } catch (error) {
      console.error("Failed to load journal:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load journal details",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    void loadJournal();
  }, [loadJournal]);

  const handleDelete = async () => {
    if (!journal) return;

    if (!confirm("Are you sure you want to delete this journal?")) return;

    setDeleting(true);
    try {
      await journalDelete(journal.id);
      toast({ title: "Journal Deleted" });
      router.push("/vouchers/journal/list");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to delete journal",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading)
    return (
      <div className="p-20 text-center text-muted-foreground">
        Loading journal details...
      </div>
    );
  if (!journal)
    return (
      <div className="p-20 text-center text-destructive">
        Journal not found.
      </div>
    );

  const voucherDisplayNo =
    journal.voucher_no ||
    journal.voucher_number ||
    journal.v_no ||
    journal.id ||
    "—";
  const debitAccountName = (() => {
    const val =
      journal.account_name ||
      journal.party_name ||
      journal.account ||
      journal.party ||
      journal.account_detail;
    if (!val) return "—";
    if (typeof val === "object") return val.account_name || val.name || "—";
    return val;
  })();

  let parsedDrNarration = journal.dr_narration || "";
  let parsedGeneralRemarks = journal.narration || journal.remarks || "";
  if (parsedGeneralRemarks.includes(" |GEN_REMARKS| ")) {
    const parts = parsedGeneralRemarks.split(" |GEN_REMARKS| ");
    parsedDrNarration = parts[0];
    parsedGeneralRemarks = parts.slice(1).join(" |GEN_REMARKS| ");
  } else if (!parsedDrNarration && parsedGeneralRemarks) {
    parsedDrNarration = parsedGeneralRemarks;
  }

  const dateFormatted = journal.date
    ? new Date(journal.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  const creditEntries =
    journal.credit_entries ||
    journal.entries ||
    journal.items ||
    journal.debit_entries ||
    [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Journal #{voucherDisplayNo}</h1>
          <p className="text-sm text-muted-foreground">{dateFormatted}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Link href={`/vouchers/journal/new?id=${journal.id}`}>
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
            className="text-destructive hover:bg-destructive/5"
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
                Journal Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 divide-x border-b">
                <div className="p-4 space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Date
                  </p>
                  <p className="text-sm font-medium">{journal.date || "—"}</p>
                </div>
                <div className="p-4 space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Voucher No
                  </p>
                  <p className="text-sm font-medium uppercase">
                    {voucherDisplayNo}
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Debit Side (Account)
                  </h3>
                  <div className="p-5 rounded-lg border bg-blue-50/20 border-blue-100 flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-blue-400 uppercase">
                        Account
                      </p>
                      <p className="text-lg font-bold text-blue-900">
                        {debitAccountName}
                      </p>
                      {parsedDrNarration && (
                        <div className="mt-2">
                          <p className="text-[10px] font-bold text-blue-400/80 uppercase">
                            Debit Narration
                          </p>
                          <p className="text-sm text-blue-800/70 italic mt-0.5">
                            {parsedDrNarration}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-blue-400 uppercase">
                        Amount
                      </p>
                      <p className="text-2xl font-black text-blue-700">
                        ₹
                        {(journal.dr || journal.total || 0).toLocaleString(
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
                      General Remarks
                    </p>
                    <div className="p-4 rounded-md border text-sm text-muted-foreground bg-muted/5">
                      {parsedGeneralRemarks}
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-emerald-50/30 rounded-lg border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">
                    Total Amount in Words
                  </p>
                  <p className="text-sm font-semibold text-blue-700">
                    {amountInWords(journal.dr || journal.total || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
              Credit Side (Parties)
            </h3>
            <div className="border rounded-lg overflow-hidden bg-white shadow-sm font-sans">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/30 border-b">
                  <tr>
                    <th className="px-4 py-3 font-semibold uppercase text-[10px] text-muted-foreground">
                      Particulars
                    </th>
                    <th className="px-4 py-3 text-right font-semibold uppercase text-[10px] text-muted-foreground">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
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
                      <tr key={ce.id || i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-4">
                          <p className="font-bold text-emerald-900 font-sans">
                            {partyLabel}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase">
                            {ce.narration || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-right font-black tabular-nums text-emerald-600 font-sans">
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
                <tfoot className="bg-emerald-50/10 font-bold border-t">
                  <tr>
                    <td className="px-4 py-3 text-right text-[10px] uppercase text-emerald-600">
                      Total Cr
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-700">
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
      </div>
    </div>
  );
}
