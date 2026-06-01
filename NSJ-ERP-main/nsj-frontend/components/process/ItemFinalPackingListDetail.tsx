"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  itemFinalPackingListDetail,
  itemFinalPackingListDelete,
  type ItemFinalPackingList,
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
import { ItemFinalPackingListHeader } from "@/components/process/ItemFinalPackingListHeader";

interface ItemFinalPackingListDetailProps {
  params: Promise<{ id: string }>;
}

export function ItemFinalPackingListDetail({
  params,
}: ItemFinalPackingListDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [record, setRecord] = useState<ItemFinalPackingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [id, setId] = useState<string>("");

  useEffect(() => {
    const loadParams = async () => {
      try {
        const { id: resolvedId } = await params;
        setId(resolvedId);

        const data = await itemFinalPackingListDetail(resolvedId);
        setRecord(data);
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
      await itemFinalPackingListDelete(id);
      router.push("/process/item-final-packing-list/list");
    } catch (err: any) {
      setError(err?.message || "Failed to delete record");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <ItemFinalPackingListHeader
          title="Item Final Packing List Details"
          description="Loading record details..."
        />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="space-y-6">
        <ItemFinalPackingListHeader
          title="Item Final Packing List Details"
          description="Record not found"
        />
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error || "Record not found"}
        </div>
        <Link href="/process/item-final-packing-list/list">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ItemFinalPackingListHeader
        title="Item Final Packing List Details"
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
              {(searchParams.get("locked") === "true" ||
                record.is_draft === false) && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-300 rounded-full text-xs font-medium text-gray-600">
                  <Lock className="h-3 w-3" />
                  Locked
                </div>
              )}
            </div>
            {searchParams.get("locked") !== "true" &&
              record.is_draft !== false && (
                <div className="flex gap-2">
                  <Link
                    href={`/process/item-final-packing-list/edit/${record.id}`}
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
                  Order Reference
                </h3>
                <p className="text-sm">{record.order_id || "Not provided"}</p>
              </div>
            </div>
            <div className="space-y-4">
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
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Jewellery Piece Image
                </h3>
                {(() => {
                  const allImgs: any[] = (record as any).images || [];
                  const selLog = (record as any).selected_log_group;
                  const finalImgs = selLog
                    ? allImgs.filter((img: any) => img.log_group === selLog)
                    : [];
                  return finalImgs.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
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
                    <p className="text-sm text-muted-foreground">
                      No final log selected.{" "}
                      <span className="text-amber-600">
                        Open edit, select a final log and save.
                      </span>
                    </p>
                  );
                })()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link href="/process/item-final-packing-list/list">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </Link>
      </div>
    </div>
  );
}
