package com.taskflow.backend.controller;

import com.taskflow.backend.dto.user.AssignUserProjectRequest;
import com.taskflow.backend.dto.user.TeamUserDto;
import com.taskflow.backend.dto.user.UserProjectDto;
import com.taskflow.backend.security.UserPrincipal;
import com.taskflow.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        List<TeamUserDto> users = userService.getAllUsers();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("users", users);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{userId}/projects")
    public ResponseEntity<Map<String, Object>> assignUserToProject(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AssignUserProjectRequest request) {
        List<UserProjectDto> updatedProjects = userService.assignUserToProject(userId, principal.getId(), request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "User successfully added to project.");
        response.put("projects", updatedProjects);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{userId}/projects/{projectId}")
    public ResponseEntity<Map<String, Object>> removeUserFromProject(
            @PathVariable Long userId,
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal principal) {
        userService.removeUserFromProject(userId, projectId, principal.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "User removed from project.");
        return ResponseEntity.ok(response);
    }
}
