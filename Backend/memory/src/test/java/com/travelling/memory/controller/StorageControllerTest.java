package com.travelling.memory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelling.memory.domain.User;
import com.travelling.memory.dto.storage.PresignedUploadRequest;
import com.travelling.memory.repository.UserRepository;
import com.travelling.memory.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class StorageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private User testUser;
    private String authToken;

    @BeforeEach
    void setUp() {
        testUser = userRepository.save(User.builder()
                .email("uploader_" + UUID.randomUUID() + "@example.com")
                .passwordHash("$2a$10$dummyHashValueForTestingStoragePurposes")
                .fullName("Storage Tester")
                .role("ROLE_USER")
                .build());

        authToken = jwtTokenProvider.generateAccessToken(testUser);
    }

    @Test
    @DisplayName("POST /api/v1/storage/upload-url - 401 when unauthenticated")
    void getPresignedUploadUrl_unauthenticated_returns401() throws Exception {
        PresignedUploadRequest request = PresignedUploadRequest.builder()
                .filename("photo.jpg")
                .contentType("image/jpeg")
                .fileSize(1024L)
                .build();

        mockMvc.perform(post("/api/v1/storage/upload-url")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/v1/storage/upload-url - 200 with presigned URL when authenticated")
    void getPresignedUploadUrl_authenticated_returnsPresignedUrl() throws Exception {
        PresignedUploadRequest request = PresignedUploadRequest.builder()
                .filename("vacation photo.jpg")
                .contentType("image/jpeg")
                .fileSize(2048L)
                .build();

        mockMvc.perform(post("/api/v1/storage/upload-url")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.storageKey", startsWith("memories/")))
                .andExpect(jsonPath("$.uploadUrl", notNullValue()))
                .andExpect(jsonPath("$.expiresInSeconds", greaterThan(0)));
    }

    @Test
    @DisplayName("POST /api/v1/storage/upload-url - 400 when filename is blank")
    void getPresignedUploadUrl_blankFilename_returns400() throws Exception {
        PresignedUploadRequest request = PresignedUploadRequest.builder()
                .filename("")
                .contentType("image/jpeg")
                .fileSize(1024L)
                .build();

        mockMvc.perform(post("/api/v1/storage/upload-url")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
