"use client";

/**
 * Resize + re-encode photos in the browser before upload (WebP, JPEG fallback),
 * so guests download ~200–400KB images instead of 5MB camera originals.
 */
export async function compressImage(file: File, maxDim = 1800, quality = 0.82): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const toBlob = (type: string) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, quality));
  let blob = await toBlob("image/webp");
  if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg");
  if (!blob) throw new Error("Could not encode image");
  return { blob, width, height };
}
