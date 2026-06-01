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
import { purReturnOverview, purReturnList, type Voucher } from "@/lib/backend";

export default function PurReturnOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<{
    total_count?: number;
    total_piece?: number;
    total_value?: number;
    recent?: Voucher[];
  }>({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    void (async () => {
      try {
        const resp = await purReturnOverview();
        if (!mounted) return;
        setOverview(resp as any);
      } catch {
        if (mounted) setOverview({});
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const recent = overview.recent ?? [];

  return (
    <div className="space-y-8">
      <PreviousBackButton />
      <SalesHeader
        title="Pur. Return overview"
        description="Monitor purchase returns at a glance and jump into detailed management."
        links={[
          { label: "Overview", href: "/vouchers/pur-return" },
          { label: "List", href: "/vouchers/pur-return/list" },
          { label: "Add New", href: "/vouchers/pur-return/add-new" },
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Pur. Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {loading ? "—" : (overview.total_count ?? "—")}
            </div>
            <p className="text-sm text-muted-foreground">
              All purchase returns recorded.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Piece</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-emerald-600">
              {loading ? "—" : (overview.total_piece ?? "—")}
            </div>
            <p className="text-sm text-muted-foreground">
              Total pieces for purchase returns.
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
                href="/vouchers/pur-return/list"
                className="text-sm text-primary"
              >
                See all Pur. Returns
              </Link>
              <Link
                href="/vouchers/pur-return/add-new"
                className="text-sm text-primary"
              >
                Create new Pur. Return
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Recent Pur. Returns</CardTitle>
          <CardDescription>
            Latest purchase returns added to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No purchase returns available yet. Create one to get started.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((v: any) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {String(v.tag_no ?? v.order_no ?? v.id)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {String(
                        (v.item_name &&
                          (typeof v.item_name === "object"
                            ? v.item_name.name
                            : v.item_name)) ??
                          "—"
                      )}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary">
                    {v.account && typeof v.account === "object"
                      ? (v.account.account_name ?? v.account.name ?? "")
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
          <Link
            href="/vouchers/pur-return/list"
            className="text-sm text-primary"
          >
            See all Pur. Returns
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
