/**
 * Resize an image file to maxSize×maxSize JPEG at 80% quality.
 * Uses Canvas API (works in all modern browsers).
 */
export async function resizeImage(
  file: File,
  maxSize: number = 200
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(maxSize / bitmap.width, maxSize / bitmap.height, 1);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to compress image"));
      },
      "image/jpeg",
      0.8
    );
  });
}
