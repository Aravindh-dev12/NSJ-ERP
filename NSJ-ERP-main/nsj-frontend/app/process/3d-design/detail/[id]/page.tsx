"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { threeDDesignDetail } from "@/lib/backend";
import {
  ArrowLeft,
  Calendar,
  Image as ImageIcon,
  Star,
  ZoomIn,
} from "lucide-react";

type DesignImage = {
  id: string;
  image_url?: string;
  image?: string;
  log_group?: string;
  uploaded_at: string;
  field_type?: string;
};

function getFinalImages(
  images: DesignImage[],
  selectedLogGroup?: string | null,
  fieldType?: string
): DesignImage[] {
  if (!images) return [];
  const typed = fieldType
    ? images.filter((i) => i.field_type === fieldType)
    : images;
  if (!selectedLogGroup) return [];
  return typed.filter((i) => i.log_group === selectedLogGroup);
}

export default function ThreeDDesignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [design, setDesign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { id } = await params;
        setDesign(await threeDDesignDetail(id));
      } catch (err: any) {
        setError(err?.message || "Failed to load design details");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground animate-pulse">
        Loading...
      </div>
    );
  if (error || !design) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || "Design not found"}</p>
          <Button onClick={() => router.push("/process/3d-design")}>
            Back to 3D Designs
          </Button>
        </div>
      </div>
    );
  }

  const allImages: DesignImage[] = design.images || [];
  const allDesign = allImages.filter((i) => i.field_type === "design");
  const allApproved = allImages.filter((i) => i.field_type === "approved");

  const finalDesignImages = getFinalImages(
    allImages,
    design.selected_log_group,
    "design"
  );
  const finalApprovedImages = getFinalImages(
    allImages,
    design.selected_secondary_log_group,
    "approved"
  );

  const hasDesign = finalDesignImages.length > 0;
  const hasApproved = finalApprovedImages.length > 0;

  const FinalSection = ({
    label,
    images,
    emptyText,
  }: {
    label: string;
    images: DesignImage[];
    emptyText: string;
  }) => (
    <div className="space-y-3">
      <h3 className="font-medium flex items-center gap-2">
        <Star className="h-4 w-4 text-green-600 fill-green-600" />
        {label}
      </h3>
      {images.length > 0 ? (
        <div className="flex flex-wrap gap-3">
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
                  className="h-32 w-32 rounded-lg object-cover border-2 border-green-400 hover:opacity-80"
                />
                <div className="absolute inset-0 hidden group-hover:flex items-center justify-center rounded-lg bg-black/30">
                  <ZoomIn className="h-5 w-5 text-white" />
                </div>
              </div>
            ) : null;
          })}
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
          <ImageIcon className="mx-auto h-10 w-10 opacity-40" />
          <p className="mt-2 text-sm">{emptyText}</p>
          <p className="mt-1 text-xs text-amber-600">
            Open the edit form, select a final log, and save again.
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
        onClick={() => router.push("/process/3d-design")}
        className="mb-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">3D Design Details</h1>
        <p className="text-muted-foreground">
          Final selected images for this 3D design
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle>Design Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-semibold mt-1">
                    {design.account_order_id || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <div className="mt-1">
                    <Badge
                      variant={
                        hasApproved
                          ? "default"
                          : hasDesign
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {hasApproved
                        ? "Approved"
                        : hasDesign
                          ? "Design Uploaded"
                          : "No Final Selected"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(design.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Updated</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(design.updated_at).toLocaleDateString()}
                  </div>
                </div>
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
            <CardContent className="space-y-6">
              <FinalSection
                label="3D Design — Final Log"
                images={finalDesignImages}
                emptyText="No final log selected for design images"
              />
              <FinalSection
                label="Approved Design — Final Log"
                images={finalApprovedImages}
                emptyText="No final log selected for approved images"
              />
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Design Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Total Design Images:
                </span>
                <span className="font-medium">{allDesign.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Total Approved Images:
                </span>
                <span className="font-medium">{allApproved.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Final Design Selected:
                </span>
                <Badge variant={hasDesign ? "default" : "secondary"}>
                  {hasDesign ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Final Approved Selected:
                </span>
                <Badge variant={hasApproved ? "default" : "secondary"}>
                  {hasApproved ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Days Since Creation:
                </span>
                <span>
                  {Math.floor(
                    (Date.now() - new Date(design.created_at).getTime()) /
                      86400000
                  )}
                </span>
              </div>
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
