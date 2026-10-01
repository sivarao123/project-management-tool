package com.taskflow.backend.dto.ai;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class AiExecuteActionsRequest {

    @NotNull(message = "Target project ID is required.")
    private Long projectId;

    @NotEmpty(message = "No actions to execute.")
    private List<AiActionItem> actions;

    public AiExecuteActionsRequest() {}

    public AiExecuteActionsRequest(Long projectId, List<AiActionItem> actions) {
        this.projectId = projectId;
        this.actions = actions;
    }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public List<AiActionItem> getActions() { return actions; }
    public void setActions(List<AiActionItem> actions) { this.actions = actions; }
}
