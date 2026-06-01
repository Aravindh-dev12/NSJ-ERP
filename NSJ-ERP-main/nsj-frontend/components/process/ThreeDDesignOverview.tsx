"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { threeDDesignList } from "@/lib/backend";
import { type ThreeDDesign } from "@/lib/backend";
import Link from "next/link";

export function ThreeDDesignOverview() {
  const [designs, setDesigns] = useState<ThreeDDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const designsRes = await threeDDesignList({ page: 1, page_size: 5 });
        setDesigns(designsRes.results || []);
        setTotalCount(designsRes.count || designsRes.results?.length || 0);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  const designsWithImages = designs.filter(
    (d) => d.design_image_url || d.approved_design_image_url
  ).length;
  const approvedDesigns = designs.filter(
    (d) => d.approved_design_image_url
  ).length;
  const completionRate =
    totalCount > 0 ? Math.round((approvedDesigns / totalCount) * 100) : 0;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Designs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalCount}</div>
            <p className="text-sm text-muted-foreground">All time designs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>With Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{designsWithImages}</div>
            <p className="text-sm text-muted-foreground">Designs with images</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">
              {approvedDesigns}
            </div>
            <p className="text-sm text-muted-foreground">Approved designs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{completionRate}%</div>
            <p className="text-sm text-muted-foreground">Approved ratio</p>
          </CardContent>
        </Card>
      </section>

      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Recent Designs</CardTitle>
          <CardDescription>
            Latest 3D designs added to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading designs...</p>
          ) : designs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No designs found.</p>
          ) : (
            <div className="space-y-4">
              {designs.map((design) => (
                <div
                  key={design.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">
                      {design.account_order_id || "No ID"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created:{" "}
                      {new Date(design.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={`/process/3d-design/detail/${design.id}`}>
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
          <Link href="/process/3d-design/list" className="text-sm text-primary">
            See all designs
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
