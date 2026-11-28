import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateThumbnailDimensions,
  createWebpThumbnail,
} from '../canvasImageCompressor.ts';

describe('canvasImageCompressor', () => {
  describe('calculateThumbnailDimensions', () => {
    it('should correctly scale landscape images preserving aspect ratio', () => {
      // 1920 x 1080 scaled to maxDim 400
      const dims = calculateThumbnailDimensions(1920, 1080, 400);
      expect(dims.width).toBe(400);
      expect(dims.height).toBe(225);
      expect(dims.width / dims.height).toBeCloseTo(1920 / 1080, 2);
    });

    it('should correctly scale portrait images preserving aspect ratio', () => {
      // 1080 x 1920 scaled to maxDim 400
      const dims = calculateThumbnailDimensions(1080, 1920, 400);
      expect(dims.height).toBe(400);
      expect(dims.width).toBe(225);
      expect(dims.height / dims.width).toBeCloseTo(1920 / 1080, 2);
    });

    it('should correctly scale square images', () => {
      const dims = calculateThumbnailDimensions(1200, 1200, 400);
      expect(dims.width).toBe(400);
      expect(dims.height).toBe(400);
    });

    it('should not upscale images that are already smaller than maxDim', () => {
      const dims = calculateThumbnailDimensions(320, 240, 400);
      expect(dims.width).toBe(320);
      expect(dims.height).toBe(240);
    });

    it('should handle images exactly at maxDim', () => {
      const dims = calculateThumbnailDimensions(400, 300, 400);
      expect(dims.width).toBe(400);
      expect(dims.height).toBe(300);
    });

    it('should handle custom maxDim values', () => {
      const dims = calculateThumbnailDimensions(1600, 800, 800);
      expect(dims.width).toBe(800);
      expect(dims.height).toBe(400);
    });

    it('should safely handle zero or negative dimensions without dividing by zero', () => {
      const zeroDims = calculateThumbnailDimensions(0, 0, 400);
      expect(zeroDims.width).toBeGreaterThanOrEqual(1);
      expect(zeroDims.height).toBeGreaterThanOrEqual(1);
    });
  });

  describe('createWebpThumbnail', () => {
    let mockRevokeObjectURL: ReturnType<typeof vi.spyOn>;
    let originalImage: typeof Image;

    beforeEach(() => {
      originalImage = globalThis.Image;

      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url-123');
      mockRevokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      // Mock Image
      globalThis.Image = class MockImage {
        src = '';
        naturalWidth = 1200;
        naturalHeight = 800;
        width = 1200;
        height = 800;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;

        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      } as unknown as typeof Image;

      // Mock Canvas 2D Context & methods
      const mockContext = {
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'low',
        drawImage: vi.fn(),
      };

      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
        mockContext as unknown as CanvasRenderingContext2D
      );
      vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/webp;base64,mockwebpdata');
      vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback, type) {
        const mimeType = type || 'image/webp';
        const dummyBlob = new Blob(['mock-binary-data'], { type: mimeType });
        callback(dummyBlob);
      });
    });

    afterEach(() => {
      globalThis.Image = originalImage;
      vi.restoreAllMocks();
    });

    it('should compress image to WebP thumbnail and revoke object URL', async () => {
      const dummyFile = new File(['image-content'], 'photo.jpg', { type: 'image/jpeg' });
      const result = await createWebpThumbnail(dummyFile, 400, 0.85);

      expect(result).toBeDefined();
      expect(result.width).toBe(400);
      expect(result.height).toBe(267); // 800 * 400 / 1200 = 266.67 -> 267
      expect(result.dataUrl).toContain('data:image/');
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.fileSize).toBeGreaterThan(0);

      // Verify memory cleanup was performed
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url-123');
    });

    it('should throw error and still revoke object URL if image fails to load', async () => {
      globalThis.Image = class FailingImage {
        src = '';
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;

        constructor() {
          setTimeout(() => {
            if (this.onerror) this.onerror();
          }, 0);
        }
      } as unknown as typeof Image;

      const dummyFile = new File(['bad-content'], 'bad.jpg', { type: 'image/jpeg' });
      await expect(createWebpThumbnail(dummyFile, 400)).rejects.toThrow(
        'Failed to load image for thumbnail creation'
      );

      // Ensure revokeObjectURL is called in finally block even on failure
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url-123');
    });

    it('should throw error if no file or blob is provided', async () => {
      await expect(createWebpThumbnail(null as unknown as File)).rejects.toThrow(
        'No image file or blob provided'
      );
    });
  });
});
