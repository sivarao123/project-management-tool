package com.taskflow.backend.service;

import com.taskflow.backend.dto.activity.ActivityLogResponse;

import java.util.List;
import java.util.Map;

public interface ActivityService {
    List<ActivityLogResponse> getProjectActivities(Long projectId);
    List<ActivityLogResponse> getGlobalActivities(Long userId);
    ActivityLogResponse logActivity(Long projectId, Long userId, String action, String entityType, Long entityId, Map<String, Object> metadata);
}
