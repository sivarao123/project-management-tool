package com.taskflow.backend.service;

import com.taskflow.backend.dto.auth.*;
import com.taskflow.backend.security.UserPrincipal;

import java.util.Map;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    UserDto getCurrentUser(UserPrincipal principal);
    UserDto updateProfile(Long userId, UpdateProfileRequest request);
    void updatePassword(Long userId, UpdatePasswordRequest request);
    Map<String, Object> forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
}
