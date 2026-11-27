package com.travelling.memory.service;

import com.travelling.memory.dto.auth.AuthResponse;
import com.travelling.memory.dto.auth.LoginRequest;
import com.travelling.memory.dto.auth.RegisterRequest;
import com.travelling.memory.dto.auth.UserSummaryResponse;

import java.util.UUID;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserSummaryResponse getCurrentUser(UUID userId);

    UserSummaryResponse getCurrentUserByEmail(String email);
}
