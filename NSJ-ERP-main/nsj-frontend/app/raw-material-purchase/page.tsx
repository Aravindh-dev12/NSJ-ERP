"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RawMaterialNav } from "@/components/raw-material/RawMaterialNav";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  rawMaterialPurchaseList,
  rawMaterialPurchaseAggregates,
  type QueryValue,
} from "@/lib/backend";

export default function RawMaterialPurchaseOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [aggregates, setAggregates] = useState<{
    total?: number;
    recent_7_days?: number;
    total_value?: number;
  } | null>(null);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    void (async () => {
      try {
        const agg = await rawMaterialPurchaseAggregates();
        if (mounted) setAggregates(agg ?? null);
      } catch {
        if (mounted) setAggregates(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const resp = await rawMaterialPurchaseList({
          page: 1,
          page_size: 5,
        } as Record<string, QueryValue>);
        if (!mounted) return;
        setRecent(resp.results ?? resp.items ?? []);
      } catch {
        if (!mounted) return;
        setRecent([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <PreviousBackButton />
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Raw Material Purchase
          </h1>
          <p className="text-muted-foreground">
            Monitor diamond purchases and create new entries.
          </p>
        </div>
        <RawMaterialNav />
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {loading ? "—" : (aggregates?.total ?? "—")}
            </div>
            <p className="text-sm text-muted-foreground">
              All raw material purchases recorded.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {loading ? "—" : (aggregates?.recent_7_days ?? "—")}
            </div>
            <p className="text-sm text-muted-foreground">
              Purchases created in the last week.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {loading
                ? "—"
                : `₹${aggregates?.total_value?.toLocaleString() ?? "—"}`}
            </div>
            <p className="text-sm text-muted-foreground">
              Total value of all purchases.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent purchases.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {r.dia_id || r.id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.date ?? "—"} • {r.carat ?? "—"} ct
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-primary">
                      {r.supplier?.name ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
          <CardFooter className="justify-end">
            <Link
              href="/raw-material-purchase/list"
              className="text-sm text-primary"
            >
              See all purchases
            </Link>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}
