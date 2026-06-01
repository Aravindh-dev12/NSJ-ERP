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
import { GhatApprovalHeader } from "@/components/process/GhatApprovalHeader";
import Link from "next/link";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import {
  ghatApprovalOverview,
  ghatApprovalList,
  type GhatApproval,
} from "@/lib/backend";

export default function GhatApprovalOverviewPage() {
  const [stats, setStats] = useState({
    total_records: 0,
    recent_activity: 0,
    approved_count: 0,
    latest_records: [] as GhatApproval[],
  });

  useEffect(() => {
    // Load overview data
    ghatApprovalOverview()
      .then((response) => {
        setStats((prev) => ({
          ...prev,
          total_records: response.total_records || 0,
          recent_activity: response.recent_activity || 0,
          approved_count: response.approved_count || 0,
        }));
      })
      .catch(console.error);

    // Load recent records
    ghatApprovalList({ page_size: 5 })
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
      <PreviousBackButton />
      <GhatApprovalHeader
        title="Ghat Approval Overview"
        description="Monitor and manage ghat approval process."
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.total_records}</div>
            <p className="text-sm text-muted-foreground">
              All time approval records
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
            <CardTitle>Approved Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">
              {stats.approved_count}
            </div>
            <p className="text-sm text-muted-foreground">
              Total approved approvals
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Recent Records</CardTitle>
          <CardDescription>
            Latest ghat approval records added to the system.
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
                      Approval:{" "}
                      {record.ghat_approval ? "✓ Approved" : "✗ Not Approved"}
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
                  <Link href={`/process/ghat-approval/detail/${record.id}`}>
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
            href="/process/ghat-approval/list"
            className="text-sm text-primary"
          >
            See all records
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
