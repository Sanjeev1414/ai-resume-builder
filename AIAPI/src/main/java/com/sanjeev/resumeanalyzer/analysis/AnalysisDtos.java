package com.sanjeev.resumeanalyzer.analysis;

import com.sanjeev.resumeanalyzer.model.AnalysisResult;

import java.time.Instant;

public final class AnalysisDtos {

    private AnalysisDtos() {
    }

    /** Row in the history list. */
    public record AnalysisSummary(Long id, String resumeFileName, String jobPreview, int matchScore, Integer atsScore,
                                  Instant createdAt) {
    }

    /** Full saved analysis. */
    public record AnalysisDetail(Long id, String resumeFileName, String jobDescription, Instant createdAt,
                                 AnalysisResult result, boolean emailSent) {
    }
}
