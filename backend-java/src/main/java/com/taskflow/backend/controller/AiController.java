package com.taskflow.backend.controller;

import com.taskflow.backend.dto.ai.*;
import com.taskflow.backend.security.UserPrincipal;
import com.taskflow.backend.service.AiAgentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiAgentService aiAgentService;

    public AiController(AiAgentService aiAgentService) {
        this.aiAgentService = aiAgentService;
    }

    @PostMapping("/agent")
    public ResponseEntity<AiAgentResponse> agentChat(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AiAgentRequest request) {
        AiAgentResponse response = aiAgentService.runAgentChat(request.getPrompt(), request.getProjectId(), principal.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/breakdown")
    public ResponseEntity<Map<String, Object>> breakdownFeature(@Valid @RequestBody AiBreakdownRequest request) {
        Map<String, Object> data = aiAgentService.breakdownFeature(request.getPrompt(), request.getProjectId());
        Map<String, Object> response = new HashMap<>(data);
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/enhance-task")
    public ResponseEntity<AiEnhanceTaskResponse> enhanceTask(@RequestBody AiEnhanceTaskRequest request) {
        AiEnhanceTaskResponse response = aiAgentService.enhanceTask(request.getTitle(), request.getDescription());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/standup")
    public ResponseEntity<Map<String, Object>> generateStandup(@RequestBody(required = false) AiStandupRequest request) {
        Long projectId = request != null ? request.getProjectId() : null;
        Map<String, Object> data = aiAgentService.generateStandup(projectId);
        Map<String, Object> response = new HashMap<>(data);
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/execute-actions")
    public ResponseEntity<Map<String, Object>> executeActions(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AiExecuteActionsRequest request) {
        Map<String, Object> response = aiAgentService.executeActions(request.getProjectId(), principal.getId(), request.getActions());
        return ResponseEntity.ok(response);
    }
}
