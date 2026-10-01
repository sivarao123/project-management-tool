package com.taskflow.backend.service;

import com.taskflow.backend.dto.comment.CommentCreateRequest;
import com.taskflow.backend.dto.comment.CommentResponse;
import com.taskflow.backend.dto.comment.CommentUpdateRequest;
import com.taskflow.backend.entity.Comment;
import com.taskflow.backend.entity.Project;
import com.taskflow.backend.entity.Task;
import com.taskflow.backend.entity.User;
import com.taskflow.backend.exception.BadRequestException;
import com.taskflow.backend.exception.UnauthorizedException;
import com.taskflow.backend.repository.CommentRepository;
import com.taskflow.backend.repository.TaskRepository;
import com.taskflow.backend.repository.UserRepository;
import com.taskflow.backend.service.impl.CommentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ActivityService activityService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private RealtimeMessagingService realtimeMessagingService;

    @InjectMocks
    private CommentServiceImpl commentService;

    private User author;
    private User assignee;
    private Project project;
    private Task task;

    @BeforeEach
    void setUp() {
        author = User.builder().id(1L).name("Author").email("author@taskflow.dev").build();
        assignee = User.builder().id(2L).name("Assignee").email("assignee@taskflow.dev").build();
        project = Project.builder().id(10L).name("Project Alpha").build();
        task = Task.builder().id(100L).title("Test Task").project(project).assignee(assignee).creator(author).build();
    }

    @Test
    @DisplayName("createComment() successfully saves comment and dispatches notifications")
    void testCreateCommentSuccess() {
        CommentCreateRequest request = new CommentCreateRequest("Great progress on this!", null);

        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        when(userRepository.findById(1L)).thenReturn(Optional.of(author));
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
            Comment c = invocation.getArgument(0);
            c.setId(500L);
            return c;
        });

        CommentResponse response = commentService.createComment(100L, 1L, request);

        assertNotNull(response);
        assertEquals(500L, response.getId());
        assertEquals("Great progress on this!", response.getContent());
        assertEquals("Author", response.getAuthorName());

        verify(notificationService).createNotification(eq(2L), eq(1L), eq("comment"), anyString(), anyString(), anyString());
        verify(realtimeMessagingService).emitToProject(eq(10L), eq("comment:created"), any());
    }

    @Test
    @DisplayName("createComment() throws BadRequestException on empty content")
    void testCreateCommentEmptyContent() {
        CommentCreateRequest request = new CommentCreateRequest("   ", null);

        assertThrows(BadRequestException.class, () -> commentService.createComment(100L, 1L, request));
        verifyNoInteractions(commentRepository);
    }

    @Test
    @DisplayName("updateComment() allows author to update content")
    void testUpdateCommentSuccess() {
        Comment existing = Comment.builder().id(500L).task(task).user(author).content("Initial").build();
        when(commentRepository.findById(500L)).thenReturn(Optional.of(existing));
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> inv.getArgument(0));

        CommentUpdateRequest updateRequest = new CommentUpdateRequest("Updated comment");
        CommentResponse response = commentService.updateComment(500L, 1L, "Member", updateRequest);

        assertNotNull(response);
        assertEquals("Updated comment", response.getContent());
        verify(realtimeMessagingService).emitToProject(eq(10L), eq("comment:updated"), any());
    }

    @Test
    @DisplayName("updateComment() throws UnauthorizedException when user is not author or admin")
    void testUpdateCommentUnauthorized() {
        Comment existing = Comment.builder().id(500L).task(task).user(author).content("Initial").build();
        when(commentRepository.findById(500L)).thenReturn(Optional.of(existing));

        CommentUpdateRequest updateRequest = new CommentUpdateRequest("Unauthorized edit");
        assertThrows(UnauthorizedException.class, () -> commentService.updateComment(500L, 99L, "Member", updateRequest));
    }

    @Test
    @DisplayName("deleteComment() removes comment when user is author")
    void testDeleteCommentSuccess() {
        Comment existing = Comment.builder().id(500L).task(task).user(author).content("To delete").build();
        when(commentRepository.findById(500L)).thenReturn(Optional.of(existing));

        commentService.deleteComment(500L, 1L, "Member");

        verify(commentRepository).delete(existing);
        verify(realtimeMessagingService).emitToProject(eq(10L), eq("comment:deleted"), any());
    }
}
