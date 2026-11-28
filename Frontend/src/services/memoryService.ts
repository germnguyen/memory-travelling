import { apiRequest } from "./apiClient";
import type { Memory, BoundingBoxQuery, MemoryMapMarkerResponse } from "../types";

export interface CreateMediaPayload {
  storageKey: string;
  mediaType: "IMAGE" | "VIDEO";
  fileSize?: number;
  thumbnailKey?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  orderIndex?: number;
}

export interface CreateMemoryPayload {
  title: string;
  description?: string;
  visitedAt: string;
  visibility: "PRIVATE" | "UNLISTED" | "PUBLIC";
  locationName: string;
  provinceId?: number;
  district?: string;
  commune?: string;
  latitude: number;
  longitude: number;
  mediaList?: CreateMediaPayload[];
  mediaKeys?: string[];
}

export const memoryService = {
  async getMapMarkers(bbox: BoundingBoxQuery): Promise<MemoryMapMarkerResponse[]> {
    const params = new URLSearchParams({
      minLng: bbox.minLng.toString(),
      minLat: bbox.minLat.toString(),
      maxLng: bbox.maxLng.toString(),
      maxLat: bbox.maxLat.toString(),
    });
    return apiRequest<MemoryMapMarkerResponse[]>(`/memories/map?${params.toString()}`);
  },

  async getMemoriesInBounds(bbox: BoundingBoxQuery): Promise<Memory[]> {
    const params = new URLSearchParams({
      minLng: bbox.minLng.toString(),
      minLat: bbox.minLat.toString(),
      maxLng: bbox.maxLng.toString(),
      maxLat: bbox.maxLat.toString(),
    });
    return apiRequest<Memory[]>(`/memories/bounds?${params.toString()}`);
  },

  async getMyMemories(): Promise<Memory[]> {
    return apiRequest<Memory[]>("/memories/me");
  },

  async getMemoryById(id: string): Promise<Memory> {
    return apiRequest<Memory>(`/memories/${id}`);
  },

  async createMemory(payload: CreateMemoryPayload): Promise<Memory> {
    return apiRequest<Memory>("/memories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
