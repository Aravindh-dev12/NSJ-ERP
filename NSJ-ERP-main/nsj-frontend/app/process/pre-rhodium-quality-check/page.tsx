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
import { PreRhodiumQualityCheckHeader } from "@/components/process/PreRhodiumQualityCheckHeader";
import Link from "next/link";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import {
  preRhodiumQualityCheckOverview,
  preRhodiumQualityCheckList,
  type PreRhodiumQualityCheck,
} from "@/lib/backend";

export default function PreRhodiumQualityCheckOverviewPage() {
  const [stats, setStats] = useState({ total_records: 0, recent_activity: 0 });
  const [recentRecords, setRecentRecords] = useState<PreRhodiumQualityCheck[]>(
    []
  );

  useEffect(() => {
    preRhodiumQualityCheckOverview().then(setStats).catch(console.error);
    preRhodiumQualityCheckList({ page_size: 5 })
      .then((res) => setRecentRecords(res.results || res.items || []))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-8">
      <PreviousBackButton />
      <PreRhodiumQualityCheckHeader
        title="Pre-Rhodium Quality Check Overview"
        description="Monitor and manage pre-rhodium quality check process."
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.total_records}</div>
            <p className="text-sm text-muted-foreground">
              All time quality check records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-amber-600">
              {stats.recent_activity}
            </div>
            <p className="text-sm text-muted-foreground">
              Last 7 days activity
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
                href="/process/pre-rhodium-quality-check/list"
                className="text-sm text-primary"
              >
                View all records
              </Link>
              <Link
                href="/process/pre-rhodium-quality-check/add"
                className="text-sm text-primary"
              >
                Create new record
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Recent Records</CardTitle>
          <CardDescription>
            Latest pre-rhodium quality check records added to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">No records found.</p>
          ) : (
            <div className="space-y-4">
              {recentRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">
                      {record.account_order_id || "No Order ID"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created:{" "}
                      {new Date(record.created_at || "").toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/process/pre-rhodium-quality-check/detail/${record.id}`}
                  >
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
            href="/process/pre-rhodium-quality-check/list"
            className="text-sm text-primary"
          >
            See all records
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
