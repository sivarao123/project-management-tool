package com.taskflow.backend.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskflow.backend.dto.activity.ActivityLogResponse;
import com.taskflow.backend.entity.ActivityLog;
import com.taskflow.backend.entity.Project;
import com.taskflow.backend.entity.User;
import com.taskflow.backend.repository.ActivityLogRepository;
import com.taskflow.backend.repository.ProjectRepository;
import com.taskflow.backend.repository.UserRepository;
import com.taskflow.backend.service.ActivityService;
import com.taskflow.backend.service.RealtimeMessagingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class ActivityServiceImpl implements ActivityService {

    private static final Logger log = LoggerFactory.getLogger(ActivityServiceImpl.class);

    private final ActivityLogRepository activityLogRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final RealtimeMessagingService realtimeMessagingService;
    private final ObjectMapper objectMapper;

    public ActivityServiceImpl(ActivityLogRepository activityLogRepository,
                               ProjectRepository projectRepository,
                               UserRepository userRepository,
                               RealtimeMessagingService realtimeMessagingService,
                               ObjectMapper objectMapper) {
        this.activityLogRepository = activityLogRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.realtimeMessagingService = realtimeMessagingService;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getProjectActivities(Long projectId) {
        List<ActivityLog> logs = activityLogRepository.findProjectActivities(projectId, PageRequest.of(0, 50));
        return logs.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getGlobalActivities(Long userId) {
        List<ActivityLog> logs = activityLogRepository.findGlobalActivities(userId, PageRequest.of(0, 25));
        return logs.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional
    public ActivityLogResponse logActivity(Long projectId, Long userId, String action, String entityType, Long entityId, Map<String, Object> metadata) {
        try {
            Project project = projectRepository.findById(projectId).orElse(null);
            if (project == null) {
                return null;
            }

            User user = null;
            if (userId != null) {
                user = userRepository.findById(userId).orElse(null);
            }

            String metaStr = "{}";
            if (metadata != null) {
                try {
                    metaStr = objectMapper.writeValueAsString(metadata);
                } catch (Exception e) {
                    metaStr = "{}";
                }
            }

            ActivityLog activityLog = ActivityLog.builder()
                    .project(project)
                    .user(user)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .metadata(metaStr)
                    .build();

            ActivityLog saved = activityLogRepository.save(activityLog);
            ActivityLogResponse response = mapToResponse(saved);

            realtimeMessagingService.emitToProject(projectId, "activity:new", response);
            return response;
        } catch (Exception ex) {
            log.error("[ActivityLog Error] Failed to log activity for project {}", projectId, ex);
            return null;
        }
    }

    private ActivityLogResponse mapToResponse(ActivityLog a) {
        ActivityLogResponse res = new ActivityLogResponse();
        res.setId(a.getId());
        if (a.getProject() != null) {
            res.setProjectId(a.getProject().getId());
            res.setProjectName(a.getProject().getName());
            res.setProjectColor(a.getProject().getColor());
        }
        if (a.getUser() != null) {
            res.setUserId(a.getUser().getId());
            res.setUserName(a.getUser().getName());
            res.setUserAvatar(a.getUser().getAvatarUrl());
            res.setUserEmail(a.getUser().getEmail());
        }
        res.setAction(a.getAction());
        res.setEntityType(a.getEntityType());
        res.setEntityId(a.getEntityId());
        res.setCreatedAt(a.getCreatedAt());

        if (a.getMetadata() != null && !a.getMetadata().isBlank()) {
            try {
                Map<String, Object> parsed = objectMapper.readValue(a.getMetadata(), new TypeReference<Map<String, Object>>() {});
                res.setMetadata(parsed);
            } catch (Exception ex) {
                res.setMetadata(Collections.singletonMap("raw", a.getMetadata()));
            }
        } else {
            res.setMetadata(Collections.emptyMap());
        }

        return res;
    }
}
