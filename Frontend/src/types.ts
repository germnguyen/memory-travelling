export type Visibility = "PRIVATE" | "UNLISTED" | "PUBLIC";

export type MediaType = "IMAGE" | "VIDEO";

export interface Province {
  id: number;
  code: string;
  name: string;
  region: "Bắc" | "Trung" | "Nam";
  latitude: number;
  longitude: number;
}

export interface Location {
  id: string;
  name: string;
  province?: Province;
  district?: string;
  commune?: string;
  latitude: number;
  longitude: number;
}

export interface MediaItem {
  id: string;
  mediaType: MediaType;
  storageKey: string;
  thumbnailKey?: string;
  downloadUrl?: string;
  fileSize: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  orderIndex: number;
}

export interface Memory {
  id: string;
  userId: string;
  title: string;
  description?: string;
  visitedAt: string; // ISO date YYYY-MM-DD
  visibility: Visibility;
  shareToken?: string;
  location: Location;
  mediaList: MediaItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Album {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  visibility: Visibility;
  memories?: Memory[];
  createdAt: string;
}

export interface PresignedUploadRequest {
  filename: string;
  contentType: string;
  fileSize: number;
}

export interface PresignedUploadResponse {
  storageKey: string;
  uploadUrl: string;
  expiresInSeconds: number;
}

export interface BoundingBoxQuery {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

// UI Showcase types (Preserved for backward compatibility)
export interface PhotoCard {
  src: string;
  alt: string;
  title: string;
  location: string;
  tilt: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Destination {
  id: string;
  rank: number;
  name: string;
  province: string;
  memoriesCount: number;
  trendingDelta: number;
  tag: string;
  imageUrl: string;
}

export interface MapMarkerPoint {
  id: string;
  name: string;
  province: string;
  xPercent: number;
  yPercent: number;
  memoriesCount: number;
  rating: number;
  coverImage: string;
  description: string;
}
