package com.taskflow.backend.repository;

import com.taskflow.backend.entity.Label;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabelRepository extends JpaRepository<Label, Long> {
    List<Label> findByProjectIdOrderByIdAsc(Long projectId);
}
