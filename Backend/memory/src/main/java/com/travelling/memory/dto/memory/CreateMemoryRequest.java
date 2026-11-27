package com.travelling.memory.dto.memory;

import com.travelling.memory.domain.Visibility;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateMemoryRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Visited date is required")
    private LocalDate visitedAt;

    @Builder.Default
    private Visibility visibility = Visibility.PUBLIC;

    @NotBlank(message = "Location name is required")
    private String locationName;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    private Integer provinceId;

    private String district;

    private String commune;

    @Valid
    @Builder.Default
    private List<CreateMediaRequest> mediaList = new ArrayList<>();
}
