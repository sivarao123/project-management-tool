package com.taskflow.backend.socket;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SocketIoServerHandler {

    private static final Logger log = LoggerFactory.getLogger(SocketIoServerHandler.class);

    private final SocketIOServer server;
    private final Map<Long, Set<String>> onlineUsers = new ConcurrentHashMap<>();

    public SocketIoServerHandler(SocketIOServer server) {
        this.server = server;
    }

    @PostConstruct
    public void startServer() {
        server.addConnectListener(client -> {
            log.info("[Socket.io] Client connected: sessionId={}", client.getSessionId());
        });

        server.addDisconnectListener(client -> {
            Long userId = client.get("userId");
            log.info("[Socket.io] Client disconnected: sessionId={}, userId={}", client.getSessionId(), userId);

            if (userId != null && onlineUsers.containsKey(userId)) {
                Set<String> sessions = onlineUsers.get(userId);
                sessions.remove(client.getSessionId().toString());
                if (sessions.isEmpty()) {
                    onlineUsers.remove(userId);
                    server.getBroadcastOperations().sendEvent("presence:update", Map.of(
                            "userId", userId,
                            "status", "offline",
                            "onlineCount", onlineUsers.size()
                    ));
                }
            }
        });

        // 1. user:online
        server.addEventListener("user:online", Map.class, (client, data, ackSender) -> {
            if (data != null && data.containsKey("id")) {
                Long userId = ((Number) data.get("id")).longValue();
                client.set("userId", userId);

                onlineUsers.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet())
                        .add(client.getSessionId().toString());

                // Join personal room for notifications
                client.joinRoom("user:" + userId);

                server.getBroadcastOperations().sendEvent("presence:update", Map.of(
                        "userId", userId,
                        "status", "online",
                        "onlineCount", onlineUsers.size()
                ));
            }
        });

        // 2. join:project
        server.addEventListener("join:project", Object.class, (client, data, ackSender) -> {
            if (data != null) {
                String projectId = data.toString();
                client.joinRoom("project:" + projectId);
                log.debug("[Socket.io] Client joined project room: project:{}", projectId);
            }
        });

        // 3. leave:project
        server.addEventListener("leave:project", Object.class, (client, data, ackSender) -> {
            if (data != null) {
                String projectId = data.toString();
                client.leaveRoom("project:" + projectId);
                log.debug("[Socket.io] Client left project room: project:{}", projectId);
            }
        });

        // 4. typing:start
        server.addEventListener("typing:start", Map.class, (client, data, ackSender) -> {
            if (data != null && data.containsKey("taskId")) {
                String taskId = data.get("taskId").toString();
                server.getRoomOperations("task:" + taskId).sendEvent("typing:status", data);
            }
        });

        // 5. typing:stop
        server.addEventListener("typing:stop", Map.class, (client, data, ackSender) -> {
            if (data != null && data.containsKey("taskId")) {
                String taskId = data.get("taskId").toString();
                server.getRoomOperations("task:" + taskId).sendEvent("typing:status", data);
            }
        });

        try {
            server.start();
            log.info("[Socket.io] Real-time engine successfully started on port {}.", server.getConfiguration().getPort());
        } catch (Exception ex) {
            log.error("[Socket.io] Failed to start Netty SocketIO server: {}", ex.getMessage());
        }
    }

    @PreDestroy
    public void stopServer() {
        if (server != null) {
            server.stop();
            log.info("[Socket.io] Real-time engine stopped.");
        }
    }

    public void emitToProject(Long projectId, String event, Object data) {
        if (server != null && projectId != null) {
            server.getRoomOperations("project:" + projectId).sendEvent(event, data);
        }
    }

    public void emitToUser(Long userId, String event, Object data) {
        if (server != null && userId != null) {
            server.getRoomOperations("user:" + userId).sendEvent(event, data);
        }
    }

    public void emitGlobal(String event, Object data) {
        if (server != null) {
            server.getBroadcastOperations().sendEvent(event, data);
        }
    }
}
