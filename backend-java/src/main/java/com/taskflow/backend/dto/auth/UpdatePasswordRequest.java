package com.taskflow.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdatePasswordRequest {
    @NotBlank(message = "Please provide current and new passwords.")
    private String currentPassword;

    @NotBlank(message = "Please provide current and new passwords.")
    @Size(min = 6, message = "New password must be at least 6 characters long.")
    private String newPassword;

    public UpdatePasswordRequest() {}

    public UpdatePasswordRequest(String currentPassword, String newPassword) {
        this.currentPassword = currentPassword;
        this.newPassword = newPassword;
    }

    public String getCurrentPassword() { return currentPassword; }
    public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }
    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}
