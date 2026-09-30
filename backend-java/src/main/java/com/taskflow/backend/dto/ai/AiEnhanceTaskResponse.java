package com.taskflow.backend.dto.ai;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class AiEnhanceTaskResponse {
    private boolean success = true;
    private String enhancedDescription;
    private List<Map<String, Object>> suggestedSubtasks = new ArrayList<>();
    private String suggestedPriority;
    private int suggestedEstimateDays;

    public AiEnhanceTaskResponse() {}

    public AiEnhanceTaskResponse(boolean success, String enhancedDescription,
                                List<Map<String, Object>> suggestedSubtasks,
                                String suggestedPriority, int suggestedEstimateDays) {
        this.success = success;
        this.enhancedDescription = enhancedDescription;
        this.suggestedSubtasks = suggestedSubtasks != null ? suggestedSubtasks : new ArrayList<>();
        this.suggestedPriority = suggestedPriority;
        this.suggestedEstimateDays = suggestedEstimateDays;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getEnhancedDescription() { return enhancedDescription; }
    public void setEnhancedDescription(String enhancedDescription) { this.enhancedDescription = enhancedDescription; }
    public List<Map<String, Object>> getSuggestedSubtasks() { return suggestedSubtasks; }
    public void setSuggestedSubtasks(List<Map<String, Object>> suggestedSubtasks) { this.suggestedSubtasks = suggestedSubtasks; }
    public String getSuggestedPriority() { return suggestedPriority; }
    public void setSuggestedPriority(String suggestedPriority) { this.suggestedPriority = suggestedPriority; }
    public int getSuggestedEstimateDays() { return suggestedEstimateDays; }
    public void setSuggestedEstimateDays(int suggestedEstimateDays) { this.suggestedEstimateDays = suggestedEstimateDays; }
}
