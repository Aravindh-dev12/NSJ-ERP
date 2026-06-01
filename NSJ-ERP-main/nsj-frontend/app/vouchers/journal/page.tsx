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
import { journalOverview } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function JournalOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    total_count?: number;
    total_dr?: number;
    total_cr?: number;
    running_balance?: number;
    recent?: any[];
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    void (async () => {
      try {
        const resp = await journalOverview();
        if (mounted) setData(resp ?? null);
      } catch {
        if (mounted) setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = [
    {
      label: "Total Count",
      value: data?.total_count ?? 0,
      desc: "All journal records",
    },
    {
      label: "Total DR",
      value: `₹${(data?.total_dr ?? 0).toLocaleString("en-IN")}`,
      desc: "Total debit amount",
    },
    {
      label: "Total CR",
      value: `₹${(data?.total_cr ?? 0).toLocaleString("en-IN")}`,
      desc: "Total credit amount",
    },
    {
      label: "Balance",
      value: `₹${(data?.running_balance ?? 0).toLocaleString("en-IN")}`,
      desc: "Current running balance",
    },
  ];

  return (
    <div className="space-y-8">
      <PreviousBackButton />
      <SalesHeader
        title="Journal overview"
        description="Monitor journal entries and create new journals."
        links={[
          { label: "Overview", href: "/vouchers/journal" },
          { label: "List", href: "/vouchers/journal/list" },
          { label: "Add New", href: "/vouchers/journal/new" },
        ]}
      />

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Card key={i} className="border-rose-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-900">
                {loading ? "—" : s.value}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-medium">
                {s.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-rose-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent journals</CardTitle>
            <CardDescription>
              The last 5 journal vouchers created.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !data?.recent || data.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground p-8 text-center border border-dashed rounded-lg">
                No recent journals found.
              </p>
            ) : (
              <div className="overflow-hidden rounded-md border border-rose-50">
                <table className="w-full text-sm">
                  <thead className="bg-rose-50/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-rose-900">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-rose-900">
                        Voucher No
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-rose-900">
                        Party
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-rose-900">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-50">
                    {data.recent.map((r) => {
                      const partyVal =
                        r.party_name ||
                        r.account_name ||
                        r.party ||
                        r.account ||
                        "—";
                      const partyName =
                        typeof partyVal === "object"
                          ? partyVal.account_name || partyVal.name || "—"
                          : partyVal;
                      return (
                        <tr
                          key={r.id}
                          className="hover:bg-rose-50/20 transition-colors"
                        >
                          <td className="px-4 py-3 text-muted-foreground tabular-nums">
                            {r.date || "—"}
                          </td>
                          <td className="px-4 py-3 font-bold text-rose-800">
                            {r.voucher_no || "—"}
                          </td>
                          <td className="px-4 py-3 font-medium">{partyName}</td>
                          <td className="px-4 py-3 text-right font-black text-rose-600 tabular-nums">
                            ₹
                            {(r.dr || r.total || 0).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-end border-t border-rose-50 bg-rose-50/20 px-6 py-3">
            <Link
              href="/vouchers/journal/list"
              className="text-xs font-bold text-rose-700 uppercase tracking-widest hover:underline"
            >
              View Full List →
            </Link>
          </CardFooter>
        </Card>

        <Card className="border-rose-100 shadow-sm bg-gradient-to-br from-white to-rose-50/30">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/vouchers/journal/new" className="block">
              <Button className="w-full bg-rose-600 hover:bg-rose-700 shadow-md transform active:scale-95 transition-all font-bold">
                + Create New Voucher
              </Button>
            </Link>
            <Link href="/vouchers/journal/list" className="block">
              <Button
                variant="outline"
                className="w-full border-rose-200 text-rose-700 hover:bg-rose-50 font-bold"
              >
                Go to Record List
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
