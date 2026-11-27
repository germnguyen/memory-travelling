package com.travelling.memory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelling.memory.domain.User;
import com.travelling.memory.dto.auth.LoginRequest;
import com.travelling.memory.dto.auth.RegisterRequest;
import com.travelling.memory.repository.UserRepository;
import com.travelling.memory.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("POST /api/v1/auth/register should create new user and return auth tokens")
    void shouldRegisterNewUserSuccessfully() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("test.register@example.com")
                .password("secretPass123")
                .fullName("Test Register User")
                .avatarUrl("https://example.com/avatar.jpg")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.expiresIn", notNullValue()))
                .andExpect(jsonPath("$.user.email", is("test.register@example.com")))
                .andExpect(jsonPath("$.user.fullName", is("Test Register User")))
                .andExpect(jsonPath("$.user.avatarUrl", is("https://example.com/avatar.jpg")))
                .andExpect(jsonPath("$.user.role", is("ROLE_USER")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register should return 409 Conflict when email already exists")
    void shouldReturnConflictWhenEmailAlreadyExists() throws Exception {
        User existingUser = User.builder()
                .email("duplicate@example.com")
                .passwordHash(passwordEncoder.encode("existingPass123"))
                .fullName("Existing User")
                .role("ROLE_USER")
                .build();
        userRepository.save(existingUser);

        RegisterRequest request = RegisterRequest.builder()
                .email("duplicate@example.com")
                .password("newPass123")
                .fullName("Duplicate User")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/v1/auth/register should return 400 Bad Request when input is invalid")
    void shouldReturnBadRequestWhenRegisterValidationFails() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("invalid-email")
                .password("123")
                .fullName("")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/v1/auth/login should return auth token when credentials are valid")
    void shouldLoginSuccessfully() throws Exception {
        User user = User.builder()
                .email("user.login@example.com")
                .passwordHash(passwordEncoder.encode("correctPassword123"))
                .fullName("Login User")
                .role("ROLE_USER")
                .build();
        userRepository.save(user);

        LoginRequest request = LoginRequest.builder()
                .email("user.login@example.com")
                .password("correctPassword123")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.user.email", is("user.login@example.com")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login should return 401 Unauthorized when password is wrong")
    void shouldReturnUnauthorizedWhenPasswordIsWrong() throws Exception {
        User user = User.builder()
                .email("user.login@example.com")
                .passwordHash(passwordEncoder.encode("correctPassword123"))
                .fullName("Login User")
                .role("ROLE_USER")
                .build();
        userRepository.save(user);

        LoginRequest request = LoginRequest.builder()
                .email("user.login@example.com")
                .password("wrongPassword123")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/auth/me should return current user info when authenticated")
    void shouldReturnCurrentUserWhenAuthenticated() throws Exception {
        User user = User.builder()
                .email("me.user@example.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Me User")
                .role("ROLE_USER")
                .build();
        user = userRepository.save(user);

        String token = jwtTokenProvider.generateAccessToken(user);

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(user.getId().toString())))
                .andExpect(jsonPath("$.email", is("me.user@example.com")))
                .andExpect(jsonPath("$.fullName", is("Me User")));
    }

    @Test
    @DisplayName("GET /api/v1/auth/me should return 401 Unauthorized when unauthenticated")
    void shouldReturnUnauthorizedWhenNoToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}
