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
import { ThreeDPrintingCAMHeader } from "@/components/process/ThreeDPrintingCAMHeader";
import Link from "next/link";
import { threeDPrintingCAMList, type ThreeDPrintingCAM } from "@/lib/backend";

export default function ThreeDPrintingCAMOverviewPage() {
  const [stats, setStats] = useState({
    total_records: 0,
    recent_records_count: 0,
  });
  const [recentRecords, setRecentRecords] = useState<ThreeDPrintingCAM[]>([]);

  useEffect(() => {
    // Load statistics and recent records
    const loadData = async () => {
      try {
        const [recordsRes] = await Promise.all([
          threeDPrintingCAMList({ page_size: 100 }), // Get all to calculate stats
        ]);

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
      }
    };

    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <ThreeDPrintingCAMHeader
        title="3D Printing/CAM Piece Overview"
        description="Manage 3D printing and CAM piece records with images."
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.total_records}</div>
            <p className="text-sm text-muted-foreground">
              All time CAM piece records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-blue-600">
              {stats.recent_records_count}
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
              {recentRecords.filter((r) => r.cam_piece_image_url).length}
            </div>
            <p className="text-sm text-muted-foreground">
              Records with images uploaded
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Recent CAM Pieces</CardTitle>
          <CardDescription>
            Latest CAM piece records added to the system.
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
                      {new Date(record.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {record.cam_piece_image_url && (
                      <a
                        href={record.cam_piece_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View Image
                      </a>
                    )}
                    <Link href={`/process/3d-printing-cam/detail/${record.id}`}>
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
            href="/process/3d-printing-cam/list"
            className="text-sm text-primary"
          >
            See all records
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
