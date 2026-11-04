package com.travelling.memory.dto.storage;

public record PresignedUploadResponse(
    String storageKey,
    String uploadUrl,
    long expiresInSeconds
) {}

