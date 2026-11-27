import ExifReader from 'exifreader';

export interface ExtractedImageMetadata {
  lat: number;
  lng: number;
  takenAt?: Date;
  cameraModel?: string;
}

interface ExifTagDescriptor {
  description?: string | number;
  value?: unknown;
}

interface ExpandedGpsTags {
  Latitude?: number;
  Longitude?: number;
  LatitudeRef?: string;
  LongitudeRef?: string;
}

interface ExpandedExifTags {
  DateTimeOriginal?: ExifTagDescriptor;
  CreateDate?: ExifTagDescriptor;
  DateTime?: ExifTagDescriptor;
  GPSLatitude?: ExifTagDescriptor;
  GPSLatitudeRef?: ExifTagDescriptor;
  GPSLongitude?: ExifTagDescriptor;
  GPSLongitudeRef?: ExifTagDescriptor;
  Model?: ExifTagDescriptor;
  [key: string]: unknown;
}

interface ExifDataResult {
  gps?: ExpandedGpsTags;
  exif?: ExpandedExifTags;
  DateTimeOriginal?: ExifTagDescriptor;
  CreateDate?: ExifTagDescriptor;
  DateTime?: ExifTagDescriptor;
  GPSLatitude?: ExifTagDescriptor;
  GPSLatitudeRef?: ExifTagDescriptor;
  GPSLongitude?: ExifTagDescriptor;
  GPSLongitudeRef?: ExifTagDescriptor;
  Model?: ExifTagDescriptor;
  [key: string]: unknown;
}

/**
 * Parses DMS (Degrees, Minutes, Seconds) or rational coordinate tags into decimal degrees.
 */
function parseCoordinate(coordTag: unknown, refTag?: unknown): number | undefined {
  if (coordTag == null) return undefined;

  let val: number | undefined;

  if (typeof coordTag === 'number' && !isNaN(coordTag)) {
    val = coordTag;
  } else if (typeof coordTag === 'object') {
    const tagObj = coordTag as Record<string, unknown>;

    if (typeof tagObj.description === 'number' && !isNaN(tagObj.description)) {
      val = tagObj.description;
    } else if (typeof tagObj.description === 'string') {
      const trimmed = tagObj.description.trim();
      const parsedFloat = parseFloat(trimmed);
      if (!isNaN(parsedFloat) && /^-?\d+(\.\d+)?$/.test(trimmed)) {
        val = parsedFloat;
      } else {
        // Try DMS regex e.g. "10 deg 46' 36.84\"" or "10° 46' 36.84\""
        const dmsMatch = trimmed.match(
          /(\d+(?:\.\d+)?)\s*(?:deg|°)?\s*(\d+(?:\.\d+)?)\s*['′]?\s*(\d+(?:\.\d+)?)\s*["″]?/i
        );
        if (dmsMatch) {
          const d = parseFloat(dmsMatch[1]) || 0;
          const m = parseFloat(dmsMatch[2]) || 0;
          const s = parseFloat(dmsMatch[3]) || 0;
          val = d + m / 60 + s / 3600;
        }
      }
    }

    if (val === undefined && Array.isArray(tagObj.value)) {
      const arr = tagObj.value;
      if (arr.length >= 3) {
        const parsePart = (part: unknown): number => {
          if (typeof part === 'number') return part;
          if (
            Array.isArray(part) &&
            part.length === 2 &&
            typeof part[0] === 'number' &&
            typeof part[1] === 'number' &&
            part[1] !== 0
          ) {
            return part[0] / part[1];
          }
          return 0;
        };
        const d = parsePart(arr[0]);
        const m = parsePart(arr[1]);
        const s = parsePart(arr[2]);
        val = d + m / 60 + s / 3600;
      } else if (arr.length === 1 && typeof arr[0] === 'number') {
        val = arr[0];
      }
    }
  }

  if (val === undefined || isNaN(val)) {
    return undefined;
  }

  // Apply reference tag (S / W should be negative)
  let ref: string | undefined;
  if (typeof refTag === 'string') {
    ref = refTag.trim().toUpperCase();
  } else if (refTag && typeof refTag === 'object') {
    const rObj = refTag as Record<string, unknown>;
    if (typeof rObj.description === 'string') {
      ref = rObj.description.trim().toUpperCase();
    } else if (Array.isArray(rObj.value) && typeof rObj.value[0] === 'string') {
      ref = rObj.value[0].trim().toUpperCase();
    } else if (typeof rObj.value === 'string') {
      ref = rObj.value.trim().toUpperCase();
    }
  }

  if (ref) {
    if (ref.startsWith('S') || ref.startsWith('W')) {
      val = -Math.abs(val);
    } else if (ref.startsWith('N') || ref.startsWith('E')) {
      val = Math.abs(val);
    }
  }

  return val;
}

/**
 * Extracts and parses original capture date from EXIF tags.
 */
function parseExifDate(tags: ExifDataResult): Date | undefined {
  const dateCandidates = [
    tags.exif?.DateTimeOriginal?.description,
    tags.exif?.DateTimeOriginal?.value,
    tags.DateTimeOriginal?.description,
    tags.DateTimeOriginal?.value,
    tags.exif?.CreateDate?.description,
    tags.CreateDate?.description,
    tags.exif?.DateTime?.description,
    tags.DateTime?.description,
  ];

  for (const raw of dateCandidates) {
    if (!raw) continue;
    if (raw instanceof Date && !isNaN(raw.getTime())) return raw;
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      const match = trimmed.match(/^(\d{4})[:-](\d{2})[:-](\d{2})(?:[T\s](\d{2}):(\d{2}):(\d{2}))?/);
      if (match) {
        const [, year, month, day, hours = '00', minutes = '00', seconds = '00'] = match;
        const d = new Date(
          Number(year),
          Number(month) - 1,
          Number(day),
          Number(hours),
          Number(minutes),
          Number(seconds)
        );
        if (!isNaN(d.getTime())) {
          return d;
        }
      }
      const direct = new Date(trimmed);
      if (!isNaN(direct.getTime())) {
        return direct;
      }
    }
  }
  return undefined;
}

/**
 * Extracts camera model string if present.
 */
function parseCameraModel(tags: ExifDataResult): string | undefined {
  const model =
    tags.exif?.Model?.description ||
    tags.exif?.Model?.value ||
    tags.Model?.description ||
    tags.Model?.value;

  if (typeof model === 'string' && model.trim()) {
    return model.trim();
  }
  return undefined;
}

/**
 * Extracts GPS metadata (latitude, longitude, takenAt, cameraModel) from an image file.
 * Returns null cleanly if no GPS tags or if invalid. Never throws.
 */
export async function extractGpsFromImage(
  file: File | Blob
): Promise<ExtractedImageMetadata | null> {
  if (!file) return null;

  try {
    const buffer = typeof (file as Blob).arrayBuffer === 'function'
      ? await (file as Blob).arrayBuffer()
      : (file as unknown as ArrayBuffer);

    const tags = (await ExifReader.load(buffer, { expanded: true })) as unknown as ExifDataResult;
    if (!tags) return null;

    let lat: number | undefined;
    let lng: number | undefined;

    // 1. Expanded format: tags.gps?.Latitude, tags.gps?.Longitude
    if (
      tags.gps &&
      typeof tags.gps.Latitude === 'number' &&
      !isNaN(tags.gps.Latitude) &&
      typeof tags.gps.Longitude === 'number' &&
      !isNaN(tags.gps.Longitude)
    ) {
      lat = tags.gps.Latitude;
      lng = tags.gps.Longitude;

      // Check LatitudeRef and LongitudeRef
      const latRef =
        tags.gps.LatitudeRef ||
        tags.exif?.GPSLatitudeRef?.description ||
        tags.exif?.GPSLatitudeRef?.value ||
        tags.GPSLatitudeRef?.description ||
        tags.GPSLatitudeRef?.value;
      const lngRef =
        tags.gps.LongitudeRef ||
        tags.exif?.GPSLongitudeRef?.description ||
        tags.exif?.GPSLongitudeRef?.value ||
        tags.GPSLongitudeRef?.description ||
        tags.GPSLongitudeRef?.value;

      if (typeof latRef === 'string') {
        const ref = latRef.trim().toUpperCase();
        if (ref.startsWith('S') && lat > 0) lat = -lat;
        else if (ref.startsWith('N') && lat < 0) lat = Math.abs(lat);
      }
      if (typeof lngRef === 'string') {
        const ref = lngRef.trim().toUpperCase();
        if (ref.startsWith('W') && lng > 0) lng = -lng;
        else if (ref.startsWith('E') && lng < 0) lng = Math.abs(lng);
      }
    } else {
      // 2. Standard rational / DMS tags
      const latTag = tags.exif?.GPSLatitude || tags.GPSLatitude;
      const latRefTag = tags.exif?.GPSLatitudeRef || tags.GPSLatitudeRef;
      const lngTag = tags.exif?.GPSLongitude || tags.GPSLongitude;
      const lngRefTag = tags.exif?.GPSLongitudeRef || tags.GPSLongitudeRef;

      lat = parseCoordinate(latTag, latRefTag);
      lng = parseCoordinate(lngTag, lngRefTag);
    }

    if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
      return null;
    }

    // Validate coordinate ranges: lat [-90, 90], lng [-180, 180]
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null;
    }

    const takenAt = parseExifDate(tags);
    const cameraModel = parseCameraModel(tags);

    return {
      lat,
      lng,
      ...(takenAt ? { takenAt } : {}),
      ...(cameraModel ? { cameraModel } : {}),
    };
  } catch {
    // Return null cleanly if no GPS tags or if invalid. Never throws.
    return null;
  }
}

/**
 * Checks if coordinates fall within Vietnam's approximate bounding box:
 * Latitude: [8.0, 24.0]
 * Longitude: [102.0, 110.0]
 */
export function isWithinVietnamBounds(lat: number, lng: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return false;
  }
  return lat >= 8.0 && lat <= 24.0 && lng >= 102.0 && lng <= 110.0;
}
