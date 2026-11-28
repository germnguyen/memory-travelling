package com.travelling.memory.controller;

import com.travelling.memory.dto.storage.PresignedUploadRequest;
import com.travelling.memory.dto.storage.PresignedUploadResponse;
import com.travelling.memory.service.StorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/storage")
@RequiredArgsConstructor
public class StorageController {

    private final StorageService storageService;

    @PostMapping("/upload-url")
    public ResponseEntity<PresignedUploadResponse> getPresignedUploadUrl(
            @Valid @RequestBody PresignedUploadRequest request
    ) {
        String cleanName = sanitizeFilename(request.getFilename());
        String storageKey = "memories/" + UUID.randomUUID() + "_" + cleanName;

        log.debug("Generating presigned upload URL for key: {}, contentType: {}", storageKey, request.getContentType());
        PresignedUploadResponse response = storageService.generatePresignedUploadUrl(
                storageKey,
                request.getContentType(),
                Duration.ofMinutes(15)
        );

        return ResponseEntity.ok(response);
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "file";
        }
        String baseName = filename.replaceAll(".*[/\\\\]", "");
        String sanitized = baseName.replaceAll("[^a-zA-Z0-9._-]", "_");
        return sanitized.isBlank() ? "file" : sanitized;
    }
}
