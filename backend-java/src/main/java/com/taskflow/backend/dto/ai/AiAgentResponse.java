package com.taskflow.backend.dto.ai;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class AiAgentResponse {
    private boolean success = true;
    private String source;
    private List<AiStepDto> thoughts = new ArrayList<>();
    private String response;
    private List<AiActionItem> actions = new ArrayList<>();

    public AiAgentResponse() {}

    public AiAgentResponse(boolean success, String source, List<AiStepDto> thoughts, String response, List<AiActionItem> actions) {
        this.success = success;
        this.source = source;
        this.thoughts = thoughts != null ? thoughts : new ArrayList<>();
        this.response = response;
        this.actions = actions != null ? actions : new ArrayList<>();
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public List<AiStepDto> getThoughts() { return thoughts; }
    public void setThoughts(List<AiStepDto> thoughts) { this.thoughts = thoughts; }
    public String getResponse() { return response; }
    public void setResponse(String response) { this.response = response; }
    public List<AiActionItem> getActions() { return actions; }
    public void setActions(List<AiActionItem> actions) { this.actions = actions; }
}
