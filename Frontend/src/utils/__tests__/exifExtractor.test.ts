import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExifReader from 'exifreader';
import { extractGpsFromImage, isWithinVietnamBounds } from '../exifExtractor.ts';

vi.mock('exifreader', () => ({
  default: {
    load: vi.fn(),
  },
}));

describe('exifExtractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isWithinVietnamBounds', () => {
    it('should return true for coordinates within Vietnam boundaries', () => {
      // Ho Chi Minh City
      expect(isWithinVietnamBounds(10.7769, 106.7009)).toBe(true);
      // Hanoi
      expect(isWithinVietnamBounds(21.0285, 105.8542)).toBe(true);
      // Da Nang
      expect(isWithinVietnamBounds(16.0544, 108.2022)).toBe(true);
      // Bounding box edges
      expect(isWithinVietnamBounds(8.0, 102.0)).toBe(true);
      expect(isWithinVietnamBounds(24.0, 110.0)).toBe(true);
    });

    it('should return false for coordinates outside Vietnam boundaries', () => {
      // Paris, France
      expect(isWithinVietnamBounds(48.8566, 2.3522)).toBe(false);
      // Tokyo, Japan
      expect(isWithinVietnamBounds(35.6762, 139.6503)).toBe(false);
      // Sydney, Australia (Southern hemisphere)
      expect(isWithinVietnamBounds(-33.8688, 151.2093)).toBe(false);
      // Just north of Vietnam
      expect(isWithinVietnamBounds(24.1, 105.0)).toBe(false);
      // Just south of Vietnam
      expect(isWithinVietnamBounds(7.9, 105.0)).toBe(false);
    });

    it('should return false for invalid or NaN coordinates', () => {
      expect(isWithinVietnamBounds(NaN, 106.7)).toBe(false);
      expect(isWithinVietnamBounds(10.7, NaN)).toBe(false);
      expect(isWithinVietnamBounds(null as unknown as number, 106.7)).toBe(false);
      expect(isWithinVietnamBounds(undefined as unknown as number, undefined as unknown as number)).toBe(false);
    });
  });

  describe('extractGpsFromImage', () => {
    it('should return null cleanly when file is not provided', async () => {
      const result = await extractGpsFromImage(null as unknown as File);
      expect(result).toBeNull();
    });

    it('should return null cleanly for empty blob', async () => {
      vi.mocked(ExifReader.load).mockRejectedValueOnce(new Error('Invalid image file or empty'));
      const emptyBlob = new Blob([]);
      const result = await extractGpsFromImage(emptyBlob);
      expect(result).toBeNull();
    });

    it('should return null cleanly for non-image plain text blob', async () => {
      vi.mocked(ExifReader.load).mockRejectedValueOnce(new Error('No Exif segment found'));
      const textBlob = new Blob(['plain text not an image'], { type: 'text/plain' });
      const result = await extractGpsFromImage(textBlob);
      expect(result).toBeNull();
    });

    it('should return null cleanly when ExifReader throws an error', async () => {
      vi.mocked(ExifReader.load).mockRejectedValueOnce(new Error('Invalid image format'));

      const dummyFile = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      const result = await extractGpsFromImage(dummyFile);

      expect(result).toBeNull();
    });

    it('should return null cleanly when image has no GPS tags', async () => {
      vi.mocked(ExifReader.load).mockResolvedValueOnce({
        exif: {
          DateTimeOriginal: { description: '2023:08:15 14:30:00' },
        },
      } as unknown as ExifReader.Tags);

      const dummyFile = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      const result = await extractGpsFromImage(dummyFile);

      expect(result).toBeNull();
    });

    it('should extract GPS from expanded format tags (tags.gps.Latitude/Longitude)', async () => {
      vi.mocked(ExifReader.load).mockResolvedValueOnce({
        gps: {
          Latitude: 10.7769,
          Longitude: 106.7009,
        },
        exif: {
          DateTimeOriginal: { description: '2023:08:15 14:30:00' },
          Model: { description: 'iPhone 14 Pro' },
        },
      } as unknown as ExifReader.Tags);

      const dummyFile = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      const result = await extractGpsFromImage(dummyFile);

      expect(result).not.toBeNull();
      expect(result?.lat).toBe(10.7769);
      expect(result?.lng).toBe(106.7009);
      expect(result?.cameraModel).toBe('iPhone 14 Pro');
      expect(result?.takenAt).toBeInstanceOf(Date);
      expect(result?.takenAt?.getFullYear()).toBe(2023);
      expect(result?.takenAt?.getMonth()).toBe(7); // 0-indexed: August = 7
      expect(result?.takenAt?.getDate()).toBe(15);
    });

    it('should extract GPS from rational array DMS tags when expanded GPS is absent', async () => {
      // 10 deg 46' 36.84" N = 10 + 46/60 + 36.84/3600 = 10.7769
      // 106 deg 42' 3.24" E = 106 + 42/60 + 3.24/3600 = 106.7009
      vi.mocked(ExifReader.load).mockResolvedValueOnce({
        exif: {
          GPSLatitude: {
            value: [
              [10, 1],
              [46, 1],
              [3684, 100],
            ],
          },
          GPSLatitudeRef: { description: 'N' },
          GPSLongitude: {
            value: [
              [106, 1],
              [42, 1],
              [324, 100],
            ],
          },
          GPSLongitudeRef: { description: 'E' },
          Model: { value: 'Sony A7IV' },
        },
      } as unknown as ExifReader.Tags);

      const dummyFile = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      const result = await extractGpsFromImage(dummyFile);

      expect(result).not.toBeNull();
      expect(result?.lat).toBeCloseTo(10.7769, 4);
      expect(result?.lng).toBeCloseTo(106.7009, 4);
      expect(result?.cameraModel).toBe('Sony A7IV');
    });

    it('should handle South/West reference tags by converting to negative coordinates', async () => {
      vi.mocked(ExifReader.load).mockResolvedValueOnce({
        exif: {
          GPSLatitude: { description: 33.8688 },
          GPSLatitudeRef: { description: 'S' },
          GPSLongitude: { description: 70.6693 },
          GPSLongitudeRef: { description: 'W' },
        },
      } as unknown as ExifReader.Tags);

      const dummyFile = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      const result = await extractGpsFromImage(dummyFile);

      expect(result).not.toBeNull();
      expect(result?.lat).toBeCloseTo(-33.8688, 4);
      expect(result?.lng).toBeCloseTo(-70.6693, 4);
    });

    it('should reject coordinates outside valid ranges and return null', async () => {
      vi.mocked(ExifReader.load).mockResolvedValueOnce({
        gps: {
          Latitude: 95.0, // > 90 invalid
          Longitude: 106.7009,
        },
      } as unknown as ExifReader.Tags);

      const dummyFile = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      const result = await extractGpsFromImage(dummyFile);

      expect(result).toBeNull();
    });

    it('should reject longitude outside [-180, 180] and return null', async () => {
      vi.mocked(ExifReader.load).mockResolvedValueOnce({
        gps: {
          Latitude: 10.7769,
          Longitude: -185.0, // < -180 invalid
        },
      } as unknown as ExifReader.Tags);

      const dummyFile = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      const result = await extractGpsFromImage(dummyFile);

      expect(result).toBeNull();
    });
  });
});
