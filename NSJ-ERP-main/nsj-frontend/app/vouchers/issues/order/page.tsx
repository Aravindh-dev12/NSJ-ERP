"use client";

import { useEffect, useState } from "react";
import { VouchersHeader } from "@/components/vouchers/VouchersHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { orderIssueList } from "@/lib/backend";

export default function OrderIssueOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [aggregates, setAggregates] = useState<{
    total?: number;
    recent_7_days?: number;
  }>({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    void (async () => {
      try {
        const resp = await orderIssueList({ page: 1, page_size: 1000 });
        if (!mounted) return;
        const all = resp.results ?? resp.items ?? [];
        const total = typeof resp.count === "number" ? resp.count : all.length;
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recent = all.reduce((acc: number, v: Record<string, unknown>) => {
          const d = v.created_at
            ? new Date(v.created_at as string)
            : v.date
              ? new Date(v.date as string)
              : null;
          if (d && d >= weekAgo) return acc + 1;
          return acc;
        }, 0);
        if (mounted) setAggregates({ total, recent_7_days: recent });
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

  // small recent list
  const [recentList, setRecentList] = useState<Record<string, unknown>[]>([]);
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const resp = await orderIssueList({ page: 1, page_size: 5 });
        if (!mounted) return;
        setRecentList(resp.results ?? resp.items ?? []);
      } catch {
        if (!mounted) return;
        setRecentList([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <VouchersHeader
        title="Order Issues"
        description="Track and manage order issues with PDF exports."
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {loading ? "—" : (aggregates.total ?? "—")}
            </div>
            <p className="text-sm text-muted-foreground">
              All order issues recorded.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-amber-600">
              {loading ? "—" : (aggregates.recent_7_days ?? "—")}
            </div>
            <p className="text-sm text-muted-foreground">
              Issues created in the last 7 days.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Recent order issues</CardTitle>
          <CardDescription>
            Latest order issues generated from orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No order issues available yet. Create one from an order to get
              started.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recentList.map((v) => (
                <li
                  key={v.id as string}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {v.order && typeof v.order === "object"
                        ? ((v.order as Record<string, unknown>)
                            .bill_no as string) || "Order Issue"
                        : "Order Issue"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {v.item_name && typeof v.item_name === "object"
                        ? ((v.item_name as Record<string, unknown>)
                            .name as string)
                        : ((v.item_name as string) ?? "—")}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary">
                    {v.account && typeof v.account === "object"
                      ? (((v.account as Record<string, unknown>)
                          .account_name as string) ??
                        ((v.account as Record<string, unknown>)
                          .name as string) ??
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
      </Card>
    </div>
  );
}
