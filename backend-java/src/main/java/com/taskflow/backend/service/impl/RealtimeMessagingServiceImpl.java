package com.taskflow.backend.service.impl;

import com.taskflow.backend.service.RealtimeMessagingService;
import com.taskflow.backend.socket.SocketIoServerHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

@Service
public class RealtimeMessagingServiceImpl implements RealtimeMessagingService {

    private static final Logger log = LoggerFactory.getLogger(RealtimeMessagingServiceImpl.class);

    private final SocketIoServerHandler socketIoHandler;

    public RealtimeMessagingServiceImpl(@Lazy SocketIoServerHandler socketIoHandler) {
        this.socketIoHandler = socketIoHandler;
    }

    @Override
    public void emitToProject(Long projectId, String event, Object data) {
        log.debug("[Realtime] emitToProject(project:{}): event='{}'", projectId, event);
        if (socketIoHandler != null) {
            socketIoHandler.emitToProject(projectId, event, data);
        }
    }

    @Override
    public void emitToUser(Long userId, String event, Object data) {
        log.debug("[Realtime] emitToUser(user:{}): event='{}'", userId, event);
        if (socketIoHandler != null) {
            socketIoHandler.emitToUser(userId, event, data);
        }
    }

    @Override
    public void emitGlobal(String event, Object data) {
        log.debug("[Realtime] emitGlobal: event='{}'", event);
        if (socketIoHandler != null) {
            socketIoHandler.emitGlobal(event, data);
        }
    }
}
