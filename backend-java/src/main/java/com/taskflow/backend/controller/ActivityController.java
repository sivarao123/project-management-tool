package com.taskflow.backend.controller;

import com.taskflow.backend.dto.activity.ActivityLogResponse;
import com.taskflow.backend.security.UserPrincipal;
import com.taskflow.backend.service.ActivityService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @GetMapping("/api/activities/global")
    public ResponseEntity<Map<String, Object>> getGlobalActivities(@AuthenticationPrincipal UserPrincipal principal) {
        List<ActivityLogResponse> activities = activityService.getGlobalActivities(principal.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("activities", activities);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/projects/{projectId}/activities")
    @PreAuthorize("@projectSecurity.hasProjectRole(#projectId, 'VIEWER')")
    public ResponseEntity<Map<String, Object>> getProjectActivities(@PathVariable Long projectId) {
        List<ActivityLogResponse> activities = activityService.getProjectActivities(projectId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("activities", activities);
        return ResponseEntity.ok(response);
    }
}
