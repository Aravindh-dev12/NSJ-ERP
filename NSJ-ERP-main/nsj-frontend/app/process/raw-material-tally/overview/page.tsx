"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RawMaterialTallyHeader } from "@/components/process/RawMaterialTallyHeader";
import Link from "next/link";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import {
  rawMaterialTallyOverview,
  rawMaterialTallyList,
  type RawMaterialTally,
} from "@/lib/backend";

export default function RawMaterialTallyOverviewPage() {
  const [stats, setStats] = useState({ total_records: 0, recent_activity: 0 });
  const [recentRecords, setRecentRecords] = useState<RawMaterialTally[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to get overview data from API
        let overviewData;
        try {
          overviewData = await rawMaterialTallyOverview();
        } catch {
          // Fallback: fetch from list API
          const recordsRes = await rawMaterialTallyList({ page_size: 100 });
          const allRecords = recordsRes.results || [];
          const count = (recordsRes.count as number) || allRecords.length;
          overviewData = {
            total_records: count,
            recent_activity: allRecords.length,
            recent_records: allRecords.slice(0, 5) as RawMaterialTally[],
          };
        }

        setStats({
          total_records: overviewData.total_records,
          recent_activity: overviewData.recent_activity,
        });
        setRecentRecords(overviewData.recent_records || []);
      } catch (err) {
        console.error("Failed to load data:", err);
        // Fallback to list API if overview fails
        try {
          const recordsRes = await rawMaterialTallyList({ page_size: 100 });
          const allRecords = recordsRes.results || [];
          const count = (recordsRes.count as number) || allRecords.length;
          setStats({
            total_records: count,
            recent_activity: allRecords.length,
          });
          setRecentRecords(
            (allRecords.slice(0, 5) as RawMaterialTally[]) || []
          );
        } catch (listErr) {
          console.error("Failed to load list data:", listErr);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <PreviousBackButton />
      <RawMaterialTallyHeader
        title="Raw Material Tally Overview"
        description="Track and manage raw material movements with order validation."
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {loading ? "..." : stats.total_records}
            </div>
            <p className="text-sm text-muted-foreground">
              All time raw material tally records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-blue-600">
              {loading ? "..." : stats.recent_activity}
            </div>
            <p className="text-sm text-muted-foreground">
              Recently added records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>With Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">
              {loading
                ? "..."
                : recentRecords.filter((r) => r.carry_forward_image_url).length}
            </div>
            <p className="text-sm text-muted-foreground">
              Records with carry-forward images
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Recent Raw Material Tallies</CardTitle>
          <CardDescription>
            Latest raw material tally records added to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <div className="h-12 w-full bg-muted animate-pulse rounded"></div>
              <div className="h-48 w-full bg-muted animate-pulse rounded"></div>
            </div>
          ) : recentRecords.length === 0 ? (
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
                      Materials:{" "}
                      {record.raw_material_movement &&
                      record.raw_material_movement.length > 0
                        ? record.raw_material_movement
                            .map((m) => m.material)
                            .filter(Boolean)
                            .join(", ") || "N/A"
                        : "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created:{" "}
                      {record.created_at
                        ? new Date(record.created_at).toLocaleDateString()
                        : "N/A"}
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
                      href={`/process/raw-material-tally/detail/${record.id}`}
                    >
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Link
            href="/process/raw-material-tally/list"
            className="text-sm text-primary"
          >
            See all records
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
