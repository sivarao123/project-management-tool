package com.taskflow.backend.repository;

import com.taskflow.backend.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("""
        SELECT DISTINCT p FROM Project p
        LEFT JOIN ProjectMember pm ON p.id = pm.project.id
        WHERE (p.owner.id = :userId OR pm.user.id = :userId)
          AND (:includeArchived = true OR p.isArchived = false)
        ORDER BY p.updatedAt DESC
    """)
    List<Project> findUserProjects(@Param("userId") Long userId, @Param("includeArchived") boolean includeArchived);

    @Query("""
        SELECT DISTINCT p FROM Project p
        LEFT JOIN ProjectMember pm ON p.id = pm.project.id
        WHERE (p.owner.id = :userId OR pm.user.id = :userId)
          AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')))
    """)
    List<Project> searchProjects(@Param("userId") Long userId, @Param("query") String query);
}
