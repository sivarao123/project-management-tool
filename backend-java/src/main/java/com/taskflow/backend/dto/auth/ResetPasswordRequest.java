package com.taskflow.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ResetPasswordRequest {
    @NotBlank(message = "Email and new password are required.")
    @Email(message = "Invalid email format.")
    private String email;

    @NotBlank(message = "Email and new password are required.")
    @Size(min = 6, message = "Password must be at least 6 characters long.")
    private String newPassword;

    public ResetPasswordRequest() {}

    public ResetPasswordRequest(String email, String newPassword) {
        this.email = email;
        this.newPassword = newPassword;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}
