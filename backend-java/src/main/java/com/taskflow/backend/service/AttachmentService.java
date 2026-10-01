package com.taskflow.backend.service;

import com.taskflow.backend.dto.attachment.AttachmentResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AttachmentService {
    List<AttachmentResponse> getTaskAttachments(Long taskId);
    AttachmentResponse uploadTaskAttachment(Long taskId, Long userId, MultipartFile file);
    void deleteAttachment(Long attachmentId, Long userId, String userRole);
}
