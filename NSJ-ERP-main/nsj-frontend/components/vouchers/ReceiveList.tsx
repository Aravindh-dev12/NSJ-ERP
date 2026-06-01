"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SalesHeader } from "./SalesHeader";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import { Calendar } from "lucide-react";
import { receiveList, receiveDelete, type QueryValue } from "@/lib/backend";
import { getLocalFirstOfMonth, getLocalToday } from "@/lib/date";

const PAGE_SIZE = 10;

function buildQuery(
  page: number,
  search: string,
  dateFrom?: string,
  dateTo?: string
) {
  const params: Record<string, QueryValue> = { page, page_size: PAGE_SIZE };
  if (search.trim()) params.search = search.trim();
  return params;
}

export function ReceiveList() {
  const { toast } = useToast();
  const isMountedRef = useRef(true);
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

  const getDefaultDateFrom = () => {
    return getLocalFirstOfMonth();
  };

  const getDefaultDateTo = () => {
    return getLocalToday();
  };

  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom());
  const [dateTo, setDateTo] = useState(getDefaultDateTo());

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const totalPages = useMemo(() => {
    if (meta.count === 0) return 1;
    return Math.max(1, Math.ceil(meta.count / PAGE_SIZE));
  }, [meta.count]);

  const fetchRecords = useCallback(async () => {
    if (!isMountedRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const params = buildQuery(page, search, dateFrom, dateTo);
      const response = await receiveList(params);
      if (!isMountedRef.current) return;
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
      if (!isMountedRef.current) return;
      setRecords([]);
      setMeta({ count: 0, next: null, previous: null });
      setError("Failed to load receives. Please try again.");
      toast({
        variant: "destructive",
        title: "Unable to load receives",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [page, search, dateFrom, dateTo, toast]);

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

  const handleDelete = useCallback(
    async (id: string) => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this receive entry?"
      );
      if (!confirmed) return;
      setDeletingId(id);
      try {
        await receiveDelete(id);
        if (!isMountedRef.current) return;
        toast({
          title: "Receive removed",
          description: "The receive entry has been deleted.",
        });
        await fetchRecords();
      } catch (err) {
        if (!isMountedRef.current) return;
        toast({
          variant: "destructive",
          title: "Delete failed",
          description: err instanceof Error ? err.message : "Could not delete.",
        });
      } finally {
        if (isMountedRef.current) {
          setDeletingId(null);
        }
      }
    },
    [fetchRecords, toast]
  );

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
      <PreviousBackButton />
      <SalesHeader
        title="Receive"
        description="Manage receive entries."
        links={[
          { label: "Overview", href: "/vouchers/receive" },
          { label: "List", href: "/vouchers/receive/list" },
          { label: "Add New", href: "/vouchers/receive/new" },
        ]}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Receive list</h2>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by tag no, account or item"
              className="flex-1"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
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
        </form>

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
            No receive entries found.
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
                    Account
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Tag No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Item Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Pc
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Gr.Wt
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Net.Wt
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {formatted.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/40">
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {r.dateFormatted}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {typeof r.account === "object"
                        ? (r.account?.account_name ?? r.account?.name)
                        : (r.account ?? "—")}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {r.tag_no ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {typeof r.item_name === "object"
                        ? r.item_name?.name
                        : (r.item_name ?? "—")}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {r.pc ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {r.gr_wt ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {r.net_wt ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {r.rate ?? "—"}
                    </td>
                    <td className="flex items-center justify-end gap-2 px-4 py-4 text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                      >
                        {deletingId === r.id ? "Deleting…" : "Delete"}
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
            Showing page {page} of {totalPages} · {meta.count} total receives
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
