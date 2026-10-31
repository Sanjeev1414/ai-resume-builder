package com.sanjeev.resumeanalyzer.analysis;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnalysisRepository extends JpaRepository<Analysis, Long> {

    List<Analysis> findTop50ByUserIdOrderByCreatedAtDesc(Long userId);

    /** Scoped by user so nobody can read another user's analysis by guessing an id. */
    Optional<Analysis> findByIdAndUserId(Long id, Long userId);
}
