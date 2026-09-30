package com.taskflow.backend.dto.user;

public class UserProjectDto {
    private Long id;
    private String name;
    private String color;
    private String role;

    public UserProjectDto() {}

    public UserProjectDto(Long id, String name, String color, String role) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.role = role;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
