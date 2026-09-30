package com.taskflow.backend.service;

import com.taskflow.backend.dto.search.SearchResponse;

public interface SearchService {
    SearchResponse globalSearch(Long userId, String query);
}
