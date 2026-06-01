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
import { ThreeDDesignHeader } from "@/components/process/ThreeDDesignHeader";
import Link from "next/link";
import { threeDDesignList, type ThreeDDesign } from "@/lib/backend";

export default function ThreeDDesignOverviewPage() {
  const [stats, setStats] = useState({
    total_records: 0,
    recent_records_count: 0,
  });
  const [recentRecords, setRecentRecords] = useState<ThreeDDesign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load statistics and recent records
    const loadData = async () => {
      try {
        const recordsRes = await threeDDesignList({ page_size: 100 }); // Get all to calculate stats

        const allRecords = recordsRes.results || [];

        setStats({
          total_records: allRecords.length,
          recent_records_count: Math.min(5, allRecords.length), // Last 5 as recent
        });

        // Get recent records (last 5)
        const recent = allRecords.slice(0, 5);
        setRecentRecords(recent);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <ThreeDDesignHeader
        title="3D Design Overview"
        description="Manage 3D design records with images and specifications."
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
              All time 3D design records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-blue-600">
              {loading ? "..." : stats.recent_records_count}
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
                : recentRecords.filter((r) => r.design_image_url).length}
            </div>
            <p className="text-sm text-muted-foreground">
              Records with images uploaded
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Recent 3D Designs</CardTitle>
          <CardDescription>
            Latest 3D design records added to the system.
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
                      Created:{" "}
                      {record.created_at
                        ? new Date(record.created_at).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {record.design_image_url && (
                      <a
                        href={record.design_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View Image
                      </a>
                    )}
                    <Link href={`/process/3d-design/detail/${record.id}`}>
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
          <Link href="/process/3d-design/list" className="text-sm text-primary">
            See all records
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
