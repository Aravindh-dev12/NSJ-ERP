"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  purchaseTagwiseList,
  purchaseTagwiseDelete,
  exportVouchersAll,
  type QueryValue,
} from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 10;

function buildQuery(page: number, search: string) {
  const params: Record<string, QueryValue> = { page, page_size: PAGE_SIZE };
  if (search.trim()) params.search = search.trim();
  return params;
}

export default function PurchaseTagwiseList() {
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
  const [exporting, setExporting] = useState(false);

  const totalPages = useMemo(() => {
    if (meta.count === 0) return 1;
    return Math.max(1, Math.ceil(meta.count / PAGE_SIZE));
  }, [meta.count]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildQuery(page, search);
      const response = await purchaseTagwiseList(params);
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
      setError("Failed to load purchase tagwise records. Please try again.");
      toast({
        variant: "destructive",
        title: "Unable to load purchase records",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, toast]);

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
        "Are you sure you want to delete this purchase record?"
      );
      if (!confirmed) return;
      setDeletingId(id);
      try {
        await purchaseTagwiseDelete(id);
        toast({
          title: "Record removed",
          description: "The record has been deleted successfully.",
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

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">Purchase Tagwise M</CardTitle>
            </div>
            <div className="ml-auto">
              <Button
                variant="secondary"
                onClick={async () => {
                  setExporting(true);
                  try {
                    const { blob, fileName } = await exportVouchersAll();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = fileName ?? "purchase_tagwise_data.xlsx";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                    toast({ title: "Export complete" });
                  } catch (err) {
                    toast({ variant: "destructive", title: "Export failed" });
                  } finally {
                    setExporting(false);
                  }
                }}
                disabled={exporting}
              >
                {exporting ? "Exporting…" : "Export Data"}
              </Button>
            </div>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col gap-3 md:flex-row md:items-center"
          >
            <div className="flex flex-1 items-center gap-2">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by order number or description"
                className="w-full"
              />
              <Button type="submit" variant="secondary">
                Search
              </Button>
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
              No purchase tagwise records found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Item
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-muted/40">
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">
                            {record.bill_no ?? "Unnamed"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {record.date
                          ? new Intl.DateTimeFormat(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }).format(new Date(record.date))
                          : "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {record.item_name ?? "—"}
                      </td>
                      <td className="flex items-center justify-end gap-2 px-4 py-4 text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(record.id)}
                          disabled={deletingId === record.id}
                        >
                          {deletingId === record.id ? "Deleting…" : "Delete"}
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
              Showing page {page} of {totalPages} · {meta.count} total
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
