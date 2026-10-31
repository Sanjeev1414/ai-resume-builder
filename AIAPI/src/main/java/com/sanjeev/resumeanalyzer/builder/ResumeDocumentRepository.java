package com.sanjeev.resumeanalyzer.builder;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ResumeDocumentRepository extends JpaRepository<ResumeDocument, Long> {

    Optional<ResumeDocument> findByUserId(Long userId);
}
