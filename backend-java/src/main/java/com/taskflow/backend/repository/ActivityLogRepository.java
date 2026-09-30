package com.taskflow.backend.repository;

import com.taskflow.backend.entity.ActivityLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    @Query("SELECT a FROM ActivityLog a LEFT JOIN FETCH a.user WHERE a.project.id = :projectId ORDER BY a.createdAt DESC")
    List<ActivityLog> findProjectActivities(@Param("projectId") Long projectId, Pageable pageable);

    @Query("SELECT a FROM ActivityLog a JOIN FETCH a.project p LEFT JOIN FETCH a.user u " +
           "WHERE p.owner.id = :userId OR EXISTS (SELECT pm FROM ProjectMember pm WHERE pm.project = p AND pm.user.id = :userId) " +
           "ORDER BY a.createdAt DESC")
    List<ActivityLog> findGlobalActivities(@Param("userId") Long userId, Pageable pageable);
}
