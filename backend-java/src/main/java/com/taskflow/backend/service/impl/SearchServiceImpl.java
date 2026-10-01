package com.taskflow.backend.service.impl;

import com.taskflow.backend.dto.search.SearchResponse;
import com.taskflow.backend.dto.search.SearchResponse.*;
import com.taskflow.backend.service.SearchService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class SearchServiceImpl implements SearchService {

    private final EntityManager entityManager;

    public SearchServiceImpl(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public SearchResponse globalSearch(Long userId, String q) {
        if (q == null || q.trim().isEmpty()) {
            return new SearchResponse();
        }

        String searchTerm = "%" + q.trim().toLowerCase() + "%";

        // 1. Projects search
        String projectSql = """
                SELECT DISTINCT p.id, p.name, p.description, p.color, p.priority, p.status
                FROM projects p
                LEFT JOIN project_members pm ON p.id = pm.project_id
                WHERE (p.owner_id = :userId OR pm.user_id = :userId)
                  AND (LOWER(p.name) LIKE :searchTerm OR LOWER(COALESCE(p.description, '')) LIKE :searchTerm)
                LIMIT 10
                """;
        Query projectQuery = entityManager.createNativeQuery(projectSql);
        projectQuery.setParameter("userId", userId);
        projectQuery.setParameter("searchTerm", searchTerm);
        List<Object[]> projectRows = projectQuery.getResultList();

        List<SearchProjectDto> projects = new ArrayList<>();
        for (Object[] row : projectRows) {
            projects.add(new SearchProjectDto(
                    ((Number) row[0]).longValue(),
                    (String) row[1],
                    (String) row[2],
                    (String) row[3],
                    (String) row[4],
                    (String) row[5]
            ));
        }

        // 2. Tasks search
        String taskSql = """
                SELECT DISTINCT t.id, t.title, t.description, t.status, t.priority, t.due_date,
                       t.project_id, p.name as project_name, p.color as project_color,
                       u.name as assignee_name, u.avatar_url as assignee_avatar
                FROM tasks t
                JOIN projects p ON t.project_id = p.id
                LEFT JOIN project_members pm ON p.id = pm.project_id
                LEFT JOIN users u ON t.assignee_id = u.id
                WHERE (p.owner_id = :userId OR pm.user_id = :userId)
                  AND (LOWER(t.title) LIKE :searchTerm OR LOWER(COALESCE(t.description, '')) LIKE :searchTerm)
                LIMIT 15
                """;
        Query taskQuery = entityManager.createNativeQuery(taskSql);
        taskQuery.setParameter("userId", userId);
        taskQuery.setParameter("searchTerm", searchTerm);
        List<Object[]> taskRows = taskQuery.getResultList();

        List<SearchTaskDto> tasks = new ArrayList<>();
        for (Object[] row : taskRows) {
            LocalDate dueDate = null;
            if (row[5] instanceof Date d) {
                dueDate = d.toLocalDate();
            } else if (row[5] instanceof LocalDate ld) {
                dueDate = ld;
            }

            tasks.add(new SearchTaskDto(
                    ((Number) row[0]).longValue(),
                    (String) row[1],
                    (String) row[2],
                    (String) row[3],
                    (String) row[4],
                    dueDate,
                    ((Number) row[6]).longValue(),
                    (String) row[7],
                    (String) row[8],
                    (String) row[9],
                    (String) row[10]
            ));
        }

        // 3. Members search
        String memberSql = """
                SELECT DISTINCT u.id, u.name, u.email, u.avatar_url, u.role, u.bio
                FROM users u
                WHERE LOWER(u.name) LIKE :searchTerm OR LOWER(u.email) LIKE :searchTerm
                LIMIT 10
                """;
        Query memberQuery = entityManager.createNativeQuery(memberSql);
        memberQuery.setParameter("searchTerm", searchTerm);
        List<Object[]> memberRows = memberQuery.getResultList();

        List<SearchMemberDto> members = new ArrayList<>();
        for (Object[] row : memberRows) {
            members.add(new SearchMemberDto(
                    ((Number) row[0]).longValue(),
                    (String) row[1],
                    (String) row[2],
                    (String) row[3],
                    (String) row[4],
                    (String) row[5]
            ));
        }

        // 4. Comments search
        String commentSql = """
                SELECT c.id, c.content, c.task_id, c.created_at,
                       t.title as task_title, t.project_id,
                       u.name as author_name, u.avatar_url as author_avatar
                FROM comments c
                JOIN tasks t ON c.task_id = t.id
                JOIN projects p ON t.project_id = p.id
                JOIN users u ON c.user_id = u.id
                LEFT JOIN project_members pm ON p.id = pm.project_id
                WHERE (p.owner_id = :userId OR pm.user_id = :userId)
                  AND LOWER(c.content) LIKE :searchTerm
                LIMIT 10
                """;
        Query commentQuery = entityManager.createNativeQuery(commentSql);
        commentQuery.setParameter("userId", userId);
        commentQuery.setParameter("searchTerm", searchTerm);
        List<Object[]> commentRows = commentQuery.getResultList();

        List<SearchCommentDto> comments = new ArrayList<>();
        for (Object[] row : commentRows) {
            LocalDateTime createdAt = null;
            if (row[3] instanceof Timestamp ts) {
                createdAt = ts.toLocalDateTime();
            } else if (row[3] instanceof LocalDateTime ldt) {
                createdAt = ldt;
            }

            comments.add(new SearchCommentDto(
                    ((Number) row[0]).longValue(),
                    (String) row[1],
                    ((Number) row[2]).longValue(),
                    createdAt,
                    (String) row[4],
                    ((Number) row[5]).longValue(),
                    (String) row[6],
                    (String) row[7]
            ));
        }

        return new SearchResponse(projects, tasks, members, comments);
    }
}
