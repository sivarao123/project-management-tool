package com.taskflow.backend.service;

public interface RealtimeMessagingService {
    void emitToProject(Long projectId, String event, Object data);
    void emitToUser(Long userId, String event, Object data);
    void emitGlobal(String event, Object data);
}
