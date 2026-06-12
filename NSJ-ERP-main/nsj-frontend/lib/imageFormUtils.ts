import type { ImageItem } from "@/components/ui/MultiImageUploader";
import type { LogImageItem } from "@/components/ui/ImageLogUploader";

// ─── Legacy helpers (MultiImageUploader) ─────────────────────────────────────

/**
 * Appends image fields to FormData for the old MultiImageUploader flow.
 */
export function appendImageFields(
  formData: FormData,
  images: ImageItem[],
  fieldPrefix: string
): void {
  const newFiles: { file: File; isFinal: boolean }[] = [];
  const keepIds: string[] = [];
  let existingFinalId: string | undefined;

  images.forEach((img) => {
    if (img.file) {
      newFiles.push({ file: img.file, isFinal: !!img.isFinal });
    } else if (img.id) {
      keepIds.push(img.id);
      if (img.isFinal) existingFinalId = img.id;
    }
  });

  keepIds.forEach((id) =>
    formData.append(`keep_${fieldPrefix}_image_ids[]`, id)
  );

  let finalFileIndex = -1;
  newFiles.forEach((entry, idx) => {
    formData.append(`${fieldPrefix}_images[]`, entry.file);
    if (entry.isFinal) finalFileIndex = idx;
  });

  if (existingFinalId) {
    formData.append(`final_${fieldPrefix}_image_id`, existingFinalId);
  } else if (finalFileIndex >= 0) {
    formData.append(
      `final_${fieldPrefix}_file_index`,
      finalFileIndex.toString()
    );
  }
}

/**
 * Maps API image response to ImageItem array (legacy MultiImageUploader).
 */
export function mapApiImagesToImageItems(
  images: any[],
  fieldType: string
): ImageItem[] {
  if (!images) return [];
  return images
    .filter((img: any) => img.field_type === fieldType || fieldType === "*")
    .map((img: any) => ({
      id: img.id,
      url: img.image_url || img.image,
      isFinal:
        img.is_final ?? img.is_final_design ?? img.is_final_approved ?? false,
      uploadedAt: img.uploaded_at,
    }));
}

// ─── New log-based helpers (ImageLogUploader) ─────────────────────────────────

/**
 * Maps API image response to LogImageItem array for ImageLogUploader.
 * Groups images by log_group; fieldType "*" returns all images.
 */
export function mapApiImagesToLogItems(
  images: any[],
  fieldType: string = "*"
): LogImageItem[] {
  if (!images) return [];
  return images
    .filter((img: any) => fieldType === "*" || img.field_type === fieldType)
    .map((img: any) => ({
      id: img.id,
      url: img.image_url || img.image,
      logGroup: img.log_group ?? undefined,
      uploadedAt: img.uploaded_at,
      fieldType: img.field_type,
    }));
}

/**
 * Appends log-based image fields to FormData.
 * - New files (no id, has file) → `{fieldPrefix}_images[]`
 * - Existing ids to keep → `keep_{fieldPrefix}_image_ids[]`
 *   (backend deletes images whose ids are NOT in the keep list)
 * - Optional log selection → `select_log_group`
 */
/**
 * selectKey lets callers use "select_log_group" for the primary field
 * and "select_secondary_log_group" for the secondary field so they
 * don't overwrite each other in the same FormData.
 */
export function appendLogImageFields(
  formData: FormData,
  images: LogImageItem[],
  fieldPrefix: string,
  selectedLogGroup?: string | null,
  selectKey: string = "select_log_group"
): void {
  const keepIds: string[] = [];

  images.forEach((img) => {
    if (img.file) {
      formData.append(`${fieldPrefix}_images[]`, img.file);
    } else if (img.id) {
      keepIds.push(img.id);
    }
  });

  keepIds.forEach((id) =>
    formData.append(`keep_${fieldPrefix}_image_ids[]`, id)
  );

  if (selectedLogGroup && !selectedLogGroup.startsWith("no-group-")) {
    formData.append(selectKey, selectedLogGroup);
  } else {
    formData.append(selectKey, "");
  }
}

/**
 * Returns an error message if a final log must be selected but isn't.
 * Returns null if validation passes.
 * Only validates on final save (not draft).
 */
export function validateFinalLogSelection(
  images: LogImageItem[],
  selectedLogGroup: string | null | undefined,
  label: string
): string | null {
  const savedImages = images.filter((img) => img.id && img.logGroup);
  if (savedImages.length > 0 && !selectedLogGroup) {
    return `${label} — please select a final log before saving.`;
  }
  return null;
}
