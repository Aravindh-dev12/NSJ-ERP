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
import { GhatQualityCheckHeader } from "@/components/process/GhatQualityCheckHeader";
import Link from "next/link";
import {
  ghatQualityCheckOverview,
  ghatQualityCheckList,
  type GhatQualityCheck,
} from "@/lib/backend";

export default function GhatQualityCheckOverviewPage() {
  const [stats, setStats] = useState({
    total_records: 0,
    recent_activity: 0,
    latest_records: [] as GhatQualityCheck[],
  });

  useEffect(() => {
    // Load overview data
    ghatQualityCheckOverview()
      .then((response) => {
        setStats((prev) => ({
          ...prev,
          total_records: response.total_records || 0,
          recent_activity: response.recent_activity || 0,
        }));
      })
      .catch(console.error);

    // Load recent records
    ghatQualityCheckList({ page_size: 5 })
      .then((res) => {
        setStats((prev) => ({
          ...prev,
          latest_records: res.results || res.items || [],
        }));
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-8">
      <GhatQualityCheckHeader
        title="Ghat Quality Check Overview"
        description="Monitor and manage ghat quality check process."
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
                href="/process/ghat-quality-check/list"
                className="text-sm text-primary"
              >
                View all records
              </Link>
              <Link
                href="/process/ghat-quality-check/add"
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
            Latest ghat quality check records added to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.latest_records.length === 0 ? (
            <p className="text-sm text-muted-foreground">No records found.</p>
          ) : (
            <div className="space-y-4">
              {stats.latest_records.map((record) => (
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
                    {record.carry_forward_image_url && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Has carry-forward image
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/process/ghat-quality-check/detail/${record.id}`}
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
            href="/process/ghat-quality-check/list"
            className="text-sm text-primary"
          >
            See all records
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
