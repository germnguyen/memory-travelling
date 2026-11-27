package com.travelling.memory.service.impl;

import com.travelling.memory.domain.*;
import com.travelling.memory.dto.memory.*;
import com.travelling.memory.dto.memory.MemoryDetailResponse.MediaResponse;
import com.travelling.memory.dto.memory.MemoryDetailResponse.LocationResponse;
import com.travelling.memory.exception.ResourceNotFoundException;
import com.travelling.memory.repository.LocationRepository;
import com.travelling.memory.repository.MemoryRepository;
import com.travelling.memory.repository.ProvinceRepository;
import com.travelling.memory.repository.UserRepository;
import com.travelling.memory.service.MemoryService;
import com.travelling.memory.service.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemoryServiceImpl implements MemoryService {

    private static final Duration PRESIGNED_URL_TTL = Duration.ofMinutes(30);

    private final MemoryRepository memoryRepository;
    private final LocationRepository locationRepository;
    private final ProvinceRepository provinceRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @Override
    @Transactional
    public MemoryDetailResponse createMemory(UUID userId, CreateMemoryRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Point coordinates = geometryFactory.createPoint(new Coordinate(request.getLongitude(), request.getLatitude()));

        Province province = null;
        if (request.getProvinceId() != null) {
            province = provinceRepository.findById(request.getProvinceId()).orElse(null);
        }

        Location location = Location.builder()
                .name(request.getLocationName())
                .province(province)
                .district(request.getDistrict())
                .commune(request.getCommune())
                .coordinates(coordinates)
                .build();
        location = locationRepository.save(location);

        Visibility visibility = request.getVisibility() != null ? request.getVisibility() : Visibility.PUBLIC;
        String shareToken = null;
        if (visibility == Visibility.UNLISTED) {
            shareToken = UUID.randomUUID().toString().replace("-", "");
        }

        Memory memory = Memory.builder()
                .user(user)
                .location(location)
                .title(request.getTitle())
                .description(request.getDescription())
                .visitedAt(request.getVisitedAt())
                .visibility(visibility)
                .shareToken(shareToken)
                .build();

        if (request.getMediaList() != null) {
            for (CreateMediaRequest mediaReq : request.getMediaList()) {
                Media media = Media.builder()
                        .memory(memory)
                        .storageKey(mediaReq.getStorageKey())
                        .thumbnailKey(mediaReq.getThumbnailKey())
                        .mediaType(mediaReq.getMediaType())
                        .fileSize(mediaReq.getFileSize() != null ? mediaReq.getFileSize() : 0L)
                        .width(mediaReq.getWidth())
                        .height(mediaReq.getHeight())
                        .durationSeconds(mediaReq.getDurationSeconds())
                        .orderIndex(mediaReq.getOrderIndex() != null ? mediaReq.getOrderIndex() : 0)
                        .build();
                memory.getMediaList().add(media);
            }
        }

        Memory savedMemory = memoryRepository.save(memory);
        log.info("Created memory with id: {} for user: {}", savedMemory.getId(), userId);

        return mapToDetailResponse(savedMemory);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MemoryMapMarkerResponse> getMemoriesInBoundingBox(
            double minLng,
            double minLat,
            double maxLng,
            double maxLat,
            UUID currentUserIdOrNull
    ) {
        List<Memory> memories;
        if (currentUserIdOrNull != null) {
            memories = memoryRepository.findMemoriesInBoundingBoxForUser(minLng, minLat, maxLng, maxLat, currentUserIdOrNull);
        } else {
            memories = memoryRepository.findPublicMemoriesInBoundingBox(minLng, minLat, maxLng, maxLat);
        }

        if (memories.isEmpty()) {
            return Collections.emptyList();
        }

        // Avoid N+1: batch-fetch locations with provinces
        Set<UUID> locationIds = memories.stream()
                .map(m -> m.getLocation().getId())
                .collect(Collectors.toSet());

        Map<UUID, Location> locationMap = locationRepository.findAllByIdInWithProvince(locationIds).stream()
                .collect(Collectors.toMap(Location::getId, Function.identity(), (existing, replacing) -> existing));

        List<MemoryMapMarkerResponse> markerResponses = new ArrayList<>(memories.size());
        for (Memory memory : memories) {
            Location location = locationMap.getOrDefault(memory.getLocation().getId(), memory.getLocation());

            String coverThumbnailUrl = null;
            String coverStorageKey = null;

            if (memory.getMediaList() != null && !memory.getMediaList().isEmpty()) {
                Media coverMedia = memory.getMediaList().stream()
                        .min(Comparator.comparingInt(m -> m.getOrderIndex() != null ? m.getOrderIndex() : 0))
                        .orElse(memory.getMediaList().get(0));

                String key = (coverMedia.getThumbnailKey() != null && !coverMedia.getThumbnailKey().isBlank())
                        ? coverMedia.getThumbnailKey()
                        : coverMedia.getStorageKey();

                if (key != null && !key.isBlank()) {
                    coverStorageKey = key;
                    coverThumbnailUrl = storageService.generatePresignedDownloadUrl(key, PRESIGNED_URL_TTL);
                }
            }

            Double lat = (location.getCoordinates() != null) ? location.getCoordinates().getY() : null;
            Double lng = (location.getCoordinates() != null) ? location.getCoordinates().getX() : null;
            String provinceName = (location.getProvince() != null) ? location.getProvince().getName() : null;

            markerResponses.add(MemoryMapMarkerResponse.builder()
                    .memoryId(memory.getId())
                    .locationId(location.getId())
                    .title(memory.getTitle())
                    .latitude(lat)
                    .longitude(lng)
                    .provinceName(provinceName)
                    .coverThumbnailUrl(coverThumbnailUrl)
                    .coverStorageKey(coverStorageKey)
                    .visitedAt(memory.getVisitedAt())
                    .visibility(memory.getVisibility())
                    .build());
        }

        return markerResponses;
    }

    @Override
    @Transactional(readOnly = true)
    public MemoryDetailResponse getMemoryById(UUID memoryId, UUID currentUserIdOrNull, String shareToken) {
        Memory memory = memoryRepository.findById(memoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Memory not found with id: " + memoryId));

        boolean isOwner = (currentUserIdOrNull != null && memory.getUser().getId().equals(currentUserIdOrNull));

        if (memory.getVisibility() == Visibility.PUBLIC) {
            // Accessible to all
        } else if (memory.getVisibility() == Visibility.UNLISTED) {
            boolean hasValidToken = (shareToken != null && shareToken.equals(memory.getShareToken()));
            if (!hasValidToken && !isOwner) {
                throw new AccessDeniedException("Access denied: invalid share token or unlisted permissions");
            }
        } else if (memory.getVisibility() == Visibility.PRIVATE) {
            if (!isOwner) {
                throw new AccessDeniedException("Access denied: memory is private");
            }
        }

        return mapToDetailResponse(memory);
    }

    private MemoryDetailResponse mapToDetailResponse(Memory memory) {
        Location loc = memory.getLocation();
        MemoryDetailResponse.LocationResponse locationResponse = null;
        if (loc != null) {
            locationResponse = MemoryDetailResponse.LocationResponse.builder()
                    .id(loc.getId())
                    .name(loc.getName())
                    .latitude(loc.getCoordinates() != null ? loc.getCoordinates().getY() : null)
                    .longitude(loc.getCoordinates() != null ? loc.getCoordinates().getX() : null)
                    .provinceId(loc.getProvince() != null ? loc.getProvince().getId() : null)
                    .provinceName(loc.getProvince() != null ? loc.getProvince().getName() : null)
                    .district(loc.getDistrict())
                    .commune(loc.getCommune())
                    .build();
        }

        List<MediaResponse> mediaResponses = new ArrayList<>();
        if (memory.getMediaList() != null) {
            for (Media m : memory.getMediaList()) {
                String downloadUrl = null;
                if (m.getStorageKey() != null && !m.getStorageKey().isBlank()) {
                    downloadUrl = storageService.generatePresignedDownloadUrl(m.getStorageKey(), PRESIGNED_URL_TTL);
                }

                String thumbUrl = null;
                if (m.getThumbnailKey() != null && !m.getThumbnailKey().isBlank()) {
                    thumbUrl = storageService.generatePresignedDownloadUrl(m.getThumbnailKey(), PRESIGNED_URL_TTL);
                }

                mediaResponses.add(MediaResponse.builder()
                        .id(m.getId())
                        .mediaType(m.getMediaType())
                        .storageKey(m.getStorageKey())
                        .thumbnailKey(m.getThumbnailKey())
                        .downloadUrl(downloadUrl)
                        .thumbnailDownloadUrl(thumbUrl)
                        .fileSize(m.getFileSize())
                        .width(m.getWidth())
                        .height(m.getHeight())
                        .durationSeconds(m.getDurationSeconds())
                        .orderIndex(m.getOrderIndex())
                        .createdAt(m.getCreatedAt())
                        .build());
            }
        }

        return MemoryDetailResponse.builder()
                .id(memory.getId())
                .userId(memory.getUser().getId())
                .title(memory.getTitle())
                .description(memory.getDescription())
                .visitedAt(memory.getVisitedAt())
                .visibility(memory.getVisibility())
                .shareToken(memory.getShareToken())
                .location(locationResponse)
                .mediaList(mediaResponses)
                .createdAt(memory.getCreatedAt())
                .updatedAt(memory.getUpdatedAt())
                .build();
    }
}
