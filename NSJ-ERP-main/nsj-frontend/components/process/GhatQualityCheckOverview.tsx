"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GhatQualityCheckHeader } from "./GhatQualityCheckHeader";
import { ghatQualityCheckList, type GhatQualityCheck } from "@/lib/backend";
import { FileText, TrendingUp, Clock, Plus } from "lucide-react";

export function GhatQualityCheckOverview() {
  const [stats, setStats] = useState({ total_records: 0, recent_count: 0 });
  const [recentRecords, setRecentRecords] = useState<GhatQualityCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get total count
        const listResponse = await ghatQualityCheckList({
          page: 1,
          page_size: 1,
        });
        const totalCount =
          (listResponse.total as number) || (listResponse.count as number) || 0;

        // Get recent records (last 5)
        const recentResponse = await ghatQualityCheckList({
          page: 1,
          page_size: 5,
        });
        const recentItems = recentResponse.items || [];

        setStats({
          total_records: totalCount,
          recent_count: recentItems.length,
        });
        setRecentRecords(recentItems);
      } catch (error) {
        console.error("Failed to load overview data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <GhatQualityCheckHeader
        title="Ghat Quality Check Overview"
        description="Monitor and manage ghat quality check processes"
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded"></div>
            ) : (
              <>
                <div className="text-2xl font-semibold">
                  {stats.total_records}
                </div>
                <p className="text-sm text-muted-foreground">
                  All time records
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded"></div>
            ) : (
              <>
                <div className="text-2xl font-semibold text-blue-600">
                  {stats.recent_count}
                </div>
                <p className="text-sm text-muted-foreground">Recently added</p>
              </>
            )}
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
                className="text-sm text-primary hover:underline"
              >
                View all records
              </Link>
              <Link
                href="/process/ghat-quality-check/add"
                className="text-sm text-primary hover:underline"
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
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading recent records...
            </p>
          ) : recentRecords.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No records found. Create your first record to get started.
              </p>
              <Link
                href="/process/ghat-quality-check/add"
                className="mt-4 inline-block"
              >
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Record
                </Button>
              </Link>
            </div>
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
                  <div className="flex gap-2">
                    {record.carry_forward_image_url && (
                      <a
                        href={record.carry_forward_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View Image
                      </a>
                    )}
                    <Link
                      href={`/process/ghat-quality-check/${record.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
              <div className="pt-4">
                <Link href="/process/ghat-quality-check/list">
                  <Button variant="outline" size="sm">
                    View All Records
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
