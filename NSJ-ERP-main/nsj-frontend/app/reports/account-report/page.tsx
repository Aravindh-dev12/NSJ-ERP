"use client";

import { useEffect, useMemo, useState } from "react";
import { VouchersHeader } from "@/components/vouchers/VouchersHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { accountsDropdown, accountReportList } from "@/lib/backend";
import { Button } from "@/components/ui/button";

export default function AccountReportPage() {
  const [accounts, setAccounts] = useState<{ id: string; name?: string }[]>([]);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const acc = await accountsDropdown();
        if (!mounted) return;
        setAccounts(acc ?? []);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredAccounts = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((a) => (a.name || "").toLowerCase().includes(q));
  }, [accounts, filter]);

  useEffect(() => {
    if (!selected) {
      setRecords([]);
      setTotal(0);
      return;
    }
    let mounted = true;
    setLoading(true);
    void (async () => {
      try {
        const resp = await accountReportList({
          account_id: selected,
          page,
          page_size: pageSize,
        });
        if (!mounted) return;
        const items = (resp.items ?? resp.results) as
          | Record<string, unknown>[]
          | undefined;
        setRecords(items ?? []);
        setTotal(
          (resp.count as number) ??
            (resp.total as number) ??
            (items ? items.length : 0)
        );
      } catch {
        if (!mounted) return;
        setRecords([]);
        setTotal(0);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selected, page, pageSize]);

  // Transform raw records into a clean, presentable shape for the table
  const rows = useMemo(() => {
    return (records || []).map((r: Record<string, unknown>) => {
      const getDate = () =>
        r.date || r.created_at || r.entry_date || r.transaction_date || null;
      const getRef = () =>
        r.bill_no || r.voucher_number || r.tag_no || r.order_no || r.id || "";
      const getDesc = () =>
        r.narration || r.remark || r.description || r.note || "";
      const getAmount = () => {
        const amtKeys = ["amount", "total", "balance", "dr", "cr"];
        for (const k of amtKeys) {
          if (r[k] !== undefined && r[k] !== null && r[k] !== "")
            return Number(r[k]);
        }
        return null;
      };

      const amount = getAmount();
      const date = getDate();

      return {
        raw: r,
        date: date ? String(date).slice(0, 10) : "—",
        module: r.module_name || r.model || "—",
        reference: getRef(),
        description: getDesc(),
        amount: amount !== null ? amount : undefined,
      };
    });
  }, [records]);

  // Build a list of all keys returned by the backend so we can render them as table columns
  const allColumns = useMemo(() => {
    const cols = new Set<string>();
    // include summary columns first
    const preferred = ["date", "module", "reference", "description", "amount"];
    for (const p of preferred) cols.add(p);

    for (const rec of records || []) {
      if (!rec || typeof rec !== "object") continue;
      Object.keys(rec).forEach((k) => {
        if (!cols.has(k)) cols.add(k);
      });
    }

    // return preferred order followed by the rest (excluding duplicates)
    const rest = Array.from(cols)
      .filter((c) => !preferred.includes(c))
      .sort();
    return [...preferred, ...rest];
  }, [records]);

  function formatDate(dateStr: string | null | undefined) {
    if (!dateStr || dateStr === "—") return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr).slice(0, 10);
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }).format(d);
    } catch {
      return String(dateStr).slice(0, 10);
    }
  }

  function formatNumber(v: unknown) {
    if (v === null || v === undefined || v === "") return "—";
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    try {
      return n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      return n.toFixed(2);
    }
  }

  return (
    <div className="space-y-8">
      <VouchersHeader
        title="Account Report"
        description="Report combining records across modules for a selected account"
        subLinks={[
          { label: "Account Report", href: "/reports/account-report" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Account Report</CardTitle>
          <CardDescription>
            Choose an account to view combined records from Sales, Orders,
            Repairs and other modules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block text-sm font-medium text-muted-foreground">
              Account Name
            </label>
            <div className="relative mt-2">
              <Input
                placeholder="Search accounts..."
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
              />

              {dropdownOpen && filteredAccounts.length > 0 && (
                <div className="absolute z-40 mt-1 max-h-48 w-full overflow-auto rounded border bg-white">
                  <ul>
                    {filteredAccounts.map((a) => (
                      <li key={a.id}>
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted/40"
                          onClick={() => {
                            setSelected(a.id);
                            setFilter(a.name ?? "");
                            setDropdownOpen(false);
                            setPage(1); // reset pagination when account changes
                          }}
                        >
                          {a.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            {loading ? (
              <div className="p-6 text-sm">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No data found
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-max table-auto divide-y divide-border">
                  <thead>
                    <tr>
                      {allColumns.map((col) => {
                        // size hints for summary columns
                        const sizeClass =
                          col === "date"
                            ? "w-36"
                            : col === "module"
                              ? "w-44"
                              : col === "reference"
                                ? "w-56"
                                : col === "amount"
                                  ? "w-28 text-right"
                                  : "min-w-[12rem]";
                        return (
                          <th
                            key={col}
                            className={`sticky top-0 z-20 bg-muted/80 backdrop-blur px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground border-b ${sizeClass}`}
                          >
                            {String(col)
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (s) => s.toUpperCase())}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-background">
                    {rows.map((r: Record<string, unknown>, idx: number) => (
                      <tr
                        key={`row-${idx}`}
                        className={`hover:bg-muted/40 ${idx % 2 === 0 ? "even:bg-muted/10" : ""}`}
                      >
                        {allColumns.map((col) => {
                          // Render summary columns from computed row
                          let cell: React.ReactNode = null;
                          if (col === "date")
                            cell =
                              r.date && r.date !== "—"
                                ? formatDate(r.date as string)
                                : "—";
                          else if (col === "module")
                            cell = (
                              <strong className="text-foreground">
                                {r.module as string}
                              </strong>
                            );
                          else if (col === "reference")
                            cell = (r.reference as string) || "—";
                          else if (col === "description")
                            cell = (r.description as string) || "—";
                          else if (col === "amount")
                            cell =
                              r.amount !== undefined && r.amount !== null
                                ? formatNumber(r.amount as number)
                                : "—";
                          else {
                            const rawVal = r.raw
                              ? (r.raw as Record<string, unknown>)[col]
                              : undefined;
                            if (
                              rawVal === null ||
                              rawVal === undefined ||
                              rawVal === ""
                            ) {
                              cell = "—";
                            } else if (typeof rawVal === "object") {
                              // prefer human-readable name when available
                              const objVal = rawVal as Record<string, unknown>;
                              if (
                                rawVal &&
                                (objVal.name ||
                                  objVal.account_name ||
                                  objVal.sub_account_name ||
                                  objVal.display_name ||
                                  objVal.title)
                              ) {
                                cell = String(
                                  objVal.name ??
                                    objVal.account_name ??
                                    objVal.sub_account_name ??
                                    objVal.display_name ??
                                    objVal.title
                                );
                              } else {
                                try {
                                  cell = JSON.stringify(rawVal);
                                } catch {
                                  cell = String(rawVal);
                                }
                              }
                            } else {
                              cell = String(rawVal);
                            }
                          }

                          const isAmount = col === "amount";

                          return (
                            <td
                              key={`${idx}-${col}`}
                              className={`px-4 py-3 align-top text-sm ${isAmount ? "text-right font-medium" : "text-muted-foreground"}`}
                            >
                              <div
                                title={
                                  typeof cell === "string" ? cell : undefined
                                }
                                className="max-w-[28rem] break-words whitespace-pre-wrap"
                              >
                                {cell}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
            <div>
              Showing {records.length} of {total}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={records.length === 0}
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
