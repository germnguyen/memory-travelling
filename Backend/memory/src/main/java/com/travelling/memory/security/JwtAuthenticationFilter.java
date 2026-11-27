package com.travelling.memory.security;

import com.travelling.memory.domain.User;
import com.travelling.memory.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                UUID userId = null;
                try {
                    userId = tokenProvider.getUserIdFromToken(jwt);
                } catch (Exception e) {
                    log.debug("Could not parse UUID userId from token: {}", e.getMessage());
                }

                Optional<User> userOptional = Optional.empty();
                if (userId != null) {
                    userOptional = userRepository.findById(userId);
                }

                if (userOptional.isEmpty()) {
                    try {
                        String email = tokenProvider.getEmailFromToken(jwt);
                        if (StringUtils.hasText(email)) {
                            userOptional = userRepository.findByEmail(email);
                        }
                    } catch (Exception e) {
                        log.debug("Could not parse email from token: {}", e.getMessage());
                    }
                }

                if (userOptional.isPresent()) {
                    User user = userOptional.get();
                    String role = user.getRole();
                    if (role == null || role.isBlank()) {
                        role = "ROLE_USER";
                    } else if (!role.startsWith("ROLE_")) {
                        role = "ROLE_" + role;
                    }
                    List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(role));

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(user, null, authorities);
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
