package com.travelling.memory.dto.memory;

import com.travelling.memory.domain.MediaType;
import com.travelling.memory.domain.Visibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemoryDetailResponse {

    private UUID id;
    private UUID userId;
    private String title;
    private String description;
    private LocalDate visitedAt;
    private Visibility visibility;
    private String shareToken;
    private LocationResponse location;

    @Builder.Default
    private List<MediaResponse> mediaList = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LocationResponse {
        private UUID id;
        private String name;
        private Double latitude;
        private Double longitude;
        private Integer provinceId;
        private String provinceName;
        private String district;
        private String commune;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MediaResponse {
        private UUID id;
        private MediaType mediaType;
        private String storageKey;
        private String thumbnailKey;
        private String downloadUrl;
        private String thumbnailDownloadUrl;
        private Long fileSize;
        private Integer width;
        private Integer height;
        private Integer durationSeconds;
        private Integer orderIndex;
        private LocalDateTime createdAt;
    }
}
