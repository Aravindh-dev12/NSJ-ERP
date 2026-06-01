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
    total_designs: 0,
    designs_with_images: 0,
    approved_designs: 0,
  });
  const [recentDesigns, setRecentDesigns] = useState<ThreeDDesign[]>([]);

  useEffect(() => {
    // Load statistics and recent designs
    const loadData = async () => {
      try {
        const [designsRes] = await Promise.all([
          threeDDesignList({ page_size: 100 }), // Get all to calculate stats
        ]);

        const allDesigns = designsRes.results || [];
        const designsWithImages = allDesigns.filter(
          (d) => d.design_image_url || d.approved_design_image_url
        ).length;
        const approvedDesigns = allDesigns.filter(
          (d) => d.approved_design_image_url
        ).length;

        setStats({
          total_designs: allDesigns.length,
          designs_with_images: designsWithImages,
          approved_designs: approvedDesigns,
        });

        // Get recent designs (last 5)
        const recent = allDesigns.slice(0, 5);
        setRecentDesigns(recent);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };

    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <ThreeDDesignHeader
        title="3D Design Overview"
        description="Manage 3D design records with images and track approval status."
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Designs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.total_designs}</div>
            <p className="text-sm text-muted-foreground">All time 3D designs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>With Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-blue-600">
              {stats.designs_with_images}
            </div>
            <p className="text-sm text-muted-foreground">
              Designs with images uploaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">
              {stats.approved_designs}
            </div>
            <p className="text-sm text-muted-foreground">Approved designs</p>
          </CardContent>
        </Card>
      </section>

      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Recent 3D Designs</CardTitle>
          <CardDescription>Latest designs added to the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentDesigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No designs found.</p>
          ) : (
            <div className="space-y-4">
              {recentDesigns.map((design) => (
                <div
                  key={design.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">
                      {design.account_order_id || "No Order ID"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created:{" "}
                      {new Date(design.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {design.design_image_url && (
                      <a
                        href={design.design_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View Design
                      </a>
                    )}
                    {design.approved_design_image_url && (
                      <a
                        href={design.approved_design_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-600 hover:underline"
                      >
                        View Approved
                      </a>
                    )}
                    <Link href={`/process/3d-design/detail/${design.id}`}>
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
            See all designs
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
