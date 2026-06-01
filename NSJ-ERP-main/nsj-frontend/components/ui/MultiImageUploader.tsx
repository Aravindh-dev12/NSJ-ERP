"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Trash2, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export type ImageItem = {
  id?: string;
  file?: File;
  url?: string;
  isFinal: boolean;
  uploadedAt?: string;
};

interface MultiImageUploaderProps {
  fieldName: string;
  label: string;
  images?: ImageItem[];
  onImagesChange: (images: ImageItem[]) => void;
  disabled?: boolean;
  maxImages?: number;
}

export function MultiImageUploader({
  fieldName,
  label,
  images = [],
  onImagesChange,
  disabled = false,
  maxImages = 10,
}: MultiImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || disabled) return;

    const newFiles = Array.from(files);
    const totalImages = images.length + newFiles.length;

    if (totalImages > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    const newImages = newFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      isFinal: false,
    }));

    onImagesChange([...images, ...newImages]);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleSetFinal = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isFinal: i === index,
    }));
    onImagesChange(newImages);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
          className="hidden"
        />

        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600">
          {disabled ? "Images locked" : "Drag and drop images here, or click to select"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {images.length}/{maxImages} images
        </p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group rounded-lg overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors"
            >
              <div className="aspect-square bg-gray-100 relative">
                {image.url && (
                  <Image
                    src={image.url}
                    alt={`Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                )}
              </div>

              {image.isFinal && (
                <div className="absolute top-0 right-0 bg-green-500 text-white p-1 rounded-bl">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}

              {!disabled && (
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={image.isFinal ? "default" : "secondary"}
                    onClick={() => handleSetFinal(index)}
                    className="text-xs"
                  >
                    {image.isFinal ? "Final ✓" : "Set Final"}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveImage(index)}
                    className="text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {image.uploadedAt && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 text-center">
                  {new Date(image.uploadedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <p className="text-center text-gray-500 text-sm py-4">No images uploaded</p>
      )}
    </div>
  );
}
