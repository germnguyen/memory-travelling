export interface CompressedThumbnail {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  fileSize?: number;
}

/**
 * Calculates aspect-ratio preserving dimensions such that max dimension does not exceed maxDim.
 *
 * Logic:
 * - If width > height and width > maxDim: height = Math.round((height * maxDim) / width), width = maxDim.
 * - Else if height > maxDim: width = Math.round((width * maxDim) / height), height = maxDim.
 */
export function calculateScaledDimensions(
  srcWidth: number,
  srcHeight: number,
  maxDim = 400
): { width: number; height: number } {
  if (srcWidth <= 0 || srcHeight <= 0 || maxDim <= 0) {
    return {
      width: Math.max(1, Math.round(srcWidth || 1)),
      height: Math.max(1, Math.round(srcHeight || 1)),
    };
  }

  let width = Math.round(srcWidth);
  let height = Math.round(srcHeight);

  if (width > height && width > maxDim) {
    height = Math.round((height * maxDim) / width);
    width = maxDim;
  } else if (height > maxDim) {
    width = Math.round((width * maxDim) / height);
    height = maxDim;
  }

  return { width, height };
}

// Retain calculateThumbnailDimensions as an alias
export const calculateThumbnailDimensions = calculateScaledDimensions;

/**
 * Detects whether the current browser environment's canvas supports WebP export.
 */
function isWebpSupported(): boolean {
  try {
    if (typeof document === 'undefined') return false;
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const uri = canvas.toDataURL('image/webp');
    return uri.startsWith('data:image/webp');
  } catch {
    return false;
  }
}

/**
 * Converts a Blob to a base64 Data URL using FileReader as fallback.
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to generate Data URL from blob'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Compresses an image file or blob to an aspect-ratio preserving WebP thumbnail using HTML5 Canvas.
 * Falls back to image/jpeg if WebP is unsupported.
 *
 * @param file The input File or Blob
 * @param maxDim Maximum bounding dimension (width or height), default 400
 * @param quality Compression quality from 0.0 to 1.0, default 0.8
 */
export async function createWebpThumbnail(
  file: File | Blob,
  maxDim = 400,
  quality = 0.8
): Promise<CompressedThumbnail> {
  if (!file) {
    throw new Error('No image file or blob provided');
  }

  let objectUrl: string | null = null;

  try {
    objectUrl = URL.createObjectURL(file);

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to load image for thumbnail creation'));
      image.src = objectUrl!;
    });

    const origWidth = img.naturalWidth || img.width;
    const origHeight = img.naturalHeight || img.height;

    if (!origWidth || !origHeight) {
      throw new Error('Invalid image dimensions');
    }

    const { width: targetWidth, height: targetHeight } = calculateScaledDimensions(
      origWidth,
      origHeight,
      maxDim
    );

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const webpSupported = isWebpSupported();
    const primaryFormat = webpSupported ? 'image/webp' : 'image/jpeg';

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) {
            resolve(b);
          } else {
            // Fallback to JPEG if primary format failed
            canvas.toBlob(
              (fallbackBlob) => {
                if (fallbackBlob) {
                  resolve(fallbackBlob);
                } else {
                  reject(new Error('Failed to convert canvas to blob'));
                }
              },
              'image/jpeg',
              quality
            );
          }
        },
        primaryFormat,
        quality
      );
    });

    let dataUrl: string;
    try {
      dataUrl = canvas.toDataURL(blob.type || primaryFormat, quality);
      if (!dataUrl || !dataUrl.startsWith('data:image/')) {
        dataUrl = await blobToDataUrl(blob);
      }
    } catch {
      dataUrl = await blobToDataUrl(blob);
    }

    return {
      blob,
      dataUrl,
      width: targetWidth,
      height: targetHeight,
      fileSize: blob.size,
    };
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}
