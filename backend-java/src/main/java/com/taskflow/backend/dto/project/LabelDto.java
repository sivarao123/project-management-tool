package com.taskflow.backend.dto.project;

import com.taskflow.backend.entity.Label;

public class LabelDto {
    private Long id;
    private String name;
    private String color;

    public LabelDto() {}
    public LabelDto(Long id, String name, String color) {
        this.id = id;
        this.name = name;
        this.color = color;
    }

    public static LabelDto fromEntity(Label label) {
        if (label == null) return null;
        return new LabelDto(label.getId(), label.getName(), label.getColor());
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}
