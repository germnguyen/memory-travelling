package com.travelling.memory.service;

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
import com.travelling.memory.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    @DisplayName("register should succeed when email is not taken")
    void registerShouldSucceed() {
        RegisterRequest request = RegisterRequest.builder()
                .email("newuser@example.com")
                .password("password123")
                .fullName("New User")
                .avatarUrl("https://example.com/avatar.png")
                .build();

        UUID generatedId = UUID.randomUUID();
        User savedUser = User.builder()
                .id(generatedId)
                .email("newuser@example.com")
                .passwordHash("hashedPass")
                .fullName("New User")
                .avatarUrl("https://example.com/avatar.png")
                .role("ROLE_USER")
                .build();

        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashedPass");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtTokenProvider.generateAccessToken(savedUser)).thenReturn("mocked.jwt.token");

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("mocked.jwt.token");
        assertThat(response.getTokenType()).isEqualTo("Bearer");
        assertThat(response.getExpiresIn()).isEqualTo(1800);
        assertThat(response.getUser()).isNotNull();
        assertThat(response.getUser().getId()).isEqualTo(generatedId);
        assertThat(response.getUser().getEmail()).isEqualTo("newuser@example.com");

        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("register should throw EmailAlreadyExistsException when email is taken")
    void registerShouldThrowWhenEmailExists() {
        RegisterRequest request = RegisterRequest.builder()
                .email("taken@example.com")
                .password("password123")
                .fullName("Taken User")
                .build();

        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(EmailAlreadyExistsException.class)
                .hasMessageContaining("Email already in use");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("login should succeed with valid credentials")
    void loginShouldSucceed() {
        LoginRequest request = LoginRequest.builder()
                .email("user@example.com")
                .password("correctPassword")
                .build();

        User user = User.builder()
                .id(UUID.randomUUID())
                .email("user@example.com")
                .passwordHash("hashedPass")
                .fullName("Valid User")
                .role("ROLE_USER")
                .build();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correctPassword", "hashedPass")).thenReturn(true);
        when(jwtTokenProvider.generateAccessToken(user)).thenReturn("mocked.jwt.token");

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("mocked.jwt.token");
        assertThat(response.getUser().getEmail()).isEqualTo("user@example.com");
    }

    @Test
    @DisplayName("login should throw InvalidCredentialsException when user not found")
    void loginShouldThrowWhenUserNotFound() {
        LoginRequest request = LoginRequest.builder()
                .email("notfound@example.com")
                .password("anyPassword")
                .build();

        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessageContaining("Invalid email or password");
    }

    @Test
    @DisplayName("login should throw InvalidCredentialsException when password does not match")
    void loginShouldThrowWhenPasswordDoesNotMatch() {
        LoginRequest request = LoginRequest.builder()
                .email("user@example.com")
                .password("wrongPassword")
                .build();

        User user = User.builder()
                .id(UUID.randomUUID())
                .email("user@example.com")
                .passwordHash("hashedPass")
                .build();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPassword", "hashedPass")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessageContaining("Invalid email or password");
    }

    @Test
    @DisplayName("getCurrentUser by ID should return user summary")
    void getCurrentUserByIdShouldSucceed() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .email("me@example.com")
                .fullName("Current User")
                .role("ROLE_USER")
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        UserSummaryResponse response = authService.getCurrentUser(userId);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(userId);
        assertThat(response.getEmail()).isEqualTo("me@example.com");
    }

    @Test
    @DisplayName("getCurrentUser by ID should throw ResourceNotFoundException when user not found")
    void getCurrentUserByIdShouldThrowWhenNotFound() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.getCurrentUser(userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found with id");
    }
}
