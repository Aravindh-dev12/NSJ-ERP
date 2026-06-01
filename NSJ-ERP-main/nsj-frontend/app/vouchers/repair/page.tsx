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
import { repairList, type Voucher } from "@/lib/backend";

export default function RepairOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState<number | null>(null);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    void (async () => {
      try {
        const resp = await repairList({ page: 1, page_size: 1000 });
        if (!mounted) return;
        const count =
          typeof resp.count === "number"
            ? resp.count
            : (resp.results ?? resp.items ?? []).length;
        setTotal(count);
        setRecent((resp.results ?? resp.items ?? []).slice(0, 5));
      } catch {
        if (!mounted) return;
        setTotal(null);
        setRecent([]);
      } finally {
        if (mounted) setLoading(false);
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
        title="Repairs overview"
        description="Overview of repairs and quick access to create page."
        subLinks={[
          { label: "Overview", href: "/vouchers/repair" },
          { label: "List", href: "/vouchers/repair/list" },
          { label: "Add New", href: "/vouchers/repair/new" },
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total repairs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {loading ? "—" : (total ?? "—")}
            </div>
            <p className="text-sm text-muted-foreground">All repair records.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold  text-emerald-600">
              {loading ? "—" : (recent.length ?? "—")}
            </div>
            <p className="text-sm text-muted-foreground">Most recent repairs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Link
                href="/vouchers/repair/list"
                className="text-sm text-primary"
              >
                See all repairs
              </Link>
              <Link
                href="/vouchers/repair/new"
                className="text-sm text-primary"
              >
                Create new repair
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
