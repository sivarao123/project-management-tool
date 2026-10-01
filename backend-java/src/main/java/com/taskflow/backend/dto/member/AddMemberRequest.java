package com.taskflow.backend.dto.member;

public class AddMemberRequest {
    private String email;
    private Long userId;
    private String role;

    public AddMemberRequest() {}

    public AddMemberRequest(String email, Long userId, String role) {
        this.email = email;
        this.userId = userId;
        this.role = role;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
