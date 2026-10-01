package com.taskflow.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "labels")
public class Label {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 20)
    private String color = "#6366F1";

    public Label() {}

    public Label(Long id, Project project, String name, String color) {
        this.id = id;
        this.project = project;
        this.name = name;
        this.color = color != null ? color : "#6366F1";
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Project project;
        private String name;
        private String color = "#6366F1";

        public Builder id(Long id) { this.id = id; return this; }
        public Builder project(Project project) { this.project = project; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder color(String color) { this.color = color; return this; }

        public Label build() {
            return new Label(id, project, name, color);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}
