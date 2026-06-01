"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  accountDelete,
  accountsList,
  exportAccountsAll,
  type Account,
  type AccountsQueryParams,
} from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { exportAccount } from "@/lib/backend";
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
import { cn } from "@/lib/utils";
import { AccountsHeader } from "./AccountsHeader";

const GROUP_OPTIONS = [
  { label: "All groups", value: "all" },
  { label: "Customers", value: "CUSTOMER" },
  { label: "Suppliers", value: "SUPPLIER" },
  { label: "Karigar", value: "KARIGAR" },
  { label: "Agents", value: "AGENT" },
  { label: "Staff", value: "STAFF" },
  { label: "Cash", value: "CASH" },
  { label: "Bank", value: "BANK" },
  { label: "Sale", value: "SALE" },
  { label: "Purchase", value: "PURCHASE" },
  { label: "Expenses Direct", value: "EXPENSES DIRECT" },
  { label: "Expenses Indirect", value: "EXPENSES INDIRECT" },
  { label: "Incomes Direct", value: "INCOMES DIRECT" },
  { label: "Incomes Indirect", value: "INCOMES INDIRECT" },
  { label: "Loans (Liability)", value: "LOANS (LIABILITY)" },
  { label: "Income", value: "Income" },
  { label: "Liability", value: "Liability" },
];

const STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const PAGE_SIZE = 10;

function buildQuery(
  page: number,
  search: string,
  group: string,
  status: string,
  dateFrom: string,
  dateTo: string
): AccountsQueryParams {
  const params: AccountsQueryParams = {
    page,
    page_size: PAGE_SIZE,
  };

  if (search.trim()) {
    params.search = search.trim();
  }
  if (group !== "all") {
    params.group = group;
  }
  if (status !== "all") {
    params.status = status;
  }
  if (dateFrom) {
    (params as any).date_from = dateFrom;
  }
  if (dateTo) {
    (params as any).date_to = dateTo;
  }

  return params;
}

export function AccountsList() {
  const { toast } = useToast();
  const pathname = usePathname();
  const basePath = pathname?.startsWith("/masters-hub/account-master")
    ? "/masters-hub/account-master"
    : "/accounts";
  const [records, setRecords] = useState<Account[]>([]);
  const [meta, setMeta] = useState<{
    count: number;
    next: string | null;
    previous: string | null;
  }>({ count: 0, next: null, previous: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalPages = useMemo(() => {
    if (meta.count === 0) return 1;
    return Math.max(1, Math.ceil(meta.count / PAGE_SIZE));
  }, [meta.count]);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildQuery(page, search, group, status, dateFrom, dateTo);
      const response = await accountsList(params);
      setRecords(response.results ?? []);
      setMeta({
        count: response.count ?? response.results?.length ?? 0,
        next: response.next ?? null,
        previous: response.previous ?? null,
      });
    } catch (err) {
      setRecords([]);
      setMeta({ count: 0, next: null, previous: null });
      setError("Failed to load accounts. Please try again.");
      toast({
        variant: "destructive",
        title: "Unable to load accounts",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }, [group, page, search, status, dateFrom, dateTo, toast]);

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  const handleSearchSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSearch(searchInput.trim());
      setPage(1);
    },
    [searchInput]
  );

  const handleGroupChange = useCallback((value: string) => {
    setGroup(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatus(value);
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this account?"
      );
      if (!confirmed) return;

      setDeletingId(id);
      try {
        await accountDelete(id);
        toast({
          title: "Account removed",
          description: "The account has been deleted successfully.",
        });
        await fetchAccounts();
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Delete failed",
          description:
            err instanceof Error ? err.message : "Could not delete account.",
        });
      } finally {
        setDeletingId(null);
      }
    },
    [fetchAccounts, toast]
  );

  const canGoBack = page > 1;
  const canGoForward = page < totalPages;

  const formattedRecords = useMemo(() => {
    return records.map((record) => ({
      ...record,
      createdAtFormatted: record.created_at
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
      <AccountsHeader
        title="Accounts"
        description="Manage company accounts, review their status, and keep records tidy."
      />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">Accounts list</CardTitle>
              <CardDescription>
                Search, filter, and maintain ledger accounts in one place.
              </CardDescription>
            </div>
            {/* top-level Add account button removed as it's redundant with page controls */}
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3">
            <div className="flex flex-1 items-center gap-2">
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by name"
                className="w-full"
              />
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </div>
            <div className="flex flex-1 gap-2">
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={group}
                onChange={(event) => handleGroupChange(event.target.value)}
              >
                {GROUP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={status}
                onChange={(event) => handleStatusChange(event.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="w-full flex items-center justify-end">
                <Button
                  variant="outline"
                  onClick={async () => {
                    setExporting(true);
                    try {
                      const { blob, fileName } = await exportAccountsAll();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = fileName ?? "accounts_data.xlsx";
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                      toast({ title: "Accounts exported" });
                    } catch (err) {
                      toast({ variant: "destructive", title: "Export failed" });
                    } finally {
                      setExporting(false);
                    }
                  }}
                >
                  {exporting ? "Exporting…" : "Export Data"}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm text-muted-foreground whitespace-nowrap">
                From
              </label>
              <Input
                type="date"
                className="w-40"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
              <label className="text-sm text-muted-foreground whitespace-nowrap">
                To
              </label>
              <Input
                type="date"
                className="w-40"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
              {(dateFrom || dateTo) && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs text-muted-foreground"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setPage(1);
                  }}
                >
                  Clear dates
                </Button>
              )}
            </div>
          </form>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-6 py-4 text-sm text-destructive">
              {error}
            </div>
          ) : records.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 px-6 py-14 text-center text-sm text-muted-foreground">
              No accounts found. Try adjusting your filters or create a new
              account.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Account
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Ledger Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Created
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
                            {record.account_name ?? "Unnamed account"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {record.account_no ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {record.ledger_role ?? record.group_code ?? "—"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                            record.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-800"
                          )}
                        >
                          {record.status ?? "Unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {record.createdAtFormatted}
                      </td>
                      <td className="flex items-center justify-end gap-2 px-4 py-4 text-sm">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`${basePath}/${record.id}`}>View</Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`${basePath}/${record.id}/edit`}>
                            Edit
                          </Link>
                        </Button>
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
                              const { blob, fileName } = await exportAccount(
                                record.id
                              );
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download =
                                fileName ??
                                `Account_${record.account_name || "account"}.xlsx`;
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
              Showing page {page} of {totalPages} · {meta.count} total accounts
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={!canGoBack || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => current + 1)}
                disabled={!canGoForward || loading}
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
