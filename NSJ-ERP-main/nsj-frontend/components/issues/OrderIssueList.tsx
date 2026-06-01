"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  orderIssueList,
  orderIssueDelete,
  vouchersItemNames,
  accountsDropdown,
  type QueryValue,
} from "@/lib/backend";
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
import { VouchersHeader } from "@/components/vouchers/VouchersHeader";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

const PAGE_SIZE = 10;

function buildQuery(page: number, search: string) {
  const params: Record<string, QueryValue> = { page, page_size: PAGE_SIZE };
  if (search.trim()) params.search = search.trim();
  return params;
}

type OrderIssueListProps = {
  showHeader?: boolean;
};

export default function OrderIssueList({
  showHeader = true,
}: OrderIssueListProps) {
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
  const [itemNameMap, setItemNameMap] = useState<Record<string, string>>({});
  const [accountNameMap, setAccountNameMap] = useState<Record<string, string>>(
    {}
  );

  const totalPages = useMemo(() => {
    if (meta.count === 0) return 1;
    return Math.max(1, Math.ceil(meta.count / PAGE_SIZE));
  }, [meta.count]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildQuery(page, search);
      const response = await orderIssueList(params);
      setRecords(response.results ?? []);
      setMeta({
        count: (response.count as number) ?? response.results?.length ?? 0,
        next: (response.next as string | null) ?? null,
        previous: (response.previous as string | null) ?? null,
      });
    } catch (err) {
      setRecords([]);
      setMeta({ count: 0, next: null, previous: null });
      setError("Failed to load order issues. Please try again.");
      toast({
        variant: "destructive",
        title: "Unable to load order issues",
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

  // load item name masters to map possible UUIDs to human names
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const itemsResp = await vouchersItemNames();
        if (!mounted) return;
        const names: Record<string, string> = {};
        if (itemsResp && Array.isArray((itemsResp as any).item_names)) {
          for (const it of (itemsResp as any).item_names) {
            if (it && it.id) names[it.id] = it.name ?? String(it.id);
          }
        }
        setItemNameMap(names);
      } catch (e) {
        // ignore — fallback to raw value
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // load accounts map so we can display account names when list returns IDs
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const acc = await accountsDropdown();
        if (!mounted) return;
        const map: Record<string, string> = {};
        if (Array.isArray(acc)) {
          for (const a of acc as any[]) {
            if (a && a.id)
              map[a.id] = (a.account_name || a.name) ?? String(a.id);
          }
        }
        setAccountNameMap(map);
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
        "Are you sure you want to delete this order issue?"
      );
      if (!confirmed) return;
      setDeletingId(id);
      try {
        await orderIssueDelete(id);
        toast({
          title: "Order issue removed",
          description: "The order issue has been deleted successfully.",
        });
        await fetchList();
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Delete failed",
          description:
            err instanceof Error
              ? err.message
              : "Could not delete order issue.",
        });
      } finally {
        setDeletingId(null);
      }
    },
    [fetchList, toast]
  );

  const handleDownloadPDF = useCallback(
    (recordId: string, billNo?: string) => {
      // TODO: Implement PDF download from backend
      // The endpoint should be something like: /api/payments/order-issues/{id}/export/
      const fileName = `order-issue-${billNo || recordId}.pdf`;
      toast({
        title: "PDF Download",
        description: `Downloading ${fileName}...`,
      });
      // window.location.href = `${API_BASE_URL}/payments/order-issues/${recordId}/export/`;
    },
    [toast]
  );

  const formattedRecords = useMemo(() => {
    return records.map((record) => ({
      ...record,
      dateFormatted: record.created_at
        ? new Intl.DateTimeFormat(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          }).format(new Date(record.created_at))
        : "—",
    }));
  }, [records]);

  return (
    <div className="space-y-8">
      {showHeader && <PreviousBackButton />}
      {/* Header is optional so the list can be embedded inside an overview */}
      {showHeader ? (
        <VouchersHeader
          title="Order Issues"
          description="Manage order issues"
          subLinks={[
            { label: "Overview", href: "/order-issues" },
            { label: "List", href: "/order-issues/list" },
          ]}
        />
      ) : null}

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">Order issues</CardTitle>
              <CardDescription>Search and manage order issues.</CardDescription>
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
                placeholder="Search by metal, account or item"
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
              No order issues found. Try adjusting filters or create a new
              issue.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Metal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Account
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Delivery Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {formattedRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-muted/40">
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {record.metal ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {(() => {
                          const v = record.item_name;
                          if (!v) return "—";
                          // if object with name
                          if (typeof v === "object")
                            return v.name ?? String(v.id ?? "—");
                          // if string (possibly uuid), try map
                          if (typeof v === "string") return itemNameMap[v] ?? v;
                          return String(v);
                        })()}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {(() => {
                          const a = record.account;
                          if (!a) return "—";
                          if (typeof a === "object")
                            return a.account_name ?? a.name ?? a.id ?? "—";
                          if (typeof a === "string")
                            return accountNameMap[a] ?? a;
                          return String(a);
                        })()}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {record.delivery_date ?? "—"}
                      </td>
                      <td className="flex items-center justify-end gap-2 px-4 py-4 text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDownloadPDF(record.id, record.bill_no)
                          }
                        >
                          Download PDF
                        </Button>
                        <Link href={`/order-issues/${record.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
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
              Showing page {page} of {totalPages} · {meta.count} total issues
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
