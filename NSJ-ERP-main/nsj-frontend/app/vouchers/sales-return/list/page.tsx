"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  salesReturnList,
  salesReturnDelete,
  type QueryValue,
} from "@/lib/backend";
import { getLocalFirstOfMonth, getLocalToday } from "@/lib/date";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SalesHeader } from "@/components/vouchers/SalesHeader";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import { Calendar } from "lucide-react";

const PAGE_SIZE = 10;

function buildQuery(page: number, search: string) {
  const params: Record<string, QueryValue> = { page, page_size: PAGE_SIZE };
  if (search.trim()) params.search = search.trim();
  return params;
}

export default function SalesReturnListPage() {
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

  const getDefaultDateFrom = () => {
    return getLocalFirstOfMonth();
  };

  const getDefaultDateTo = () => {
    return getLocalToday();
  };

  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom());
  const [dateTo, setDateTo] = useState(getDefaultDateTo());

  const totalPages = useMemo(() => {
    if (meta.count === 0) return 1;
    return Math.max(1, Math.ceil(meta.count / PAGE_SIZE));
  }, [meta.count]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildQuery(page, search);
      const response = await salesReturnList({
        ...params,
        date_from: dateFrom,
        date_to: dateTo,
      });
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
      setError("Failed to load sales returns. Please try again.");
      toast({
        variant: "destructive",
        title: "Unable to load Sales Returns",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, dateFrom, dateTo, toast]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

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
        "Are you sure you want to delete this sales return?"
      );
      if (!confirmed) return;
      setDeletingId(id);
      try {
        await salesReturnDelete(id);
        toast({
          title: "Sales Return removed",
          description: "Deleted successfully.",
        });
        await fetchList();
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Delete failed",
          description:
            err instanceof Error ? err.message : "Could not delete record.",
        });
      } finally {
        setDeletingId(null);
      }
    },
    [fetchList, toast]
  );

  const formatted = useMemo(() => {
    return records.map((record) => ({
      ...record,
      dateFormatted: record.date
        ? new Intl.DateTimeFormat(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          }).format(new Date(record.date))
        : "—",
    }));
  }, [records]);

  return (
    <div className="space-y-8">
      <PreviousBackButton />
      <SalesHeader
        title="Sales Returns"
        description="Manage sales returns: create, review and keep records."
        links={[
          { label: "Overview", href: "/vouchers/sales-return" },
          { label: "List", href: "/vouchers/sales-return/list" },
          { label: "Add New", href: "/vouchers/sales-return/add-new" },
        ]}
      />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">Sales Return list</CardTitle>
              <CardDescription>
                Search, filter, and maintain sales returns in one place.
              </CardDescription>
            </div>
            <div className="ml-auto">
              <Link href="/vouchers/sales-return/add-new">
                <Button>Create Sales Return</Button>
              </Link>
            </div>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col gap-3 md:flex-row md:items-center"
          >
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by tag/order or remark"
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
        </CardHeader>

        <CardContent className="space-y-6">
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
              No sales returns found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Tag No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Order No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Net Wt
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
                        {r.tag_no ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {r.item_name && typeof r.item_name === "object"
                          ? r.item_name.name
                          : (r.item_name ?? "—")}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {r.order_no ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {r.net_wt ?? "—"}
                      </td>
                      <td className="flex items-center justify-end gap-2 px-4 py-4 text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
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

          <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <span>
              Showing page {page} of {totalPages} · {meta.count} total records
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
        </CardContent>
      </Card>
    </div>
  );
}
