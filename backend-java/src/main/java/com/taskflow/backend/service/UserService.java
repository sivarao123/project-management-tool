package com.taskflow.backend.service;

import com.taskflow.backend.dto.user.AssignUserProjectRequest;
import com.taskflow.backend.dto.user.TeamUserDto;
import com.taskflow.backend.dto.user.UserProjectDto;

import java.util.List;

public interface UserService {
    List<TeamUserDto> getAllUsers();
    List<UserProjectDto> assignUserToProject(Long targetUserId, Long currentUserId, AssignUserProjectRequest request);
    void removeUserFromProject(Long targetUserId, Long projectId, Long currentUserId);
}
