package com.travelling.memory.service;

import com.travelling.memory.dto.memory.CreateMemoryRequest;
import com.travelling.memory.dto.memory.MemoryDetailResponse;
import com.travelling.memory.dto.memory.MemoryMapMarkerResponse;

import java.util.List;
import java.util.UUID;

public interface MemoryService {

    MemoryDetailResponse createMemory(UUID userId, CreateMemoryRequest request);

    List<MemoryMapMarkerResponse> getMemoriesInBoundingBox(
            double minLng,
            double minLat,
            double maxLng,
            double maxLat,
            UUID currentUserIdOrNull
    );

    MemoryDetailResponse getMemoryById(UUID memoryId, UUID currentUserIdOrNull, String shareToken);
}
