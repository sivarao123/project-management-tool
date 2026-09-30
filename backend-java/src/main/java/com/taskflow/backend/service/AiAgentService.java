package com.taskflow.backend.service;

import com.taskflow.backend.dto.ai.AiActionItem;
import com.taskflow.backend.dto.ai.AiAgentResponse;
import com.taskflow.backend.dto.ai.AiEnhanceTaskResponse;

import java.util.List;
import java.util.Map;

public interface AiAgentService {
    AiAgentResponse runAgentChat(String prompt, Long projectId, Long userId);
    Map<String, Object> breakdownFeature(String prompt, Long projectId);
    AiEnhanceTaskResponse enhanceTask(String title, String description);
    Map<String, Object> generateStandup(Long projectId);
    Map<String, Object> executeActions(Long projectId, Long userId, List<AiActionItem> actions);
}
