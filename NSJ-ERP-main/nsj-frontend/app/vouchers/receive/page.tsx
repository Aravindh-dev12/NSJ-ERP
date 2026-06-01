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
import { receiveOverview, receiveList, type Identifier } from "@/lib/backend";

export default function ReceiveOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [aggregates, setAggregates] = useState<any>({});
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const resp = await receiveOverview();
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
        const resp = await receiveList({ page: 1, page_size: 5 });
        if (!mounted) return;
        setRecent(resp.results ?? []);
      } catch {
        if (mounted) setRecent([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const displayTotal = loading ? "—" : (aggregates.total_count ?? "—");
  const displayPieces = loading ? "—" : (aggregates.total_piece ?? "—");

  return (
    <div className="space-y-8">
      <PreviousBackButton />
      <SalesHeader
        title="Receive overview"
        description="Monitor receives at a glance."
        links={[
          { label: "Overview", href: "/vouchers/receive" },
          { label: "List", href: "/vouchers/receive/list" },
          { label: "Add New", href: "/vouchers/receive/new" },
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total receive entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{displayTotal}</div>
            <p className="text-sm text-muted-foreground">
              All receive records.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Pcs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-emerald-600">
              {displayPieces}
            </div>
            <p className="text-sm text-muted-foreground">
              Sum of pieces in receive entries.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Link
                href="/vouchers/receive/list"
                className="text-sm text-primary"
              >
                See all receives
              </Link>
              <Link
                href="/vouchers/receive/new"
                className="text-sm text-primary"
              >
                Create new receive
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent receives</CardTitle>
          <CardDescription>
            Latest receive entries added to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No receives available yet.
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
                      {String(r.tag_no ?? r.id)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {String(r.item_name ?? "—")}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary">
                    {r.account && typeof r.account === "object"
                      ? (r.account.account_name ?? r.account.name)
                      : r.account}
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
