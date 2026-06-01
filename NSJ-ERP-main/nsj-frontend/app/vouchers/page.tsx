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
import { vouchersList, type Voucher } from "@/lib/backend";

export default function VouchersOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState<number | null>(null);
  const [recent, setRecent] = useState<Voucher[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    void (async () => {
      try {
        const resp = await vouchersList({ page: 1, page_size: 5 });
        if (!mounted) return;
        const count =
          typeof resp.count === "number"
            ? resp.count
            : (resp.results ?? []).length;
        setTotal(count);
        setRecent(resp.results ?? []);
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

  const displayTotal = loading ? "—" : (total ?? "—");

  return (
    <div className="space-y-8">
      <div className="mb-4">
        <PreviousBackButton />
      </div>
      <VouchersHeader
        title="Orders"
        description="Manage orders: create, review status, and keep records tidy."
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{displayTotal}</div>
            <p className="text-sm text-muted-foreground">
              All order records in NSJ.
            </p>
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
            <p className="text-sm text-muted-foreground">Most recent orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Link href="/vouchers/list" className="text-sm text-primary">
                See all orders
              </Link>
              <Link href="/vouchers/new" className="text-sm text-primary">
                Create new order
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>Latest orders added to the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No orders available yet. Create one to get started.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {String(order.bill_no ?? order.id ?? "Unnamed")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {String(order.item_name ?? "—")}
                      {order.date ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          · {new Date(order.date).toLocaleDateString()}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary">
                    {order.account && typeof order.account === "object"
                      ? ((order.account as any).account_name ??
                        (order.account as any).name ??
                        "")
                      : typeof order.account === "string"
                        ? order.account
                        : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Link href="/vouchers/list" className="text-sm text-primary">
            See all orders
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
