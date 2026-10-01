package com.taskflow.backend.controller;

import com.taskflow.backend.dto.auth.*;
import com.taskflow.backend.security.UserPrincipal;
import com.taskflow.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

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

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Logged out successfully.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        UserDto user = authService.getCurrentUser(principal);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("user", user);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UpdateProfileRequest request) {
        UserDto updatedUser = authService.updateProfile(principal.getId(), request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Profile updated successfully.");
        response.put("user", updatedUser);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, Object>> updatePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdatePasswordRequest request) {
        authService.updatePassword(principal.getId(), request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Password updated successfully.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Password has been reset. You may now log in.");
        return ResponseEntity.ok(response);
    }
}
