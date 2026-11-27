import { apiRequest } from "./apiClient";
import type { Memory, BoundingBoxQuery, MemoryMapMarkerResponse } from "../types";

export interface CreateMemoryPayload {
  title: string;
  description?: string;
  visitedAt: string;
  visibility: "PRIVATE" | "UNLISTED" | "PUBLIC";
  locationName: string;
  provinceId: number;
  latitude: number;
  longitude: number;
  mediaKeys: string[];
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
