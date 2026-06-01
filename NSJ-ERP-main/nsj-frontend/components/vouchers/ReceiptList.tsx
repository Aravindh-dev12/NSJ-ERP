"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  receiptList,
  receiptDelete,
  receiptDetail,
  type QueryValue,
} from "@/lib/backend";
import { generateVoucherPDF } from "@/lib/voucherPDF";
import { getLocalFirstOfMonth, getLocalToday } from "@/lib/date";
import {
  Trash2,
  Eye,
  Search,
  X,
  Calendar,
  Filter,
  RefreshCw,
  Printer,
} from "lucide-react";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 10;

function buildQuery(
  page: number,
  search: string,
  dateFrom?: string,
  dateTo?: string
) {
  const params: Record<string, QueryValue> = { page, page_size: PAGE_SIZE };
  if (search.trim()) params.search = search.trim();
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;
  return params;
}

export function ReceiptList() {
  const router = useRouter();
  const { toast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [meta, setMeta] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
  });
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
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");

  const totalPages = useMemo(() => {
    if (meta.count === 0) return 1;
    return Math.max(1, Math.ceil(meta.count / PAGE_SIZE));
  }, [meta.count]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildQuery(page, search, appliedDateFrom, appliedDateTo);
      const response = await receiptList(params);
      setRecords(response.results ?? response.items ?? []);
      setMeta({
        count:
          (response.count as number) ??
          (response.total as number) ??
          response.results?.length ??
          0,
        next: (response.next as string) ?? null,
        previous: (response.previous as string) ?? null,
      });
    } catch (err) {
      setRecords([]);
      setMeta({ count: 0, next: null, previous: null });
      setError("Failed to load receipts. Please try again.");
      toast({
        variant: "destructive",
        title: "Unable to load receipts",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, appliedDateFrom, appliedDateTo, toast]);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSearch(searchInput.trim());
      setPage(1);
    },
    [searchInput]
  );

  const handleApplyFilter = () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      toast({
        variant: "destructive",
        title: "Invalid Date Range",
        description: "From date cannot be after To date",
      });
      return;
    }
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setPage(1);
  };

  const handleClearFilter = () => {
    setDateFrom(getDefaultDateFrom());
    setDateTo(getDefaultDateTo());
    setAppliedDateFrom("");
    setAppliedDateTo("");
    setPage(1);
  };

  const handleDelete = useCallback(
    async (id: string) => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this receipt entry?"
      );
      if (!confirmed) return;
      setDeletingId(id);
      try {
        await receiptDelete(id);
        toast({
          title: "Receipt removed",
          description: "The receipt entry has been deleted.",
        });
        await fetchRecords();
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Delete failed",
          description: err instanceof Error ? err.message : "Could not delete.",
        });
      } finally {
        setDeletingId(null);
      }
    },
    [fetchRecords, toast]
  );

  const handlePrint = async (id: string) => {
    setPrintingId(id);
    try {
      const data = await receiptDetail(id);

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

      // Add debit entries
      if (data.debit_entries && Array.isArray(data.debit_entries)) {
        data.debit_entries.forEach((entry: any) => {
          // Extract party name from 'party' object (not 'party_name')
          let partyName = "-";
          if (entry.party && typeof entry.party === "object") {
            partyName = entry.party.account_name || entry.party.name || "-";
          }

          entries.push({
            type: "DR",
            partyName: partyName,
            subAc: "-", // No sub_ac in API response
            balance: formatBalance(entry.balance),
            drAmount: parseFloat(entry.dr || 0),
            crAmount: 0,
            narration: entry.narration || "-",
          });
        });
      }

      // Add credit entry (main party)
      if (data.party_name) {
        // Extract party name from 'party_name' object
        let partyName = "-";
        if (typeof data.party_name === "object" && data.party_name !== null) {
          partyName =
            data.party_name.account_name || data.party_name.name || "-";
        } else if (typeof data.party_name === "string") {
          partyName = data.party_name;
        }

        entries.push({
          type: "CR",
          partyName: partyName,
          subAc: "-", // No sub_ac in API response
          balance: formatBalance(data.balance),
          drAmount: 0,
          crAmount: parseFloat(data.cr || 0),
          narration: data.narration || "-",
        });
      }

      // Extract general remarks from narration
      let generalRemarks = "";
      if (data.narration) {
        if (data.narration.includes(" |GEN_REMARKS| ")) {
          const parts = data.narration.split(" |GEN_REMARKS| ");
          generalRemarks = parts.slice(1).join(" |GEN_REMARKS| ").trim();
        } else {
          generalRemarks = data.narration;
        }
      }

      const totalDebit =
        data.debit_entries?.reduce(
          (sum: number, d: any) => sum + parseFloat(String(d.dr || 0)),
          0
        ) || parseFloat(String(data.dr || 0));

      generateVoucherPDF("Receipt", {
        voucherType: "Receipt",
        date: data.date || "-",
        voucherNo: data.voucher_no || "-",
        series: data.series || "RECEIPT M",
        entries,
        generalRemarks,
        totalDebit: parseFloat(String(totalDebit)) || 0,
        totalCredit: parseFloat(String(data.cr || 0)) || 0,
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

  const formatted = useMemo(() => {
    return records.map((r) => ({
      ...r,
      dateFormatted: r.date
        ? new Intl.DateTimeFormat(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          }).format(new Date(r.date))
        : "—",
    }));
  }, [records]);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Receipt list</h2>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          {/* Search Input Container */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 min-w-[300px] flex items-center bg-white border rounded-lg overflow-hidden h-10 px-3 hover:border-muted-foreground/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all"
          >
            <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
            <input
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground w-full h-full"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by party, narration"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Date Range Container */}
          <div className="flex items-center bg-white border rounded-lg h-10 px-3 text-sm flex-shrink-0">
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

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              type="button"
              onClick={handleApplyFilter}
              className="bg-slate-900 hover:bg-slate-800 text-white h-10 px-5 font-semibold rounded-lg shadow-sm font-sans"
            >
              <Filter className="w-4 h-4 mr-2" strokeWidth={2.5} />
              Apply Filter
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClearFilter}
              className="h-10 px-5 font-semibold rounded-lg bg-white border-muted shadow-sm hover:bg-muted/50 font-sans"
            >
              <RefreshCw
                className="w-4 h-4 mr-2 text-muted-foreground"
                strokeWidth={2.5}
              />
              Clear
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-6 py-4 text-sm text-destructive">
            {error}
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 px-6 py-14 text-center text-sm text-muted-foreground">
            No receipt entries found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-4 text-left">Date</th>
                  <th className="px-4 py-4 text-left">Voucher No</th>
                  <th className="px-4 py-4 text-left">Series</th>
                  <th className="px-4 py-4 text-left">Credit Party</th>
                  <th className="px-4 py-4 text-right">Cr Amount</th>
                  <th className="px-4 py-4 text-right">Dr Total</th>

                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {formatted.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-4 text-sm font-medium text-foreground whitespace-nowrap">
                      {r.dateFormatted}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground font-mono uppercase tracking-tight">
                      {r.voucher_no || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {r.series || "RECEIPT M"}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-rose-600">
                      {(r.party_name || {}).name ||
                        r.party_name ||
                        (r.party_name_id ? "Loading..." : "—")}
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-bold text-rose-500">
                      ₹
                      {(r.cr || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-bold text-blue-500">
                      ₹
                      {(
                        r.debit_entries?.reduce(
                          (sum: number, d: any) =>
                            sum + parseFloat(String(d.dr || 0)),
                          0
                        ) || parseFloat(String(r.dr || 0))
                      ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-4 py-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handlePrint(r.id)}
                        disabled={printingId === r.id}
                        title="Print/PDF"
                      >
                        {printingId === r.id ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <Printer className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-muted"
                        onClick={() =>
                          router.push(`/vouchers/receipt/detail/${r.id}`)
                        }
                        title="View Details"
                      >
                        <span className="sr-only">View Details</span>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          router.push(`/vouchers/receipt/${r.id}/edit`)
                        }
                        title="Edit"
                      >
                        <span className="sr-only">Edit</span>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                        title="Delete"
                      >
                        {deletingId === r.id ? (
                          <span className="animate-spin truncate">…</span>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
          <span>
            Showing page {page} of {totalPages} · {meta.count} total receipts
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((c) => Math.max(1, c - 1))}
              disabled={page <= 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((c) => c + 1)}
              disabled={page >= totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
