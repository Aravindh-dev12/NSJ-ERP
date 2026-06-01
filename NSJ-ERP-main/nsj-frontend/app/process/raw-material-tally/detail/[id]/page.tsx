"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackToListButton } from "@/components/ui/back-to-list-button";
import { RawMaterialTallyHeader } from "@/components/process/RawMaterialTallyHeader";
import { rawMaterialTallyDetail, type RawMaterialTally } from "@/lib/backend";
import {
  Calendar,
  Image as ImageIcon,
  Download,
  Lock,
  CheckCircle2,
} from "lucide-react";

export default function RawMaterialTallyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [record, setRecord] = useState<RawMaterialTally | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecord = async () => {
      try {
        const { id } = await params;
        const recordData = await rawMaterialTallyDetail(id);
        setRecord(recordData);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load record details";
        setError(errorMessage);
        console.error("Error loading record:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRecord();
  }, [params]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">
          Loading record details...
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-destructive text-lg font-medium">
            {error || "Record not found"}
          </div>
          <Button
            onClick={() => router.push("/process/raw-material-tally/list")}
          >
            Back to List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackToListButton href="/process/raw-material-tally/list" />

      <RawMaterialTallyHeader
        title="Raw Material Tally Details"
        description="View detailed information for raw material tally record"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Record Information */}
          <Card>
            <CardHeader>
              <CardTitle>Record Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Record ID
                  </label>
                  <div className="mt-1 font-mono text-sm">{record.id}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Order ID
                  </label>
                  <div className="mt-1 font-medium">
                    {record.account_order_id || "N/A"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Created Date
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {record.created_at
                      ? new Date(record.created_at).toLocaleDateString()
                      : "N/A"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {record.updated_at
                      ? new Date(record.updated_at).toLocaleDateString()
                      : "N/A"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Raw Material Movement */}
          <Card>
            <CardHeader>
              <CardTitle>Raw Material Movement</CardTitle>
            </CardHeader>
            <CardContent>
              {record.raw_material_movement &&
              record.raw_material_movement.length > 0 ? (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-3 text-left text-sm font-medium">
                          Material
                        </th>
                        <th className="p-3 text-left text-sm font-medium">
                          Quantity
                        </th>
                        <th className="p-3 text-left text-sm font-medium">
                          Unit
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {record.raw_material_movement.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-3">{item.material || "N/A"}</td>
                          <td className="p-3">{item.quantity ?? "N/A"}</td>
                          <td className="p-3">{item.unit || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No material movement data available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {searchParams.get("locked") !== "true" &&
            record.is_draft !== false && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(
                        `/process/raw-material-tally/edit/${record.id}`
                      )
                    }
                  >
                    Edit Record
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push("/process/raw-material-tally/list")
                    }
                  >
                    View All Records
                  </Button>
                </CardContent>
              </Card>
            )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Carry-Forward Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Carry-Forward Image
              </CardTitle>
              {(searchParams.get("locked") === "true" ||
                record.is_draft === false) && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-300 rounded-full text-xs font-medium text-gray-600 w-fit mt-2">
                  <Lock className="h-3 w-3" />
                  Locked
                </div>
              )}
            </CardHeader>
            <CardContent>
              {(() => {
                const allImgs: any[] = (record as any).images || [];
                const selLog = (record as any).selected_log_group;
                const finalImgs = selLog
                  ? allImgs.filter((img: any) => img.log_group === selLog)
                  : [];
                return finalImgs.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-2">
                    {finalImgs.map((img: any, idx: number) => {
                      const src = img.image_url || img.image;
                      return src ? (
                        <img
                          key={img.id || idx}
                          src={src}
                          alt={`Final ${idx + 1}`}
                          className="h-24 w-24 rounded-lg object-cover border-2 border-green-400 cursor-pointer hover:opacity-80"
                          onClick={() => window.open(src, "_blank")}
                        />
                      ) : null;
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No final log selected.</p>
                    <p className="text-xs text-amber-600 mt-1">
                      Open edit, select a final log and save.
                    </p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Image</span>
                <Badge
                  variant={record.images?.length ? "default" : "secondary"}
                >
                  {record.images?.length ? "Uploaded" : "Not Uploaded"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Materials</span>
                <Badge variant="outline">
                  {record.raw_material_movement?.length || 0} items
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
