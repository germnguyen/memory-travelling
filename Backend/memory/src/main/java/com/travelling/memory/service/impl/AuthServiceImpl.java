package com.travelling.memory.service.impl;

import com.travelling.memory.domain.User;
import com.travelling.memory.dto.auth.AuthResponse;
import com.travelling.memory.dto.auth.LoginRequest;
import com.travelling.memory.dto.auth.RegisterRequest;
import com.travelling.memory.dto.auth.UserSummaryResponse;
import com.travelling.memory.exception.EmailAlreadyExistsException;
import com.travelling.memory.exception.InvalidCredentialsException;
import com.travelling.memory.exception.ResourceNotFoundException;
import com.travelling.memory.repository.UserRepository;
import com.travelling.memory.security.JwtTokenProvider;
import com.travelling.memory.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException("Email already in use: " + normalizedEmail);
        }

        User user = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .avatarUrl(request.getAvatarUrl())
                .role("ROLE_USER")
                .build();

        User savedUser = userRepository.save(user);
        log.info("Registered new user with id: {} and email: {}", savedUser.getId(), savedUser.getEmail());

        String token = jwtTokenProvider.generateAccessToken(savedUser);

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(1800)
                .user(UserSummaryResponse.fromEntity(savedUser))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        log.info("User logged in successfully with id: {}", user.getId());
        String token = jwtTokenProvider.generateAccessToken(user);

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(1800)
                .user(UserSummaryResponse.fromEntity(user))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummaryResponse getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return UserSummaryResponse.fromEntity(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummaryResponse getCurrentUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return UserSummaryResponse.fromEntity(user);
    }
}
