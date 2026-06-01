"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SalesLeadsHeader } from "@/components/vouchers/SalesLeadsHeader";
import Link from "next/link";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import {
  getSalesQueriesStats,
  getSalesQueries,
  SalesQuery,
} from "@/lib/backend";

export default function SalesQueriesOverviewPage() {
  const [stats, setStats] = useState({ total_queries: 0, active_queries: 0 });
  const [recentQueries, setRecentQueries] = useState<SalesQuery[]>([]);

  useEffect(() => {
    getSalesQueriesStats().then(setStats).catch(console.error);
    getSalesQueries({ page_size: 5 })
      .then((res) => setRecentQueries(res.results))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-8">
      <PreviousBackButton />
      <SalesLeadsHeader
        title="Sales Leads Overview"
        description="Monitor sales inquiries and manage client requests."
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.total_queries}</div>
            <p className="text-sm text-muted-foreground">
              All time sales leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-amber-600">
              {stats.active_queries}
            </div>
            <p className="text-sm text-muted-foreground">
              Leads awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Link
                href="/vouchers/sales-queries/list"
                className="text-sm text-primary"
              >
                View all leads
              </Link>
              <Link
                href="/vouchers/sales-queries/new"
                className="text-sm text-primary"
              >
                Create new lead
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Recent Queries</CardTitle>
          <CardDescription>
            Latest inquiries added to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentQueries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No queries found.</p>
          ) : (
            <div className="space-y-4">
              {recentQueries.map((query) => (
                <div
                  key={query.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">
                      {String(query.account?.name || query.account_id)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {query.order_date}
                    </p>
                  </div>
                  <Link href={`/vouchers/sales-queries/${query.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Link
            href="/vouchers/sales-queries/list"
            className="text-sm text-primary"
          >
            See all leads
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
