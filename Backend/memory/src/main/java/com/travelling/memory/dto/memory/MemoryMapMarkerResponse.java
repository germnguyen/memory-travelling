package com.travelling.memory.dto.memory;

import com.travelling.memory.domain.Visibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemoryMapMarkerResponse {

    private UUID memoryId;
    private UUID locationId;
    private String title;
    private Double latitude;
    private Double longitude;
    private String provinceName;
    private String coverThumbnailUrl;
    private String coverStorageKey;
    private LocalDate visitedAt;
    private Visibility visibility;
}
