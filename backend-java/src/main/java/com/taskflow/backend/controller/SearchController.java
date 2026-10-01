package com.taskflow.backend.controller;

import com.taskflow.backend.dto.search.SearchResponse;
import com.taskflow.backend.security.UserPrincipal;
import com.taskflow.backend.service.SearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping("/api/search")
    public ResponseEntity<Map<String, Object>> search(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(name = "q", required = false) String q) {
        SearchResponse results = searchService.globalSearch(principal.getId(), q);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("results", results);
        return ResponseEntity.ok(response);
    }
}
