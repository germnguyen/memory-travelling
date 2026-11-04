package com.travelling.memory.service;

import com.travelling.memory.dto.storage.PresignedUploadResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class MinioStorageServiceTest {

    @Autowired
    private StorageService storageService;

    @Test
    void shouldGenerateValidPresignedUploadUrl() {
        PresignedUploadResponse res = storageService.generatePresignedUploadUrl("memories/test-photo.webp", "image/webp", Duration.ofMinutes(15));
        assertThat(res).isNotNull();
        assertThat(res.storageKey()).isEqualTo("memories/test-photo.webp");
        assertThat(res.uploadUrl()).contains("localhost:9000").contains("X-Amz-Signature");
    }

    @Test
    void shouldGenerateStrictPresignedDownloadUrlWithExpiry() {
        String downloadUrl = storageService.generatePresignedDownloadUrl("memories/test-photo.webp", Duration.ofMinutes(15));
        assertThat(downloadUrl).isNotNull();
        assertThat(downloadUrl).contains("localhost:9000").contains("X-Amz-Expires=900").contains("X-Amz-Signature");
    }
}

