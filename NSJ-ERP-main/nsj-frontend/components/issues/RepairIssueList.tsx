"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  repairIssueList,
  repairIssueDelete,
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
import { Calendar } from "lucide-react";
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
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;
  return params;
}

type RepairIssueListProps = {
  showHeader?: boolean;
};

export default function RepairIssueList({
  showHeader = true,
}: RepairIssueListProps) {
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

  const [dateFrom, setDateFrom] = useState(getLocalFirstOfMonth());
  const [dateTo, setDateTo] = useState(getLocalToday());

  const totalPages = useMemo(() => {
    if (meta.count === 0) return 1;
    return Math.max(1, Math.ceil(meta.count / PAGE_SIZE));
  }, [meta.count]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildQuery(page, search, dateFrom, dateTo);
      const response = await repairIssueList(params);
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
      setError("Failed to load issues. Please try again.");
      toast({
        variant: "destructive",
        title: "Unable to load issues",
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
          for (const a of acc) {
            if (a && a.id) map[a.id] = a.name ?? String(a.id);
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
        "Are you sure you want to delete this issue?"
      );
      if (!confirmed) return;
      setDeletingId(id);
      try {
        await repairIssueDelete(id);
        toast({
          title: "Issue removed",
          description: "The issue has been deleted successfully.",
        });
        await fetchList();
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Delete failed",
          description:
            err instanceof Error ? err.message : "Could not delete issue.",
        });
      } finally {
        setDeletingId(null);
      }
    },
    [fetchList, toast]
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
          title="Repair Issues"
          description="Manage repair issues"
          subLinks={[
            { label: "Overview", href: "/issues" },
            { label: "List", href: "/issues/list" },
            { label: "Add New", href: "/issues/new" },
          ]}
        />
      ) : null}

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">Repair issues</CardTitle>
              <CardDescription>
                Search and manage repair issues.
              </CardDescription>
            </div>
            <div className="ml-auto">
              <Link href="/issues/repair-issue/new">
                <Button variant="secondary">Add New</Button>
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
                placeholder="Search by tag, account or item"
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
              No issues found. Try adjusting filters or create a new issue.
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
                      Account
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Piece
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Total
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
                        {record.tag_no ?? "—"}
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
                        {record.piece ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {record.total ?? "—"}
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
                        <Link href={`/issues/repair-issue/${record.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
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
