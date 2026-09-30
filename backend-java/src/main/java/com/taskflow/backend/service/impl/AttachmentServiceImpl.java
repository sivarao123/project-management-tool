package com.taskflow.backend.service.impl;

import com.taskflow.backend.dto.attachment.AttachmentResponse;
import com.taskflow.backend.entity.Attachment;
import com.taskflow.backend.entity.Task;
import com.taskflow.backend.entity.User;
import com.taskflow.backend.exception.BadRequestException;
import com.taskflow.backend.exception.ResourceNotFoundException;
import com.taskflow.backend.exception.UnauthorizedException;
import com.taskflow.backend.repository.AttachmentRepository;
import com.taskflow.backend.repository.TaskRepository;
import com.taskflow.backend.repository.UserRepository;
import com.taskflow.backend.service.ActivityService;
import com.taskflow.backend.service.AttachmentService;
import com.taskflow.backend.service.RealtimeMessagingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AttachmentServiceImpl implements AttachmentService {

    private static final Logger log = LoggerFactory.getLogger(AttachmentServiceImpl.class);

    private final AttachmentRepository attachmentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ActivityService activityService;
    private final RealtimeMessagingService realtimeMessagingService;
    private final Path uploadDirLocation;

    public AttachmentServiceImpl(AttachmentRepository attachmentRepository,
                                 TaskRepository taskRepository,
                                 UserRepository userRepository,
                                 ActivityService activityService,
                                 RealtimeMessagingService realtimeMessagingService,
                                 @Value("${app.upload.dir:uploads}") String uploadDir) {
        this.attachmentRepository = attachmentRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.activityService = activityService;
        this.realtimeMessagingService = realtimeMessagingService;
        this.uploadDirLocation = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.uploadDirLocation);
        } catch (IOException e) {
            log.error("Could not create upload directory {}", uploadDirLocation, e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttachmentResponse> getTaskAttachments(Long taskId) {
        List<Attachment> attachments = attachmentRepository.findByTaskIdWithUploader(taskId);
        return attachments.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional
    public AttachmentResponse uploadTaskAttachment(Long taskId, Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("No file uploaded.");
        }

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found."));

        User uploader = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "attachment");
        String sanitizedFilename = originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_");
        String uniqueFileName = System.currentTimeMillis() + "-" + (long) (Math.random() * 1e9) + "-" + sanitizedFilename;

        Path targetLocation = this.uploadDirLocation.resolve(uniqueFileName);
        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + uniqueFileName, ex);
        }

        String fileUrl = "/uploads/" + uniqueFileName;

        Attachment attachment = Attachment.builder()
                .task(task)
                .uploader(uploader)
                .fileName(originalFilename)
                .fileUrl(fileUrl)
                .fileSize(file.getSize())
                .fileType(file.getContentType())
                .build();

        Attachment saved = attachmentRepository.save(attachment);
        AttachmentResponse response = mapToResponse(saved);

        // Log Activity
        Map<String, Object> meta = new HashMap<>();
        meta.put("taskTitle", task.getTitle());
        meta.put("fileName", originalFilename);
        activityService.logActivity(task.getProject().getId(), userId, "uploaded_attachment", "task", taskId, meta);

        // Realtime broadcast to project
        Map<String, Object> broadcastData = new HashMap<>();
        broadcastData.put("taskId", taskId);
        broadcastData.put("attachment", response);
        realtimeMessagingService.emitToProject(task.getProject().getId(), "attachment:uploaded", broadcastData);

        return response;
    }

    @Override
    @Transactional
    public void deleteAttachment(Long attachmentId, Long userId, String userRole) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found."));

        boolean isUploader = attachment.getUploader() != null && attachment.getUploader().getId().equals(userId);
        boolean isAdmin = "Admin".equalsIgnoreCase(userRole);
        if (!isUploader && !isAdmin) {
            throw new UnauthorizedException("Permission denied to delete this attachment.");
        }

        // Attempt to remove file from disk
        try {
            String filename = Paths.get(attachment.getFileUrl()).getFileName().toString();
            Path filePath = this.uploadDirLocation.resolve(filename);
            Files.deleteIfExists(filePath);
        } catch (Exception ex) {
            log.warn("Could not delete attachment file from disk: {}", attachment.getFileUrl(), ex);
        }

        Long taskId = attachment.getTask().getId();
        Long projectId = attachment.getTask().getProject().getId();

        attachmentRepository.delete(attachment);

        // Realtime broadcast
        Map<String, Object> broadcastData = new HashMap<>();
        broadcastData.put("taskId", taskId);
        broadcastData.put("attachmentId", attachmentId);
        realtimeMessagingService.emitToProject(projectId, "attachment:deleted", broadcastData);
    }

    private AttachmentResponse mapToResponse(Attachment a) {
        AttachmentResponse res = new AttachmentResponse();
        res.setId(a.getId());
        if (a.getTask() != null) {
            res.setTaskId(a.getTask().getId());
        }
        if (a.getUploader() != null) {
            res.setUploaderId(a.getUploader().getId());
            res.setUploaderName(a.getUploader().getName());
            res.setUploaderAvatar(a.getUploader().getAvatarUrl());
        }
        res.setFileName(a.getFileName());
        res.setFileUrl(a.getFileUrl());
        res.setFileSize(a.getFileSize());
        res.setFileType(a.getFileType());
        res.setCreatedAt(a.getCreatedAt());
        return res;
    }
}
