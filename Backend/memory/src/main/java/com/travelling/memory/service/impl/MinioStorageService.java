package com.travelling.memory.service.impl;

import com.travelling.memory.dto.storage.PresignedUploadResponse;
import com.travelling.memory.service.StorageService;
import io.minio.BucketExistsArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.http.Method;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinioStorageService implements StorageService {

    private final MinioClient minioClient;

    @Value("${minio.bucket-name:memory-media}")
    private String bucketName;

    @PostConstruct
    @Override
    public void ensureBucketExists() {
        try {
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!found) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
                log.info("Successfully created MinIO bucket: {}", bucketName);
            } else {
                log.info("MinIO bucket '{}' already exists.", bucketName);
            }
        } catch (Exception e) {
            log.warn("Could not check/create MinIO bucket on startup: {}", e.getMessage());
        }
    }

    @Override
    public PresignedUploadResponse generatePresignedUploadUrl(String storageKey, String contentType, Duration ttl) {
        try {
            int expiry = (int) ttl.toSeconds();
            Map<String, String> extraHeaders = new HashMap<>();
            if (contentType != null && !contentType.isBlank()) {
                extraHeaders.put("Content-Type", contentType);
            }

            String url = minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .method(Method.PUT)
                    .bucket(bucketName)
                    .object(storageKey)
                    .expiry(expiry, TimeUnit.SECONDS)
                    .extraHeaders(extraHeaders)
                    .build()
            );

            return new PresignedUploadResponse(storageKey, url, expiry);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate presigned upload URL: " + e.getMessage(), e);
        }
    }

    @Override
    public String generatePresignedDownloadUrl(String storageKey, Duration ttl) {
        try {
            int expiry = (int) ttl.toSeconds();
            return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(bucketName)
                    .object(storageKey)
                    .expiry(expiry, TimeUnit.SECONDS)
                    .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate presigned download URL: " + e.getMessage(), e);
        }
    }
}

