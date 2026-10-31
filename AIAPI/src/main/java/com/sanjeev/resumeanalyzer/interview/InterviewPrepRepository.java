package com.sanjeev.resumeanalyzer.interview;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InterviewPrepRepository extends JpaRepository<InterviewPrep, Long> {

    List<InterviewPrep> findTop50ByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<InterviewPrep> findByIdAndUserId(Long id, Long userId);
}
