"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThreeDPrintingCAMHeader } from "@/components/process/ThreeDPrintingCAMHeader";
import { threeDPrintingCAMDetail } from "@/lib/backend";
import {
  ArrowLeft,
  Calendar,
  Image as ImageIcon,
  Star,
  ZoomIn,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type CamImage = {
  id: string;
  image_url?: string;
  image?: string;
  log_group?: string;
  uploaded_at: string;
  field_type?: string;
};

function getFinalLog(
  images: CamImage[],
  selectedLogGroup: string | null | undefined,
  fieldType: string
): CamImage[] {
  if (!selectedLogGroup || !images) return [];
  return images.filter(
    (i) => i.field_type === fieldType && i.log_group === selectedLogGroup
  );
}

export default function ThreeDPrintingCAMDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { id } = await params;
        setRecord(await threeDPrintingCAMDetail(id));
      } catch (err: any) {
        setError(err?.message || "Failed to load record details");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen animate-pulse text-muted-foreground">
        Loading record details...
      </div>
    );
  if (error || !record) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error || "Record not found"}</p>
          <Button onClick={() => router.push("/process/3d-printing-cam/list")}>
            Back to List
          </Button>
        </div>
      </div>
    );
  }

  const allImages: CamImage[] = record.images || [];
  const allCamImages = allImages.filter((i) => i.field_type === "cam_piece");
  const allApprovedImages = allImages.filter(
    (i) => i.field_type === "approved_cam"
  );

  const finalCamImages = getFinalLog(
    allImages,
    record.selected_log_group,
    "cam_piece"
  );
  const finalApprovedImages = getFinalLog(
    allImages,
    record.selected_secondary_log_group,
    "approved_cam"
  );

  const hasFinalCam = finalCamImages.length > 0;
  const hasFinalApproved = finalApprovedImages.length > 0;

  const FinalSection = ({
    label,
    images,
    emptyText,
  }: {
    label: string;
    images: CamImage[];
    emptyText: string;
  }) => (
    <div className="space-y-3">
      <h3 className="font-medium flex items-center gap-2 text-sm">
        <Star className="h-4 w-4 text-green-600 fill-green-600" />
        {label}
      </h3>
      {images.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {images.map((img, idx) => {
            const src = img.image_url || img.image;
            return src ? (
              <div
                key={img.id || idx}
                className="relative group cursor-pointer"
                onClick={() => setPreview(src)}
              >
                <img
                  src={src}
                  alt={`${label} ${idx + 1}`}
                  className="h-24 w-24 rounded-lg object-cover border-2 border-green-400 hover:opacity-80"
                />
                <div className="absolute inset-0 hidden group-hover:flex items-center justify-center rounded-lg bg-black/30">
                  <ZoomIn className="h-4 w-4 text-white" />
                </div>
              </div>
            ) : null;
          })}
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-4 text-center text-muted-foreground text-sm">
          <ImageIcon className="mx-auto h-8 w-8 opacity-40 mb-1" />
          <p>{emptyText}</p>
          <p className="text-xs text-amber-600 mt-1">
            Open Edit, select a final log, and save.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/process/3d-printing-cam/list")}
        className="mb-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
      </Button>

      <ThreeDPrintingCAMHeader
        title="CAM Piece Record Details"
        description="View detailed information for CAM piece record"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Record Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Record ID</p>
                  <p className="font-mono mt-1 text-xs">{record.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-semibold mt-1">
                    {record.account_order_id}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created Date</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(record.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(record.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Quality Check</p>
                  <div className="mt-1">
                    {record.cam_piece_quality_check === true ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Passed
                      </Badge>
                    ) : record.cam_piece_quality_check === false ? (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Not checked</Badge>
                    )}
                  </div>
                </div>
                {record.qc_failure_reasons && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Failure Reasons</p>
                    <div className="mt-1 p-3 bg-muted rounded-md">
                      <p className="text-sm">{record.qc_failure_reasons}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Final Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Final Selected Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FinalSection
                label="CAM Piece — Final Log"
                images={finalCamImages}
                emptyText="No final log selected for CAM piece images"
              />
              {record.cam_piece_quality_check === true && (
                <FinalSection
                  label="Approved CAM Piece — Final Log"
                  images={finalApprovedImages}
                  emptyText="No final log selected for approved CAM images"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Metadata Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CAM Piece Images</span>
                <Badge
                  variant={allCamImages.length > 0 ? "default" : "secondary"}
                >
                  {allCamImages.length} image
                  {allCamImages.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Final CAM Selected
                </span>
                <Badge variant={hasFinalCam ? "default" : "secondary"}>
                  {hasFinalCam ? "Yes" : "No"}
                </Badge>
              </div>
              {record.cam_piece_quality_check === true && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Approved CAM Images
                    </span>
                    <Badge
                      variant={
                        allApprovedImages.length > 0 ? "default" : "secondary"
                      }
                    >
                      {allApprovedImages.length} image
                      {allApprovedImages.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Final Approved Selected
                    </span>
                    <Badge variant={hasFinalApproved ? "default" : "secondary"}>
                      {hasFinalApproved ? "Yes" : "No"}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full-size preview */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl font-bold"
            onClick={() => setPreview(null)}
          >
            ✕
          </button>
          <img
            src={preview}
            alt="Full size"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
