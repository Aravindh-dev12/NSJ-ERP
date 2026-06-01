"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VouchersHeader } from "@/components/vouchers/VouchersHeader";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { repairIssueList } from "@/lib/backend";

export default function IssuesOverviewPage() {
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
        const resp = await repairIssueList({ page: 1, page_size: 1000 });
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

  // compute total pieces (sum of piece field when available)
  const [totalPieces, setTotalPieces] = useState<number | null>(null);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const resp = await repairIssueList({ page: 1, page_size: 1000 });
        if (!mounted) return;
        const all = resp.results ?? resp.items ?? [];
        const sum = all.reduce((acc: number, v: Record<string, unknown>) => {
          const p = v.piece ?? v.number_of_pieces ?? null;
          if (typeof p === "number") return acc + p;
          const parsed = Number(p);
          if (!Number.isNaN(parsed)) return acc + parsed;
          return acc + 1; // fallback
        }, 0);
        if (mounted) setTotalPieces(sum);
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

  // small recent list
  const [recentList, setRecentList] = useState<Record<string, unknown>[]>([]);
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const resp = await repairIssueList({ page: 1, page_size: 5 });
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
      <PreviousBackButton />
      <VouchersHeader
        title="Issues"
        description="Issue tracking and repair issues overview."
        subLinks={[
          { label: "Overview", href: "/vouchers/issues/overview" },
          { label: "List", href: "/vouchers/issues/list" },
          { label: "Add New", href: "/vouchers/issues/add" },
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {loading ? "—" : (aggregates.total ?? "—")}
            </div>
            <p className="text-sm text-muted-foreground">
              All repair issues recorded in NSJ.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total pieces</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-emerald-600">
              {totalPieces === null ? (loading ? "—" : "—") : totalPieces}
            </div>
            <p className="text-sm text-muted-foreground">
              Sum of pieces for recent issues (fallback to 1 per record).
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
          <CardTitle>Recent issues</CardTitle>
          <CardDescription>
            Latest repair issues added to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No issues available yet. Create one to get started.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recentList.map((v: Record<string, unknown>) => (
                <li
                  key={v.id as string}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {(v.tag_no as string) ?? "Unnamed"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {v.item_name
                        ? typeof v.item_name === "object" &&
                          v.item_name !== null
                          ? (((v.item_name as Record<string, unknown>)
                              .name as string) ?? String(v.item_name))
                          : String(v.item_name)
                        : "—"}
                      {v.unit || v.net_wt ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          · {(v.unit as string) ?? ""}
                          {v.net_wt ? ` ${String(v.net_wt)}` : ""}
                        </span>
                      ) : null}
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
        <CardFooter className="justify-end">
          <Link href="/vouchers/issues/list" className="text-sm text-primary">
            See all issues
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
