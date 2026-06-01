"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  stoneDemandToBaggingDetail,
  stoneDemandToBaggingDelete,
  stoneDemandToBaggingList,
  type StoneDemandToBagging,
} from "@/lib/backend";
import {
  ArrowLeft,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { StoneDemandToBaggingHeader } from "@/components/process/StoneDemandToBaggingHeader";

interface StoneDemandToBaggingDetailProps {
  params: Promise<{ id: string }>;
}

export function StoneDemandToBaggingDetail({
  params,
}: StoneDemandToBaggingDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lockedParam = searchParams.get("locked") === "true";
  const [record, setRecord] = useState<StoneDemandToBagging | null>(null);
  const [relatedRecords, setRelatedRecords] = useState<StoneDemandToBagging[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [id, setId] = useState<string>("");

  useEffect(() => {
    const loadParams = async () => {
      try {
        const { id: resolvedId } = await params;
        setId(resolvedId);

        // Load the specific record
        const data = await stoneDemandToBaggingDetail(resolvedId);
        setRecord(data);

        // Load all related records for the same order - using trimmed ID for better matching
        if (data.account_order_id) {
          const listResponse = await stoneDemandToBaggingList({
            search: data.account_order_id.toString().trim(),
            page: 1,
            page_size: 100,
          });
          const allRecords = listResponse.results || listResponse.items || [];
          setRelatedRecords(allRecords);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load record");
      } finally {
        setLoading(false);
      }
    };

    loadParams();
  }, [params]);

  const handleDelete = async () => {
    if (!id || !confirm("Are you sure you want to delete this record?")) {
      return;
    }

    setDeleting(true);
    try {
      await stoneDemandToBaggingDelete(id);
      router.push("/process/stone-demand-to-bagging/list");
    } catch (err: any) {
      setError(err?.message || "Failed to delete record");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <StoneDemandToBaggingHeader
          title="Stone Demand to Bagging Details"
          description="Loading record details..."
        />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="space-y-6">
        <StoneDemandToBaggingHeader
          title="Stone Demand to Bagging Details"
          description="Record not found"
        />
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error || "Record not found"}
        </div>
        <Link href="/process/stone-demand-to-bagging/list">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </Link>
      </div>
    );
  }

  // Locked if URL param says so OR the record is finalized (not a draft)
  const isLocked = lockedParam || record.is_draft === false;

  return (
    <div className="space-y-6">
      <StoneDemandToBaggingHeader
        title="Stone Demand to Bagging Details"
        description="View detailed information about this record"
      />

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <CardTitle>Record Details</CardTitle>
              {isLocked && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-300 rounded-full text-xs font-medium text-gray-600">
                  <Lock className="h-3 w-3" />
                  Locked
                </div>
              )}
            </div>
            {!isLocked && (
              <div className="flex gap-2">
                <Link
                  href={`/process/stone-demand-to-bagging/edit/${record.id}`}
                >
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
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Record ID
                  </h3>
                  <p className="text-sm">{record.id}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Order ID
                  </h3>
                  <p className="text-sm">
                    {record.account_order_id || "Not provided"}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Created
                  </h3>
                  <p className="text-sm">
                    {record.created_at
                      ? new Date(record.created_at).toLocaleDateString()
                      : "Not available"}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </h3>
                  <p className="text-sm">
                    {record.updated_at
                      ? new Date(record.updated_at).toLocaleDateString()
                      : "Not available"}
                  </p>
                </div>
              </div>
            </div>

            {/* Stone Items Section */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-medium mb-4">Stone Items Details</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-7 gap-2 p-3 bg-muted">
                  <div className="text-sm font-medium">Diamond/Color/Stone</div>
                  <div className="text-sm font-medium">Batch ID</div>
                  <div className="text-sm font-medium">Master Size</div>
                  <div className="text-sm font-medium">Shape</div>
                  <div className="text-sm font-medium">MM Size</div>
                  <div className="text-sm font-medium">No. of Pieces</div>
                  <div className="text-sm font-medium">Est. Carat Weight</div>
                </div>

                {/* Display items from stone_items array if present, otherwise related records, otherwise fallback */}
                {record.stone_items && record.stone_items.length > 0 ? (
                  record.stone_items.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-7 gap-2 p-3 border-t"
                    >
                      <div className="text-sm">
                        {item.diamond_color_stone || "Not provided"}
                      </div>
                      <div className="text-sm">
                        {item.batch_id || "Not provided"}
                      </div>
                      <div className="text-sm">
                        {item.master_size || "Not provided"}
                      </div>
                      <div className="text-sm">
                        {item.shape || "Not provided"}
                      </div>
                      <div className="text-sm">
                        {item.mm_size || "Not provided"}
                      </div>
                      <div className="text-sm">
                        {item.no_of_pieces || "Not provided"}
                      </div>
                      <div className="text-sm">
                        {item.estimated_total_carat_weight || "Not provided"}
                      </div>
                    </div>
                  ))
                ) : relatedRecords.length > 0 ? (
                  relatedRecords.map(
                    (item: StoneDemandToBagging, index: number) => (
                      <div
                        key={item.id || index}
                        className="grid grid-cols-1 md:grid-cols-7 gap-2 p-3 border-t"
                      >
                        <div className="text-sm">
                          {item.diamond_color_stone || "Not provided"}
                        </div>
                        <div className="text-sm">
                          {item.batch_id || "Not provided"}
                        </div>
                        <div className="text-sm">
                          {item.master_size || "Not provided"}
                        </div>
                        <div className="text-sm">
                          {item.shape || "Not provided"}
                        </div>
                        <div className="text-sm">
                          {item.mm_size || "Not provided"}
                        </div>
                        <div className="text-sm">
                          {item.no_of_pieces || "Not provided"}
                        </div>
                        <div className="text-sm">
                          {item.estimated_total_carat_weight || "Not provided"}
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-2 p-3 border-t">
                    <div className="text-sm">
                      {record.diamond_color_stone || "Not provided"}
                    </div>
                    <div className="text-sm">
                      {record.batch_id || "Not provided"}
                    </div>
                    <div className="text-sm">
                      {record.master_size || "Not provided"}
                    </div>
                    <div className="text-sm">
                      {record.shape || "Not provided"}
                    </div>
                    <div className="text-sm">
                      {record.mm_size || "Not provided"}
                    </div>
                    <div className="text-sm">
                      {record.no_of_pieces || "Not provided"}
                    </div>
                    <div className="text-sm">
                      {record.estimated_total_carat_weight || "Not provided"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Final images — show only the selected log for each type */}
            {(() => {
              const images: any[] = (record as any).images || [];
              const selectedLog = (record as any).selected_log_group;
              const selectedSecondary = (record as any)
                .selected_secondary_log_group;

              const finalApprovedImages = selectedLog
                ? images.filter(
                    (img) =>
                      img.field_type === "approved_bagging" &&
                      img.log_group === selectedLog
                  )
                : [];
              const finalCarryImages = selectedSecondary
                ? images.filter(
                    (img) =>
                      img.field_type === "carry_forward" &&
                      img.log_group === selectedSecondary
                  )
                : [];

              if (!finalApprovedImages.length && !finalCarryImages.length)
                return null;

              const ImgGrid = ({
                imgs,
                label,
              }: {
                imgs: any[];
                label: string;
              }) => (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    {label}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {imgs.map((img: any, i: number) => (
                      <img
                        key={img.id || i}
                        src={img.image_url || img.image}
                        alt={`${label} ${i + 1}`}
                        className="h-24 w-24 rounded-lg object-cover border-2 border-green-400 cursor-pointer hover:opacity-80"
                        onClick={() =>
                          window.open(img.image_url || img.image, "_blank")
                        }
                      />
                    ))}
                  </div>
                </div>
              );

              return (
                <div className="mt-6 pt-6 border-t space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Final Selected Images
                  </h3>
                  {finalApprovedImages.length > 0 && (
                    <ImgGrid
                      imgs={finalApprovedImages}
                      label="Approved Bagging List"
                    />
                  )}
                  {finalCarryImages.length > 0 && (
                    <ImgGrid
                      imgs={finalCarryImages}
                      label="Carry-Forward Images"
                    />
                  )}
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link href="/process/stone-demand-to-bagging/list">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </Link>
      </div>
    </div>
  );
}
