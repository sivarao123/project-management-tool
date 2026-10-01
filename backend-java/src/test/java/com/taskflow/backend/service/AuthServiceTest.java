package com.taskflow.backend.service;

import com.taskflow.backend.dto.auth.AuthResponse;
import com.taskflow.backend.dto.auth.LoginRequest;
import com.taskflow.backend.dto.auth.RegisterRequest;
import com.taskflow.backend.entity.User;
import com.taskflow.backend.exception.BadRequestException;
import com.taskflow.backend.exception.UnauthorizedException;
import com.taskflow.backend.repository.UserRepository;
import com.taskflow.backend.security.JwtTokenProvider;
import com.taskflow.backend.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .name("Alex Chen")
                .email("alex@taskflow.dev")
                .passwordHash("$2a$10$hashedpassword")
                .role("Member")
                .build();
    }

    @Test
    @DisplayName("register() successfully creates user and generates JWT")
    void testRegisterSuccess() {
        RegisterRequest request = new RegisterRequest("Alex Chen", "alex@taskflow.dev", "password123", null, null);

        when(userRepository.existsByEmailIgnoreCase("alex@taskflow.dev")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("$2a$10$hashedpassword");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(jwtTokenProvider.generateToken(eq(1L), eq("alex@taskflow.dev"), eq("Alex Chen"), eq("Member")))
                .thenReturn("mock-jwt-token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals("mock-jwt-token", response.getToken());
        assertEquals("alex@taskflow.dev", response.getUser().getEmail());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("register() rejects duplicate email with BadRequestException")
    void testRegisterDuplicateEmail() {
        RegisterRequest request = new RegisterRequest("Alex Chen", "alex@taskflow.dev", "password123", null, null);
        when(userRepository.existsByEmailIgnoreCase("alex@taskflow.dev")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("login() succeeds with valid credentials")
    void testLoginSuccess() {
        LoginRequest request = new LoginRequest("alex@taskflow.dev", "password123");

        when(userRepository.findByEmailIgnoreCase("alex@taskflow.dev")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("password123", sampleUser.getPasswordHash())).thenReturn(true);
        when(jwtTokenProvider.generateToken(eq(1L), eq("alex@taskflow.dev"), eq("Alex Chen"), eq("Member")))
                .thenReturn("mock-jwt-token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals("mock-jwt-token", response.getToken());
        assertEquals("Alex Chen", response.getUser().getName());
    }

    @Test
    @DisplayName("login() rejects invalid password with UnauthorizedException")
    void testLoginWrongPassword() {
        LoginRequest request = new LoginRequest("alex@taskflow.dev", "wrongpass");

        when(userRepository.findByEmailIgnoreCase("alex@taskflow.dev")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongpass", sampleUser.getPasswordHash())).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> authService.login(request));
    }
}
