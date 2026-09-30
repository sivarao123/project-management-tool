package com.taskflow.backend.dto.auth;

public class UpdateProfileRequest {
    private String name;
    private String bio;
    private String avatarUrl;

    public UpdateProfileRequest() {}

    public UpdateProfileRequest(String name, String bio, String avatarUrl) {
        this.name = name;
        this.bio = bio;
        this.avatarUrl = avatarUrl;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
