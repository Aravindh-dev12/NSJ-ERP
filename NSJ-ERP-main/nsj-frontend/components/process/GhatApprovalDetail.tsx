"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ghatApprovalDetail,
  ghatApprovalDelete,
  type GhatApproval,
} from "@/lib/backend";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Hash,
  CheckCircle2,
  XCircle,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { GhatApprovalHeader } from "@/components/process/GhatApprovalHeader";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";

interface GhatApprovalDetailProps {
  id: string;
}

export function GhatApprovalDetail({ id }: GhatApprovalDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [record, setRecord] = useState<GhatApproval | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadRecord();
  }, [id]);

  const loadRecord = async () => {
    try {
      const data = await ghatApprovalDetail(id);
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
      "Are you sure you want to delete this Ghat Approval record? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      await ghatApprovalDelete(record.id);
      toast({
        title: "Record Deleted",
        description: "Ghat Approval record has been deleted successfully.",
      });
      router.push("/process/ghat-approval/list");
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
        <GhatApprovalHeader
          title="Ghat Approval Details"
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
        <GhatApprovalHeader
          title="Record Not Found"
          description="The requested record could not be found."
        />
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              No record found with the provided ID.
            </p>
            <Button
              onClick={() => router.push("/process/ghat-approval/list")}
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
  const allImages: any[] = (record as any).images || [];
  const selectedLog = (record as any).selected_log_group;
  const finalImages = selectedLog
    ? allImages.filter((img) => img.log_group === selectedLog)
    : [];

  return (
    <div className="space-y-6">
      <GhatApprovalHeader
        title="Ghat Approval Details"
        description="View detailed information about this ghat approval record"
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
                <Link href={`/process/ghat-approval/edit/${record.id}`}>
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
                  <CheckCircle2 className="h-4 w-4" />
                  Approval Status
                </div>
                {record.ghat_approval ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-700">Approved</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-700">
                      Not Approved
                    </span>
                  </div>
                )}
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
                        alt={`Final ${idx + 1}`}
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

          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => router.push("/process/ghat-approval/list")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
            {!isLocked && (
              <Link href={`/process/ghat-approval/edit/${record.id}`}>
                <Button variant="default">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Record
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
