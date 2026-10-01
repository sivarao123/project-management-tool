package com.taskflow.backend.dto.auth;

public class AuthResponse {
    private boolean success = true;
    private String message;
    private String token;
    private UserDto user;

    public AuthResponse() {}

    public AuthResponse(boolean success, String message, String token, UserDto user) {
        this.success = success;
        this.message = message;
        this.token = token;
        this.user = user;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private boolean success = true;
        private String message;
        private String token;
        private UserDto user;

        public Builder success(boolean success) { this.success = success; return this; }
        public Builder message(String message) { this.message = message; return this; }
        public Builder token(String token) { this.token = token; return this; }
        public Builder user(UserDto user) { this.user = user; return this; }

        public AuthResponse build() {
            return new AuthResponse(success, message, token, user);
        }
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }
}
