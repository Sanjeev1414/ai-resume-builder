package com.sanjeev.resumeanalyzer.model;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;

import java.util.List;

/**
 * The structured result returned by the AI and stored with each analysis.
 * atsScore/atsIssues are nullable so reports saved before ATS checks existed still load.
 */
public record AnalysisResult(
        @JsonPropertyDescription("Overall fit between the resume and the job, from 0 (no fit) to 100 (perfect fit)")
        int matchScore,

        @JsonPropertyDescription("How well an Applicant Tracking System can parse and rank this resume for this job, 0-100")
        Integer atsScore,

        @JsonPropertyDescription("2-3 sentence verdict on how well the candidate fits this role")
        String summary,

        @JsonPropertyDescription("Skills and requirements from the job description that the resume clearly shows")
        List<String> matchedSkills,

        @JsonPropertyDescription("Important skills or keywords from the job description that the resume lacks")
        List<String> missingSkills,

        @JsonPropertyDescription("Concrete ATS problems found in the resume, each with how to fix it")
        List<String> atsIssues,

        @JsonPropertyDescription("3-5 existing resume bullet points rewritten to be ATS-friendly and target this job")
        List<BulletRewrite> bulletRewrites,

        @JsonPropertyDescription("3-5 concrete, actionable tips to improve the resume for this job")
        List<String> suggestions
) {

    public record BulletRewrite(
            @JsonPropertyDescription("The bullet point exactly as it appears in the resume")
            String original,

            @JsonPropertyDescription("The improved bullet point: action verb, impact, metrics, exact job keywords - no invented facts")
            String improved,

            @JsonPropertyDescription("One short sentence on why the rewrite is stronger")
            String reason
    ) {
    }
}
