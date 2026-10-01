package com.taskflow.backend.repository;

import com.taskflow.backend.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    @Query("SELECT c FROM Comment c JOIN FETCH c.user WHERE c.task.id = :taskId ORDER BY c.createdAt ASC")
    List<Comment> findByTaskIdWithUser(@Param("taskId") Long taskId);

    long countByTaskId(Long taskId);
}
