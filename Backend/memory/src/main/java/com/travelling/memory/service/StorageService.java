package com.travelling.memory.service;

import com.travelling.memory.dto.storage.PresignedUploadResponse;

import java.time.Duration;

public interface StorageService {
    PresignedUploadResponse generatePresignedUploadUrl(String storageKey, String contentType, Duration ttl);
    String generatePresignedDownloadUrl(String storageKey, Duration ttl);
    void ensureBucketExists();
}

