"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ghatQualityCheckDetail,
  ghatQualityCheckDelete,
  type GhatQualityCheck,
} from "@/lib/backend";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Hash,
  Lock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { GhatQualityCheckHeader } from "@/components/process/GhatQualityCheckHeader";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";

interface GhatQualityCheckDetailProps {
  id: string;
}

export function GhatQualityCheckDetail({ id }: GhatQualityCheckDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [record, setRecord] = useState<GhatQualityCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadRecord();
  }, [id]);

  const loadRecord = async () => {
    try {
      const data = await ghatQualityCheckDetail(id);
      setRecord(data);
    } catch (error) {
      console.error("Failed to load record:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load record details",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!record) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this Ghat Quality Check record? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      await ghatQualityCheckDelete(record.id);
      toast({
        title: "Record Deleted",
        description: "Ghat Quality Check record has been deleted successfully.",
      });
      router.push("/process/ghat-quality-check/list");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to delete record",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <GhatQualityCheckHeader
          title="Ghat Quality Check Details"
          description="Loading record details..."
        />
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-6">
        <GhatQualityCheckHeader
          title="Record Not Found"
          description="The requested record could not be found."
        />
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              No record found with the provided ID.
            </p>
            <Button
              onClick={() => router.push("/process/ghat-quality-check/list")}
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLocked =
    searchParams.get("locked") === "true" || record.is_draft === false;

  // Get final images from selected log group
  const images: any[] = (record as any).images || [];
  const selectedLog = (record as any).selected_log_group;
  const finalImages = selectedLog
    ? images.filter((img) => img.log_group === selectedLog)
    : [];

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/process/ghat-quality-check/list")}
        className="mb-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to List
      </Button>

      <GhatQualityCheckHeader
        title="Ghat Quality Check Details"
        description="View detailed information about this ghat quality check record"
      />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Record #{record.id}
              </CardTitle>
              {isLocked && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-300 rounded-full text-xs font-medium text-gray-600">
                  <Lock className="h-3 w-3" />
                  Locked
                </div>
              )}
            </div>
            {!isLocked && (
              <div className="flex gap-2">
                <Link href={`/process/ghat-quality-check/edit/${record.id}`}>
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Trash2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Basic Information</h3>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  Account Order ID
                </div>
                <p className="font-medium">
                  {record.account_order_id || "Not specified"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Created At
                </div>
                <p className="font-medium">
                  {record.created_at
                    ? new Date(record.created_at).toLocaleString()
                    : "Not available"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Updated At
                </div>
                <p className="font-medium">
                  {record.updated_at
                    ? new Date(record.updated_at).toLocaleString()
                    : "Not available"}
                </p>
              </div>
            </div>

            {/* Final Images */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
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
                        alt={`Final image ${idx + 1}`}
                        className="h-24 w-24 rounded-lg object-cover border-2 border-green-400 cursor-pointer hover:opacity-80"
                        onClick={() => window.open(src, "_blank")}
                      />
                    ) : null;
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No final log selected.{" "}
                  <span className="text-amber-600">
                    Open edit, select a final log and save.
                  </span>
                </p>
              )}
            </div>
          </div>

          {!isLocked && (
            <div className="flex justify-end pt-6 border-t">
              <Link href={`/process/ghat-quality-check/edit/${record.id}`}>
                <Button variant="default">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Record
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
