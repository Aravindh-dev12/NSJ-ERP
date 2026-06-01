"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { paymentsList, paymentDelete, paymentDetail } from "@/lib/backend";
import { getLocalFirstOfMonth, getLocalToday } from "@/lib/date";
import { generateVoucherPDF } from "@/lib/voucherPDF";
import { SalesHeader } from "@/components/vouchers/SalesHeader";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Printer, Calendar } from "lucide-react";

export default function PaymentsListPage() {
  const { toast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const getDefaultDateFrom = () => {
    return getLocalFirstOfMonth();
  };

  const getDefaultDateTo = () => {
    return getLocalToday();
  };

  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom());
  const [dateTo, setDateTo] = useState(getDefaultDateTo());

  const PAGE_SIZE = 10;

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await paymentsList({
          page,
          page_size: PAGE_SIZE,
          date_from: dateFrom,
          date_to: dateTo,
        });
        if (!mounted) return;
        setRecords(resp.results ?? resp.items ?? []);
      } catch (err) {
        setRecords([]);
        setError("Failed to load payments. Please try again.");
        toast({ variant: "destructive", title: "Unable to load payments" });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void fetch();
    return () => {
      mounted = false;
    };
  }, [page, search, dateFrom, dateTo, toast]);

  const handlePrint = async (id: string) => {
    setPrintingId(id);
    try {
      const data = await paymentDetail(id);

      // Helper function to format balance without duplicate "Rs."
      const formatBalance = (bal: any): string => {
        if (bal === null || bal === undefined) return "-";
        if (bal === "" || bal === 0) return "-";

        // Convert to string
        let balanceStr = String(bal);

        // Remove all "Rs." and extra whitespace
        balanceStr = balanceStr
          .replace(/Rs\./gi, "")
          .replace(/Rs/gi, "")
          .trim();

        // Extract only numeric value and decimal point
        const numericMatch = balanceStr.match(/[\d,]+\.?\d*/);
        if (numericMatch && numericMatch[0]) {
          const numValue = numericMatch[0].replace(/,/g, "");
          return `Rs. ${numValue}`;
        }
        return "-";
      };

      const entries: any[] = [];

      // Extract narration and general remarks
      let drNarration = "";
      let generalRemarks = "";
      if (data.narration) {
        if (data.narration.includes(" |GEN_REMARKS| ")) {
          const parts = data.narration.split(" |GEN_REMARKS| ");
          drNarration = parts[0].trim();
          generalRemarks = parts.slice(1).join(" |GEN_REMARKS| ").trim();
        } else {
          drNarration = data.narration;
        }
      }

      // Add debit entry (main party - who receives the payment)
      if (data.party_name || data.party_name_id) {
        let partyName = "";
        if (typeof data.party_name === "object" && data.party_name !== null) {
          partyName =
            data.party_name.name || data.party_name.account_name || "";
        } else if (typeof data.party_name === "string") {
          partyName = data.party_name;
        }

        entries.push({
          type: "DR",
          partyName: partyName || "-",
          subAc: data.sub_ac || data.sub_account || "-",
          balance: formatBalance(data.balance_display || data.balance),
          drAmount: parseFloat(data.dr || 0),
          crAmount: 0,
          narration: drNarration || "-",
        });
      }

      // Add debit entries (additional debit parties)
      if (data.debit_entries && Array.isArray(data.debit_entries)) {
        data.debit_entries.forEach((entry: any) => {
          let partyName = "";
          if (
            typeof entry.party_name === "object" &&
            entry.party_name !== null
          ) {
            partyName =
              entry.party_name.name || entry.party_name.account_name || "";
          } else if (typeof entry.party_name === "string") {
            partyName = entry.party_name;
          }

          entries.push({
            type: "DR",
            partyName: partyName || "-",
            subAc: entry.sub_ac || entry.sub_account || "-",
            balance: formatBalance(entry.balance_display || entry.balance),
            drAmount: parseFloat(entry.dr || 0),
            crAmount: 0,
            narration: entry.narration || "-",
          });
        });
      }

      // Add credit entries (payment sources - who pays)
      if (data.credit_entries && Array.isArray(data.credit_entries)) {
        data.credit_entries.forEach((entry: any) => {
          let partyName = "-";
          // Check for 'party' object first (like Receipt implementation)
          if (entry.party && typeof entry.party === "object") {
            partyName = entry.party.account_name || entry.party.name || "-";
          }
          // Fallback to 'party_name' field
          else if (
            typeof entry.party_name === "object" &&
            entry.party_name !== null
          ) {
            partyName =
              entry.party_name.name || entry.party_name.account_name || "-";
          } else if (typeof entry.party_name === "string") {
            partyName = entry.party_name;
          }

          entries.push({
            type: "CR",
            partyName: partyName,
            subAc: entry.sub_ac || entry.sub_account || "-",
            balance: formatBalance(entry.balance_display || entry.balance),
            drAmount: 0,
            crAmount: parseFloat(entry.cr || 0),
            narration: entry.narration || "-",
          });
        });
      }

      const totalDebit =
        (parseFloat(String(data.dr || 0)) || 0) +
        (data.debit_entries?.reduce(
          (sum: number, d: any) => sum + parseFloat(String(d.dr || 0)),
          0
        ) || 0);

      const totalCredit =
        data.credit_entries?.reduce(
          (sum: number, d: any) => sum + parseFloat(String(d.cr || 0)),
          0
        ) || 0;

      generateVoucherPDF("Payment", {
        voucherType: "Payment",
        date: data.date || "-",
        voucherNo: data.voucher_no || "-",
        series: data.series || "PAYMENT M",
        entries,
        generalRemarks,
        totalDebit: parseFloat(String(totalDebit)) || 0,
        totalCredit: parseFloat(String(totalCredit)) || 0,
      });

      toast({ title: "PDF downloaded successfully" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to generate PDF",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setPrintingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment?")) return;
    setDeletingId(id);
    try {
      await paymentDelete(id);
      toast({ title: "Payment deleted" });
      setRecords((r) => r.filter((x) => x.id !== id));
    } catch (err) {
      toast({ variant: "destructive", title: "Delete failed" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <PreviousBackButton />
      <SalesHeader
        title="Payments"
        description="Manage payment entries."
        links={[
          { label: "Overview", href: "/vouchers/payment" },
          { label: "List", href: "/vouchers/payment/list" },
          { label: "Add New", href: "/vouchers/payment/new" },
        ]}
      />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Payments list</CardTitle>
              <CardDescription>
                Search and manage payment entries.
              </CardDescription>
            </div>
            <div>
              <Link
                href="/vouchers/payment/new"
                className="text-sm text-primary"
              >
                Create payment
              </Link>
            </div>
          </div>

          <div className="flex items-center bg-white border rounded-lg h-10 px-3 text-sm w-fit">
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
        </CardHeader>
        <CardContent>
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
              No payments found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Voucher No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Debit Party
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      DR
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      CR Total
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {records.map((rec) => {
                    const drAmount = rec.dr || rec.total || 0;

                    const entries =
                      rec.credit_entries || rec.entries || rec.items || [];
                    const crTotal = entries.reduce(
                      (acc: number, curr: any) =>
                        acc + parseFloat(String(curr.cr || 0)),
                      0
                    );

                    return (
                      <tr key={rec.id} className="hover:bg-muted/40">
                        <td className="px-4 py-4 text-sm text-muted-foreground tabular-nums">
                          {rec.date ?? "—"}
                        </td>
                        <td className="px-4 py-4 font-bold text-rose-900 border-r border-rose-50/50 uppercase tabular-nums">
                          {rec.voucher_no ||
                            rec.voucher_number ||
                            rec.v_no ||
                            "—"}
                        </td>
                        <td className="px-4 py-4 border-r border-rose-50/50">
                          <div className="font-bold text-gray-800">
                            {(() => {
                              const val =
                                rec.account_name ||
                                rec.party_name ||
                                rec.account ||
                                rec.party ||
                                rec.account_detail;
                              if (!val) return "—";
                              if (typeof val === "object")
                                return val.account_name || val.name || "—";
                              return val;
                            })()}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-black text-right tabular-nums text-blue-700">
                          ₹
                          {parseFloat(String(drAmount)).toLocaleString(
                            "en-IN",
                            { minimumFractionDigits: 2 }
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-right tabular-nums text-emerald-700">
                          ₹
                          {crTotal.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="flex items-center justify-end gap-2 px-4 py-4 text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handlePrint(rec.id)}
                            disabled={printingId === rec.id}
                            title="Print/PDF"
                          >
                            {printingId === rec.id ? (
                              <span className="animate-spin">⏳</span>
                            ) : (
                              <Printer className="h-4 w-4" />
                            )}
                          </Button>
                          <Link href={`/vouchers/payment/detail/${rec.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mr-2 h-8"
                            >
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(rec.id)}
                            disabled={deletingId === rec.id}
                          >
                            {deletingId === rec.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
