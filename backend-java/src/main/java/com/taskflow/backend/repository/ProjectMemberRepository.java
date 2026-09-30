package com.taskflow.backend.repository;

import com.taskflow.backend.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    List<ProjectMember> findByProjectIdOrderByJoinedAtAsc(Long projectId);

    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);

    boolean existsByProjectIdAndUserId(Long projectId, Long userId);

    void deleteByProjectIdAndUserId(Long projectId, Long userId);

    @Query("SELECT COUNT(pm) FROM ProjectMember pm WHERE pm.project.id = :projectId")
    long countByProjectId(@Param("projectId") Long projectId);

    @Query("""
        SELECT pm FROM ProjectMember pm
        JOIN FETCH pm.project p
        WHERE pm.user.id = :userId AND p.isArchived = false
        ORDER BY p.name ASC
    """)
    List<ProjectMember> findActiveProjectsByUserId(@Param("userId") Long userId);

    @Query("""
        SELECT pm FROM ProjectMember pm
        JOIN FETCH pm.project p
        JOIN FETCH pm.user u
        WHERE p.isArchived = false
        ORDER BY p.name ASC
    """)
    List<ProjectMember> findAllWithActiveProject();
}
