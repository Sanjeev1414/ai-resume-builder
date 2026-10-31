package com.sanjeev.resumeanalyzer.service;

import java.util.List;
import java.util.Map;

/**
 * JSON schema for {@link com.sanjeev.resumeanalyzer.model.AnalysisResult}, sent to Gemini as the
 * structured output schema. Every property is listed in "required" and "additionalProperties"
 * is false so the reply always has the full shape. Descriptions double as instructions for the model.
 */
final class AnalysisSchema {

    private AnalysisSchema() {
    }

    private static Map<String, Object> string(String description) {
        return Map.of("type", "string", "description", description);
    }

    private static Map<String, Object> integer(String description) {
        return Map.of("type", "integer", "description", description);
    }

    private static Map<String, Object> stringList(String description) {
        return Map.of("type", "array", "items", Map.of("type", "string"), "description", description);
    }

    private static final Map<String, Object> BULLET_REWRITE = Map.of(
            "type", "object",
            "properties", Map.of(
                    "original", string("The bullet point exactly as it appears in the resume"),
                    "improved", string("The improved, ATS-friendly bullet: strong action verb, measurable impact, "
                            + "the job description's exact keywords where truthful - no invented facts"),
                    "reason", string("One short sentence on why the rewrite is stronger")),
            "required", List.of("original", "improved", "reason"),
            "additionalProperties", false);

    static final Map<String, Object> SCHEMA = Map.of(
            "type", "object",
            "properties", Map.of(
                    "matchScore", integer("Overall fit between the resume and the job, from 0 (no fit) to 100 (perfect fit)"),
                    "atsScore", integer("How well an Applicant Tracking System can parse this resume and rank it for "
                            + "this job, 0-100: keyword coverage, standard section headings, simple parseable layout"),
                    "summary", string("2-3 sentence verdict on how well the candidate fits this role"),
                    "matchedSkills", stringList("Skills and requirements from the job description that the resume clearly shows"),
                    "missingSkills", stringList("Important skills or exact keywords from the job description that the resume lacks"),
                    "atsIssues", stringList("Concrete ATS problems in this resume, each phrased as problem + fix, e.g. "
                            + "'Uses a two-column layout - switch to a single column so ATS reads it in order'. "
                            + "Empty if none."),
                    "bulletRewrites", Map.of("type", "array", "items", BULLET_REWRITE,
                            "description", "3-5 existing resume bullet points rewritten to be ATS-friendly for this job"),
                    "suggestions", stringList("3-5 concrete, actionable tips to improve the resume for this job")),
            "required", List.of("matchScore", "atsScore", "summary", "matchedSkills", "missingSkills", "atsIssues",
                    "bulletRewrites", "suggestions"),
            "additionalProperties", false);
}
