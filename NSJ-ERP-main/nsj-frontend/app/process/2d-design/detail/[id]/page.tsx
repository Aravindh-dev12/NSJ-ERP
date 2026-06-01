"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { twoDDesignDetail } from "@/lib/backend";
import { AlertCircle, ArrowLeft, Star } from "lucide-react";

type DesignImage = {
  id: string;
  image_url?: string;
  image?: string;
  log_group?: string;
  uploaded_at: string;
  field_type?: string;
};

type ImageLog = {
  logGroup: string;
  uploadedAt: string;
  images: DesignImage[];
  isFinal: boolean;
};

function groupImages(
  images: DesignImage[],
  selectedLogGroup?: string
): ImageLog[] {
  const map = new Map<string, ImageLog>();
  for (const img of images) {
    const key = img.log_group ?? `solo-${img.id}`;
    if (!map.has(key)) {
      map.set(key, {
        logGroup: key,
        uploadedAt: img.uploaded_at,
        images: [],
        isFinal: key === selectedLogGroup,
      });
    }
    map.get(key)!.images.push(img);
  }
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

export default function TwoDDesignApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [design, setDesign] = useState<any>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadDesign = async () => {
      try {
        const data = await twoDDesignDetail(params.id as string);
        setDesign(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load design");
      } finally {
        setLoading(false);
      }
    };
    loadDesign();
  }, [params.id]);

  if (loading)
    return <div className="container mx-auto py-8 text-center">Loading...</div>;

  if (error || !design) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-center gap-3 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error || "Design not found"}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allImages: DesignImage[] = design.images || [];
  const logs = groupImages(allImages, design.selected_log_group);
  const finalLog = logs.find((l) => l.isFinal);

  return (
    <div className="container mx-auto py-8 max-w-3xl space-y-6">
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>2D Design Approval Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Order ID
              </p>
              <p className="font-semibold">
                {design.account_order_id || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Created At
              </p>
              <p>
                {design.created_at
                  ? new Date(design.created_at).toLocaleString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Last Updated
              </p>
              <p>
                {design.updated_at
                  ? new Date(design.updated_at).toLocaleString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Total Logs
              </p>
              <p>{logs.length}</p>
            </div>
          </div>

          {/* Show only the final selected log */}
          {finalLog ? (
            <div className="rounded-lg border-2 border-green-500 bg-green-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-green-700 fill-green-700" />
                <span className="font-semibold text-green-800">
                  Final Selected Log
                </span>
                <span className="text-xs text-green-600">
                  {new Date(finalLog.uploadedAt).toLocaleString()} ·{" "}
                  {finalLog.images.length} image
                  {finalLog.images.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {finalLog.images.map((img, idx) => {
                  const src = img.image_url || img.image;
                  return src ? (
                    <img
                      key={img.id}
                      src={src}
                      alt={`Final image ${idx + 1}`}
                      className="h-28 w-28 rounded-lg object-cover border-2 border-green-400 cursor-pointer hover:opacity-80"
                      onClick={() => setPreview(src)}
                    />
                  ) : null;
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No final log selected.
            </p>
          )}
        </CardContent>
      </Card>

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
