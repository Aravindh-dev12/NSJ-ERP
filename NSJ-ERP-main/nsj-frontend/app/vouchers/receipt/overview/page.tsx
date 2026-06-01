"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { receiptOverview, receiptList } from "@/lib/backend";

export default function ReceiptOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [aggregates, setAggregates] = useState<any>({});
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const resp = await receiptOverview();
        if (!mounted) return;
        setAggregates(resp as any);
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

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const resp = await receiptList({ page: 1, page_size: 5 });
        if (!mounted) return;
        setRecent((resp.results ?? []) as any[]);
      } catch {
        if (mounted) setRecent([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const displayCount = loading ? "—" : (aggregates.total_count ?? "—");

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total receipts</CardTitle>
            <CardDescription>All receipt records.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{displayCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Dr</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-emerald-600">
              {aggregates.total_dr ?? "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Cr</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-rose-600">
              {aggregates.total_cr ?? "—"}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent receipts</CardTitle>
          <CardDescription>
            Latest receipt entries added to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No receipts available yet.
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
                      {String(r.id)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {String((r.party_name || {}).name ?? r.party_name ?? "—")}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary">
                    Dr: {r.dr ?? 0} Cr: {r.cr ?? 0}
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
