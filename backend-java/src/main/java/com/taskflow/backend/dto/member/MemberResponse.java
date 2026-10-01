package com.taskflow.backend.dto.member;

import java.time.LocalDateTime;

public class MemberResponse {
    private Long memberId;
    private String role;
    private LocalDateTime joinedAt;
    private Long userId;
    private String name;
    private String email;
    private String avatarUrl;

    public MemberResponse() {}

    public MemberResponse(Long memberId, String role, LocalDateTime joinedAt, Long userId, String name, String email, String avatarUrl) {
        this.memberId = memberId;
        this.role = role;
        this.joinedAt = joinedAt;
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.avatarUrl = avatarUrl;
    }

    public Long getMemberId() { return memberId; }
    public void setMemberId(Long memberId) { this.memberId = memberId; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
