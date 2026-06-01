"use client";

import { useRef, useState } from "react";
import { Upload, Trash2, CheckCircle2, Clock, X, ZoomIn } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LogImageItem = {
  id?: string;
  file?: File;
  url?: string;
  logGroup?: string;
  uploadedAt?: string;
  fieldType?: string;
};

export type ImageLog = {
  logGroup: string;
  uploadedAt: string;
  images: LogImageItem[];
  isPending?: boolean;
};

export interface ImageLogUploaderProps {
  label: string;
  images: LogImageItem[];
  onChange: (images: LogImageItem[]) => void;
  selectedLogGroup?: string | null;
  onSelectLog: (logGroup: string) => void;
  disabled?: boolean;
  maxImages?: number;
  fieldType?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupIntoLogs(images: LogImageItem[]): ImageLog[] {
  const map = new Map<string, ImageLog>();
  for (const img of images) {
    const key = img.logGroup ?? `no-group-${img.id ?? img.url}`;
    if (!map.has(key)) {
      map.set(key, {
        logGroup: key,
        uploadedAt: img.uploadedAt ?? new Date().toISOString(),
        images: [],
        isPending: !img.id,
      });
    }
    map.get(key)!.images.push(img);
  }
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

function formatLogDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImageLogUploader({
  label,
  images = [],
  onChange,
  selectedLogGroup,
  onSelectLog,
  disabled = false,
  maxImages = 20,
  fieldType,
}: ImageLogUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const pendingImages = images.filter((img) => img.file && !img.logGroup);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || disabled) return;
    const newItems: LogImageItem[] = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      fieldType,
    }));
    onChange([...images, ...newItems]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  // Remove an entire log group (all images sharing the same logGroup)
  const removeLog = (logGroup: string) => {
    onChange(images.filter((img) => img.logGroup !== logGroup));
    // Clear selection if the deleted log was selected
    if (selectedLogGroup === logGroup) {
      onSelectLog("");
    }
  };

  // Remove a pending (unsaved) image
  const removePending = (target: LogImageItem) => {
    onChange(images.filter((img) => img !== target));
  };

  const savedLogs = groupIntoLogs(images.filter((img) => img.logGroup));

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-foreground">{label}</p>

      {/* ── Saved logs ── */}
      {savedLogs.length > 0 && (
        <div className="space-y-3">
          {savedLogs.map((log, logIdx) => {
            const isSelected = selectedLogGroup === log.logGroup;
            return (
              <div
                key={log.logGroup}
                className={`rounded-lg border p-3 transition-colors ${
                  isSelected
                    ? "border-green-500 bg-green-50"
                    : "border-input bg-muted/20"
                }`}
              >
                {/* Log header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">
                      Log {savedLogs.length - logIdx}
                    </span>
                    <span>{formatLogDate(log.uploadedAt)}</span>
                    <span className="text-foreground font-medium">
                      ({log.images.length} image
                      {log.images.length !== 1 ? "s" : ""})
                    </span>
                  </div>

                  {!disabled && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onSelectLog(isSelected ? "" : log.logGroup)
                        }
                        className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${
                          isSelected
                            ? "bg-green-600 text-white"
                            : "bg-white border border-input hover:border-green-500 hover:text-green-700"
                        }`}
                      >
                        {isSelected ? "✓ Selected as Final" : "Select as Final"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLog(log.logGroup)}
                        className="text-xs px-2 py-1 rounded-full border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 font-medium"
                        title="Delete this log and all its images"
                      >
                        Delete Log
                      </button>
                    </div>
                  )}

                  {disabled && isSelected && (
                    <span className="flex items-center gap-1 text-xs text-green-700 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Final
                    </span>
                  )}
                </div>

                {/* Thumbnails — click to preview */}
                <div className="flex flex-wrap gap-2">
                  {log.images.map((img, imgIdx) => (
                    <div
                      key={img.id ?? imgIdx}
                      className="relative group cursor-pointer"
                      onClick={() => img.url && setPreviewUrl(img.url)}
                      title="Click to view full size"
                    >
                      {img.url ? (
                        <>
                          <img
                            src={img.url}
                            alt={`Log ${savedLogs.length - logIdx} image ${imgIdx + 1}`}
                            className="h-16 w-16 rounded object-cover border hover:opacity-80 transition-opacity"
                          />
                          <div className="absolute inset-0 hidden group-hover:flex items-center justify-center rounded bg-black/30">
                            <ZoomIn className="h-4 w-4 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="h-16 w-16 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          No preview
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pending (unsaved) images ── */}
      {pendingImages.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-medium text-amber-800 mb-2">
            Pending — {pendingImages.length} image
            {pendingImages.length !== 1 ? "s" : ""} (will be saved with form)
          </p>
          <div className="flex flex-wrap gap-2">
            {pendingImages.map((img, idx) => (
              <div key={idx} className="relative group">
                {img.url && (
                  <>
                    <img
                      src={img.url}
                      alt={`Pending ${idx + 1}`}
                      className="h-16 w-16 rounded object-cover border cursor-pointer hover:opacity-80"
                      onClick={() => setPreviewUrl(img.url!)}
                    />
                    <div className="absolute inset-0 hidden group-hover:flex items-center justify-center rounded bg-black/30 pointer-events-none">
                      <ZoomIn className="h-4 w-4 text-white" />
                    </div>
                  </>
                )}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePending(img);
                    }}
                    className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white z-10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Upload area ── */}
      {!disabled && images.length < maxImages && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 text-center hover:border-primary/50 hover:bg-muted/30 transition-colors"
        >
          <Upload className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Click or drag images here
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Each save creates a new log entry
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>
      )}

      {savedLogs.length === 0 && pendingImages.length === 0 && disabled && (
        <p className="text-sm text-muted-foreground italic">
          No images uploaded.
        </p>
      )}

      {/* ── Full-size preview modal ── */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setPreviewUrl(null)}
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={previewUrl}
            alt="Full size preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
