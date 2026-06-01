"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadFieldProps {
  label: string;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  error?: string;
  accept?: string;
}

export function ImageUploadField({
  label,
  existingUrl,
  onChange,
  required = false,
  error,
  accept = "image/*",
}: ImageUploadFieldProps) {
  const [preview, setPreview] = useState<string>(existingUrl || "");
  const [newFile, setNewFile] = useState<File | null>(null);

  // Update preview when existingUrl changes (e.g., when loading edit form)
  useEffect(() => {
    if (existingUrl && !newFile) {
      setPreview(existingUrl);
    }
  }, [existingUrl, newFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setNewFile(file);
      onChange(file);

      // Create local preview for new file
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setNewFile(null);
      setPreview(existingUrl || "");
      onChange(null);
    }
  };

  const handleRemoveImage = () => {
    setNewFile(null);
    setPreview("");
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {/* Show existing/new image preview */}
      {preview && (
        <div className="relative rounded-lg border border-gray-200 p-3 bg-gray-50">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              {newFile ? "New Image Preview:" : "Saved Image:"}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveImage}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-start">
            <img
              src={preview}
              alt={label}
              className="max-h-48 max-w-full rounded-md object-contain border border-gray-200"
            />
          </div>
          {newFile && (
            <p className="text-xs text-muted-foreground mt-2">
              File: {newFile.name} ({(newFile.size / 1024).toFixed(2)} KB)
            </p>
          )}
          {!newFile && existingUrl && (
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <span>✓</span> Image already saved — upload a new one to replace
            </p>
          )}
        </div>
      )}

      {/* File input */}
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className={error ? "border-destructive" : ""}
        />
      </div>

      {/* Error message */}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
