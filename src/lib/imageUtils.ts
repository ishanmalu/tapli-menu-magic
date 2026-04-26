/**
 * Compress an image file using the Canvas API before uploading.
 * Resizes to maxWidth and re-encodes as JPEG at the given quality.
 * Falls back to the original file if anything fails.
 */
export async function compressImage(
  file: File,
  maxWidth: number,
  quality = 0.82
): Promise<File> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(maxWidth / img.naturalWidth, 1);
      const w = Math.round(img.naturalWidth  * ratio);
      const h = Math.round(img.naturalHeight * ratio);
      const canvas = document.createElement("canvas");
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

/** Instantly create a local preview URL for a File (revoke when done). */
export function localPreview(file: File): string {
  return URL.createObjectURL(file);
}
