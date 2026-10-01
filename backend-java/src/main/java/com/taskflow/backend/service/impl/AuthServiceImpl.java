package com.taskflow.backend.service.impl;

import com.taskflow.backend.dto.auth.*;
import com.taskflow.backend.entity.User;
import com.taskflow.backend.exception.BadRequestException;
import com.taskflow.backend.exception.ResourceNotFoundException;
import com.taskflow.backend.exception.UnauthorizedException;
import com.taskflow.backend.repository.UserRepository;
import com.taskflow.backend.security.JwtTokenProvider;
import com.taskflow.backend.security.UserPrincipal;
import com.taskflow.backend.service.AuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            throw new BadRequestException("An account with this email already exists.");
        }

        String defaultAvatar = request.getAvatarUrl();
        if (defaultAvatar == null || defaultAvatar.isBlank()) {
            defaultAvatar = "https://ui-avatars.com/api/?name=" +
                    URLEncoder.encode(request.getName().trim(), StandardCharsets.UTF_8) +
                    "&background=6366F1&color=fff&bold=true";
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(cleanEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .avatarUrl(defaultAvatar)
                .role("Member")
                .bio(request.getBio() != null ? request.getBio() : "")
                .build();

        User savedUser = userRepository.save(user);

        String token = jwtTokenProvider.generateToken(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getName(),
                savedUser.getRole()
        );

        return AuthResponse.builder()
                .success(true)
                .message("Account registered successfully.")
                .token(token)
                .user(UserDto.fromEntity(savedUser))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        String token = jwtTokenProvider.generateToken(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole()
        );

        return AuthResponse.builder()
                .success(true)
                .message("Logged in successfully.")
                .token(token)
                .user(UserDto.fromEntity(user))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getCurrentUser(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User no longer exists."));
        return UserDto.fromEntity(user);
    }

    @Override
    @Transactional
    public UserDto updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        User updated = userRepository.save(user);
        return UserDto.fromEntity(updated);
    }

    @Override
    @Transactional
    public void updatePassword(Long userId, UpdatePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password does not match.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    public Map<String, Object> forgotPassword(ForgotPasswordRequest request) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "If that email exists, reset instructions have been simulated.");
        response.put("reset_token", "demo-reset-token-" + System.currentTimeMillis());
        return response;
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with this email address."));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
