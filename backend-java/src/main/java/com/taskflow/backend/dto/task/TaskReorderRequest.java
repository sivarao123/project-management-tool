package com.taskflow.backend.dto.task;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class TaskReorderRequest {

    @NotEmpty(message = "Items array is required.")
    private List<ReorderItem> items;

    public static class ReorderItem {
        private Long id;
        private String status;
        private Integer position;

        public ReorderItem() {}
        public ReorderItem(Long id, String status, Integer position) {
            this.id = id;
            this.status = status;
            this.position = position;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public Integer getPosition() { return position; }
        public void setPosition(Integer position) { this.position = position; }
    }

    public TaskReorderRequest() {}
    public TaskReorderRequest(List<ReorderItem> items) { this.items = items; }

    public List<ReorderItem> getItems() { return items; }
    public void setItems(List<ReorderItem> items) { this.items = items; }
}
