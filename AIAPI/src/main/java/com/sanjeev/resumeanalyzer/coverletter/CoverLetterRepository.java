package com.sanjeev.resumeanalyzer.coverletter;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CoverLetterRepository extends JpaRepository<CoverLetter, Long> {

    List<CoverLetter> findTop50ByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<CoverLetter> findByIdAndUserId(Long id, Long userId);
}
