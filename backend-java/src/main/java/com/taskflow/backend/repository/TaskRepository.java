package com.taskflow.backend.repository;

import com.taskflow.backend.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("""
        SELECT t FROM Task t
        LEFT JOIN FETCH t.assignee
        LEFT JOIN FETCH t.creator
        LEFT JOIN FETCH t.project
        WHERE t.project.id = :projectId
        ORDER BY t.position ASC, t.id ASC
    """)
    List<Task> findByProjectIdWithRelations(@Param("projectId") Long projectId);

    @Query("SELECT COALESCE(MAX(t.position), -1) + 1 FROM Task t WHERE t.project.id = :projectId AND t.status = :status")
    Integer getNextPosition(@Param("projectId") Long projectId, @Param("status") String status);

    @Modifying
    @Query("UPDATE Task t SET t.status = :status, t.position = :position, t.updatedAt = CURRENT_TIMESTAMP WHERE t.id = :id")
    void updateTaskStatusAndPosition(@Param("id") Long id, @Param("status") String status, @Param("position") Integer position);

    @Query("""
        SELECT t FROM Task t
        LEFT JOIN FETCH t.assignee
        LEFT JOIN FETCH t.project
        WHERE t.assignee.id = :userId
          AND (:status IS NULL OR t.status = :status)
          AND (:priority IS NULL OR t.priority = :priority)
          AND (:dueToday = false OR t.dueDate = CURRENT_DATE)
          AND (:overdue = false OR (t.dueDate < CURRENT_DATE AND t.status != 'DONE'))
          AND (:completed = false OR t.status = 'DONE')
        ORDER BY t.dueDate ASC NULLS LAST, t.id DESC
    """)
    List<Task> findUserTasks(
            @Param("userId") Long userId,
            @Param("status") String status,
            @Param("priority") String priority,
            @Param("dueToday") boolean dueToday,
            @Param("overdue") boolean overdue,
            @Param("completed") boolean completed
    );

    @Query("""
        SELECT DISTINCT t FROM Task t
        JOIN t.project p
        LEFT JOIN ProjectMember pm ON p.id = pm.project.id
        WHERE (p.owner.id = :userId OR pm.user.id = :userId)
          AND (LOWER(t.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(t.description) LIKE LOWER(CONCAT('%', :query, '%')))
    """)
    List<Task> searchTasks(@Param("userId") Long userId, @Param("query") String query);

    long countByProjectId(Long projectId);

    long countByProjectIdAndStatus(Long projectId, String status);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignee.id = :userId AND t.status != 'DONE'")
    long countActiveTasksByAssigneeId(@Param("userId") Long userId);

    @Query("SELECT t.assignee.id, COUNT(t) FROM Task t WHERE t.assignee IS NOT NULL AND t.status != 'DONE' GROUP BY t.assignee.id")
    List<Object[]> countActiveTasksGroupedByAssignee();
}
