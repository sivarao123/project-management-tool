package com.taskflow.backend.service;

import com.taskflow.backend.dto.member.AddMemberRequest;
import com.taskflow.backend.dto.member.MemberResponse;
import com.taskflow.backend.dto.member.UpdateRoleRequest;

import java.util.List;

public interface MemberService {
    List<MemberResponse> getProjectMembers(Long projectId);
    MemberResponse addMember(Long projectId, Long currentUserId, AddMemberRequest request);
    void updateMemberRole(Long projectId, Long targetUserId, UpdateRoleRequest request);
    void removeMember(Long projectId, Long targetUserId);
}
