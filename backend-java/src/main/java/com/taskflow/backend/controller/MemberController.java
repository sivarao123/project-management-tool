package com.taskflow.backend.controller;

import com.taskflow.backend.dto.member.AddMemberRequest;
import com.taskflow.backend.dto.member.MemberResponse;
import com.taskflow.backend.dto.member.UpdateRoleRequest;
import com.taskflow.backend.security.UserPrincipal;
import com.taskflow.backend.service.MemberService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects/{id}/members")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @GetMapping
    @PreAuthorize("@projectSecurity.hasProjectRole(#id, 'VIEWER')")
    public ResponseEntity<Map<String, Object>> getProjectMembers(@PathVariable Long id) {
        List<MemberResponse> members = memberService.getProjectMembers(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("members", members);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("@projectSecurity.hasProjectRole(#id, 'ADMIN')")
    public ResponseEntity<Map<String, Object>> addMember(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AddMemberRequest request) {
        MemberResponse member = memberService.addMember(id, principal.getId(), request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Member added to project successfully.");
        response.put("member", member);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{userId}")
    @PreAuthorize("@projectSecurity.hasProjectRole(#id, 'ADMIN')")
    public ResponseEntity<Map<String, Object>> updateMemberRole(
            @PathVariable Long id,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateRoleRequest request) {
        memberService.updateMemberRole(id, userId, request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Member role updated successfully.");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("@projectSecurity.hasProjectRole(#id, 'ADMIN')")
    public ResponseEntity<Map<String, Object>> removeMember(
            @PathVariable Long id,
            @PathVariable Long userId) {
        memberService.removeMember(id, userId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Member removed from project.");
        return ResponseEntity.ok(response);
    }
}
