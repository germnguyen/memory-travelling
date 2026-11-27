package com.travelling.memory.controller;

import com.travelling.memory.domain.User;
import com.travelling.memory.dto.memory.CreateMemoryRequest;
import com.travelling.memory.dto.memory.MemoryDetailResponse;
import com.travelling.memory.dto.memory.MemoryMapMarkerResponse;
import com.travelling.memory.exception.UnauthorizedException;
import com.travelling.memory.repository.UserRepository;
import com.travelling.memory.service.MemoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/memories")
@RequiredArgsConstructor
public class MemoryController {

    private final MemoryService memoryService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<MemoryDetailResponse> createMemory(
            @Valid @RequestBody CreateMemoryRequest request,
            Authentication authentication
    ) {
        UUID userId = extractUserId(authentication);
        if (userId == null) {
            throw new UnauthorizedException("User is not authenticated");
        }

        MemoryDetailResponse response = memoryService.createMemory(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/map")
    public ResponseEntity<List<MemoryMapMarkerResponse>> getMemoriesInBoundingBox(
            @RequestParam double minLng,
            @RequestParam double minLat,
            @RequestParam double maxLng,
            @RequestParam double maxLat,
            Authentication authentication
    ) {
        UUID userId = extractUserId(authentication);
        List<MemoryMapMarkerResponse> markers = memoryService.getMemoriesInBoundingBox(
                minLng, minLat, maxLng, maxLat, userId
        );
        return ResponseEntity.ok(markers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MemoryDetailResponse> getMemoryById(
            @PathVariable UUID id,
            @RequestParam(required = false) String shareToken,
            Authentication authentication
    ) {
        UUID userId = extractUserId(authentication);
        MemoryDetailResponse response = memoryService.getMemoryById(id, userId, shareToken);
        return ResponseEntity.ok(response);
    }

    private UUID extractUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user.getId();
        }

        if (principal instanceof UserDetails userDetails) {
            return userRepository.findByEmail(userDetails.getUsername())
                    .map(User::getId)
                    .orElse(null);
        }

        if (authentication.getName() != null) {
            try {
                return UUID.fromString(authentication.getName());
            } catch (IllegalArgumentException e) {
                return userRepository.findByEmail(authentication.getName())
                        .map(User::getId)
                        .orElse(null);
            }
        }

        return null;
    }
}
