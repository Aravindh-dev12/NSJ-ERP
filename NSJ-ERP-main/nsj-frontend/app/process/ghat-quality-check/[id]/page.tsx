"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GhatQualityCheckHeader } from "@/components/process/GhatQualityCheckHeader";
import {
  ghatQualityCheckDetail,
  ghatQualityCheckDelete,
  type GhatQualityCheck,
} from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Trash2, Loader2, FileText } from "lucide-react";
import { OrderDetailsDisplay } from "@/components/OrderDetailsDisplay";

export default function GhatQualityCheckDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [record, setRecord] = useState<GhatQualityCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadRecord = async () => {
      try {
        const data = await ghatQualityCheckDetail(params.id);
        setRecord(data);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load record details",
        });
        router.push("/process/ghat-quality-check/list");
      } finally {
        setLoading(false);
      }
    };
    loadRecord();
  }, [params.id, router, toast]);

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this record? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      await ghatQualityCheckDelete(params.id);
      toast({
        title: "Success",
        description: "Record deleted successfully",
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
          title="Record Details"
          description="Loading record details..."
        />
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
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
          description="The requested record could not be found"
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Record not found</p>
            <Link href="/process/ghat-quality-check/list" className="mt-4">
              <Button>Back to List</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back to List button - Top Left */}
      <Link href="/process/ghat-quality-check/list">
        <Button variant="ghost" size="sm" className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>
      </Link>

      <GhatQualityCheckHeader
        title="Ghat Quality Check Details"
        description="View and manage record details"
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Record Details</CardTitle>
              <CardDescription>ID: {record.id}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Link href={`/process/ghat-quality-check/${record.id}/edit`}>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Basic Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-medium">
                    {record.account_order_id || "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <p className="font-medium">
                    {record.created_at
                      ? new Date(record.created_at).toLocaleString()
                      : "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {record.updated_at
                      ? new Date(record.updated_at).toLocaleString()
                      : "Not available"}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Attachments</h3>
              <div className="space-y-3">
                {record.carry_forward_image_url ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Carry-Forward Image
                    </p>
                    <a
                      href={record.carry_forward_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      View Image
                    </a>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No images attached</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t">
            <div className="flex justify-end gap-3">
              <Link href={`/process/ghat-quality-check/${record.id}/edit`}>
                <Button>Edit Record</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
