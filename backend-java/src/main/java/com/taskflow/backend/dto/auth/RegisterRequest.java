package com.taskflow.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {
    @NotBlank(message = "Name, email, and password are required.")
    private String name;

    @NotBlank(message = "Name, email, and password are required.")
    @Email(message = "Invalid email format.")
    private String email;

    @NotBlank(message = "Name, email, and password are required.")
    @Size(min = 6, message = "Password must be at least 6 characters long.")
    private String password;

    private String avatarUrl;
    private String bio;

    public RegisterRequest() {}

    public RegisterRequest(String name, String email, String password, String avatarUrl, String bio) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.avatarUrl = avatarUrl;
        this.bio = bio;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
}
