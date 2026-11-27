package com.travelling.memory.controller;

import com.travelling.memory.domain.User;
import com.travelling.memory.dto.auth.AuthResponse;
import com.travelling.memory.dto.auth.LoginRequest;
import com.travelling.memory.dto.auth.RegisterRequest;
import com.travelling.memory.dto.auth.UserSummaryResponse;
import com.travelling.memory.exception.UnauthorizedException;
import com.travelling.memory.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserSummaryResponse> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new UnauthorizedException("User is not authenticated");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return ResponseEntity.ok(authService.getCurrentUser(user.getId()));
        } else if (principal instanceof UserDetails userDetails) {
            return ResponseEntity.ok(authService.getCurrentUserByEmail(userDetails.getUsername()));
        } else if (authentication.getName() != null) {
            return ResponseEntity.ok(authService.getCurrentUserByEmail(authentication.getName()));
        }

        throw new UnauthorizedException("Unable to determine current user identity");
    }
}
