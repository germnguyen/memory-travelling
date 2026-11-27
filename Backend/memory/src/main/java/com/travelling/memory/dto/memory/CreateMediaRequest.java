package com.travelling.memory.dto.memory;

import com.travelling.memory.domain.MediaType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateMediaRequest {

    @NotBlank(message = "Storage key is required")
    private String storageKey;

    @NotNull(message = "Media type is required")
    private MediaType mediaType;

    private Long fileSize;

    private String thumbnailKey;

    private Integer width;

    private Integer height;

    private Integer durationSeconds;

    private Integer orderIndex;
}
