"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  preRhodiumQualityCheckDetail,
  type PreRhodiumQualityCheck,
} from "@/lib/backend";
import {
  ArrowLeft,
  Edit,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Hash,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { PreRhodiumQualityCheckHeader } from "@/components/process/PreRhodiumQualityCheckHeader";

interface PreRhodiumQualityCheckDetailProps {
  id: string;
}

export function PreRhodiumQualityCheckDetail({
  id,
}: PreRhodiumQualityCheckDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [record, setRecord] = useState<PreRhodiumQualityCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecord();
  }, [id]);

  const loadRecord = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await preRhodiumQualityCheckDetail(id);
      setRecord(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load record");
      console.error("Failed to load record:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-muted-foreground">Loading record details...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-xl font-semibold">Record Not Found</h2>
          <p className="text-muted-foreground">
            {error || "The requested record could not be found."}
          </p>
        </div>
        <Link href="/process/pre-rhodium-quality-check/list">
          <Button>Back to List</Button>
        </Link>
      </div>
    );
  }

  const isLocked =
    searchParams.get("locked") === "true" || record.is_draft === false;
  const allImages: any[] = (record as any).images || [];
  const selectedLog = (record as any).selected_log_group;
  const finalImages = selectedLog
    ? allImages.filter((img: any) => img.log_group === selectedLog)
    : [];

  return (
    <div className="space-y-6">
      <PreRhodiumQualityCheckHeader
        title="Pre-Rhodium Quality Check Details"
        description="View detailed information about this quality check record"
      />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CardTitle>Record Information</CardTitle>
              {isLocked && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-300 rounded-full text-xs font-medium text-gray-600">
                  <Lock className="h-3 w-3" />
                  Locked
                </div>
              )}
            </div>
            {!isLocked && (
              <Link
                href={`/process/pre-rhodium-quality-check/edit/${record.id}`}
              >
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Information */}
          <div>
            <h3 className="text-lg font-medium mb-3">Order Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Order ID:</span>
                <span className="text-sm">
                  {record.account_order_id || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Created:</span>
                <span className="text-sm">
                  {new Date(record.created_at || "").toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quality Check Status */}
          <div>
            <h3 className="text-lg font-medium mb-3">Quality Check Status</h3>
            <div className="flex items-center gap-3">
              <Badge
                variant={record.quality_check ? "default" : "destructive"}
                className="text-base py-1 px-3"
              >
                {record.quality_check ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Passed
                  </>
                ) : (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Failed
                  </>
                )}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Quality check {record.quality_check ? "passed" : "failed"}
              </span>
            </div>
          </div>

          {/* Final Selected Images */}
          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Final Selected Images
            </h3>
            {finalImages.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {finalImages.map((img: any, idx: number) => {
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
              <p className="text-sm text-muted-foreground">
                No final log selected.{" "}
                <span className="text-amber-600">
                  Open edit, select a final log and save.
                </span>
              </p>
            )}
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Record ID:</span> {record.id}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>{" "}
                {new Date(
                  record.updated_at || record.created_at || ""
                ).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
