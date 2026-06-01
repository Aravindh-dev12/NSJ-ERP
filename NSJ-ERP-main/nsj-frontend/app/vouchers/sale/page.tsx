"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SalesHeader } from "@/components/vouchers/SalesHeader";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { salesList, type Voucher } from "@/lib/backend";

export default function SalesOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [aggregates, setAggregates] = useState<{
    total?: number;
    recent_7_days?: number;
    avg_order_value?: number | null;
    sum_rate?: number | null;
  }>({});

  useEffect(() => {
    // derive aggregates from the sales list since the backend does not yet
    // expose sales-specific aggregates. We fetch a reasonably large page to
    // compute totals and recent counts.
    let mounted = true;
    setLoading(true);
    void (async () => {
      try {
        const resp = await salesList({ page: 1, page_size: 1000 });
        if (!mounted) return;
        const all = resp.results ?? [];
        const total = typeof resp.count === "number" ? resp.count : all.length;
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recent = all.reduce((acc, v) => {
          const d = v.date ? new Date(v.date) : null;
          if (d && d >= weekAgo) return acc + 1;
          return acc;
        }, 0);
        // compute average order value from available numeric fields (amount, total_amt, net_amount)
        const sumAndCount = all.reduce(
          (acc, v) => {
            const candidate =
              (v as any).amount ??
              (v as any).total_amt ??
              (v as any).net_amount ??
              null;
            let num: number | null = null;
            if (typeof candidate === "number" && Number.isFinite(candidate)) {
              num = candidate;
            } else if (
              typeof candidate === "string" &&
              candidate.trim() !== ""
            ) {
              const parsed = Number(String(candidate).replace(/[,\s]/g, ""));
              if (!Number.isNaN(parsed)) num = parsed;
            }
            if (num !== null) {
              acc.sum += num;
              acc.count += 1;
            }
            return acc;
          },
          { sum: 0, count: 0 }
        );

        const avg = sumAndCount.count
          ? Math.round(sumAndCount.sum / sumAndCount.count)
          : null;

        // sum of rate field (if present)
        const sumRate = all.reduce((acc, v) => {
          const r = (v as any).rate ?? null;
          if (typeof r === "number" && Number.isFinite(r)) return acc + r;
          if (typeof r === "string" && r.trim() !== "") {
            const parsed = Number(String(r).replace(/[,\s]/g, ""));
            if (!Number.isNaN(parsed)) return acc + parsed;
          }
          return acc;
        }, 0);

        if (mounted)
          setAggregates({
            total,
            recent_7_days: recent,
            avg_order_value: avg,
            sum_rate: sumRate || null,
          });
      } catch {
        if (mounted) setAggregates({});
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // New: compute total pieces (sum of number_of_pieces or piece) by fetching many vouchers.
  const [totalPieces, setTotalPieces] = useState<number | null>(null);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // fetch a large page to compute sum of pieces for sales
        const resp = await salesList({ page: 1, page_size: 1000 });
        if (!mounted) return;
        const all = resp.results ?? [];
        const sum = all.reduce((acc, v) => {
          const p = (v as any).number_of_pieces ?? (v as any).piece ?? null;
          if (typeof p === "number") return acc + p;
          const parsed = Number(p);
          if (!Number.isNaN(parsed)) return acc + parsed;
          // fallback: count 1 per record
          return acc + 1;
        }, 0);
        setTotalPieces(sum);
      } catch {
        if (!mounted) return;
        setTotalPieces(null);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const [recent, setRecent] = useState<Voucher[]>([]);
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const resp = await salesList({ page: 1, page_size: 5 });
        if (!mounted) return;
        setRecent(resp.results ?? []);
      } catch {
        if (!mounted) return;
        setRecent([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // prepare display strings to avoid complex inline JSX expressions
  const displayTotalSales = loading ? "—" : (aggregates.total ?? "—");
  const displayTotalPieces =
    totalPieces === null ? (loading ? "—" : "—") : totalPieces;
  const displaySumRate = loading
    ? "—"
    : typeof aggregates.sum_rate === "number" && aggregates.sum_rate !== null
      ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(
          aggregates.sum_rate
        )
      : "—";

  return (
    <div className="space-y-8">
      <PreviousBackButton />
      <SalesHeader
        title="Sales overview"
        description="Monitor sales at a glance and jump into detailed sales management."
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{displayTotalSales}</div>
            <p className="text-sm text-muted-foreground">
              All sales recorded in NSJ.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total pieces</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold  text-emerald-600">
              {displayTotalPieces}
            </div>
            <p className="text-sm text-muted-foreground">
              Sum of pieces for recent sales (fallback to 1 per record when not
              provided).
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Link href="/vouchers/sale/list" className="text-sm text-primary">
                See all sales
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Recent sales</CardTitle>
          <CardDescription>Latest sales added to the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sales available yet. Create one to get started.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {String(v.tag_no ?? v.order_no ?? v.bill_no ?? "Unnamed")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {String(v.item_name ?? "—")}
                      {v.unit || (v as any).net_wt ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          · {String(v.unit ?? "")}
                          {(v as any).net_wt
                            ? ` ${String((v as any).net_wt)}`
                            : ""}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary">
                    {v.account && typeof v.account === "object"
                      ? ((v.account as any).account_name ??
                        (v.account as any).name ??
                        "")
                      : typeof v.account === "string"
                        ? v.account
                        : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Link href="/vouchers/sale/list" className="text-sm text-primary">
            See all sales
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
