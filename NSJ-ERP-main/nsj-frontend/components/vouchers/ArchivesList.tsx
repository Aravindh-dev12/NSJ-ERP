"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  vouchersArchivesList,
  archiveDelete,
  exportVouchersAll,
  exportArchive,
  type Voucher,
  type VouchersListResponse,
  type QueryValue,
} from "@/lib/backend";
import { API_BASE_URL } from "@/lib/constants";
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
import { VouchersHeader } from "./VouchersHeader";

const PAGE_SIZE = 10;

function buildQuery(page: number, search: string) {
  const params: Record<string, QueryValue> = { page, page_size: PAGE_SIZE };
  if (search.trim()) params.search = search.trim();
  return params;
}

export function ArchivesList() {
  const { toast } = useToast();
  const isMountedRef = useRef(true);
  const [records, setRecords] = useState<Voucher[]>([]);
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

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const totalPages = useMemo(() => {
    if (meta.count === 0) return 1;
    return Math.max(1, Math.ceil(meta.count / PAGE_SIZE));
  }, [meta.count]);

  const fetchArchives = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildQuery(page, search);
      const response = await vouchersArchivesList(params);
      setRecords(response.results ?? []);
      setMeta({
        count: response.count ?? response.results?.length ?? 0,
        next: response.next ?? null,
        previous: response.previous ?? null,
      });
    } catch (err) {
      setRecords([]);
      setMeta({ count: 0, next: null, previous: null });
      setError("Failed to load pending queries. Please try again.");
      toast({
        variant: "destructive",
        title: "Unable to load pending queries",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    void fetchArchives();
  }, [fetchArchives]);

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
        "Are you sure you want to delete this pending query record?"
      );
      if (!confirmed) return;
      setDeletingId(id);
      // Temporary debug logging: print the computed URL and ID so we can inspect
      // the exact request path in the browser console when a 404 occurs.
      try {
        const debugUrl = `${API_BASE_URL}/vouchers/archives/${id}/`;
        // eslint-disable-next-line no-console
        console.debug("Deleting archive", { id, debugUrl });
        await archiveDelete(id);
        toast({
          title: "Pending query removed",
          description: "The record has been deleted successfully.",
        });
        await fetchArchives();
      } catch (err) {
        // Log detailed error info to console to help triage server-side 404s
        // eslint-disable-next-line no-console
        console.error("Archive delete failed", { id, err });
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
    [fetchArchives, toast]
  );

  const formattedRecords = useMemo(() => {
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
      <VouchersHeader
        title="Pending Queries"
        description="Orders pending queries (advance payment = NO)."
      />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">Pending Queries</CardTitle>
              <CardDescription>
                Orders with advance payment set to NO.
              </CardDescription>
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
                    a.download = fileName ?? "orders_data.xlsx";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                    if (isMountedRef.current) {
                      toast({ title: "Export complete" });
                    }
                  } catch (err) {
                    if (isMountedRef.current) {
                      toast({ variant: "destructive", title: "Export failed" });
                    }
                  } finally {
                    if (isMountedRef.current) {
                      setExporting(false);
                    }
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
              No pending queries found.
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
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Account
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Advance payment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Attachment
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {formattedRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-muted/40">
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">
                            {record.bill_no ?? "Unnamed"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {(record as any).dateFormatted}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {record.item_name ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {record.account && typeof record.account === "object"
                          ? (record.account as any).name
                          : typeof record.account === "string"
                            ? record.account
                            : "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {record.advance_payment_received
                          ? String(record.advance_payment_received)
                          : "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {record.upload_file ? (
                          /(?:\.png|\.jpe?g|\.gif|\.webp)$/i.test(
                            String(record.upload_file)
                          ) ? (
                            <img
                              src={String(record.upload_file)}
                              alt="attachment"
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <a
                              href={String(record.upload_file)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline"
                            >
                              Open
                            </a>
                          )
                        ) : (
                          "—"
                        )}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              const { blob, fileName } = await exportArchive(
                                record.id
                              );
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download =
                                fileName ??
                                `Order_${record.bill_no || record.voucher_number || "order"}.xlsx`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(url);
                              toast({
                                title:
                                  "Form data successfully exported to Excel.",
                              });
                            } catch (err) {
                              toast({
                                variant: "destructive",
                                title: "Export failed",
                              });
                            }
                          }}
                        >
                          Export
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
              Showing page {page} of {totalPages} · {meta.count} total pending
              queries
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
