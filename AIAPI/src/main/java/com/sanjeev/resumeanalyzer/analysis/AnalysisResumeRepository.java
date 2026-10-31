package com.sanjeev.resumeanalyzer.analysis;

import org.springframework.data.jpa.repository.JpaRepository;

/** Keyed by the analysis id. Callers check the analysis belongs to the user first. */
public interface AnalysisResumeRepository extends JpaRepository<AnalysisResume, Long> {
}
