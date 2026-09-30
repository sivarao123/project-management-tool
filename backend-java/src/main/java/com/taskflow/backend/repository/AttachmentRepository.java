package com.taskflow.backend.repository;

import com.taskflow.backend.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    @Query("SELECT a FROM Attachment a LEFT JOIN FETCH a.uploader WHERE a.task.id = :taskId ORDER BY a.createdAt ASC")
    List<Attachment> findByTaskIdWithUploader(@Param("taskId") Long taskId);

    long countByTaskId(Long taskId);
}
