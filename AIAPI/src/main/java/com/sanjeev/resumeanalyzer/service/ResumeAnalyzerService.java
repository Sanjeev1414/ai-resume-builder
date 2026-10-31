package com.sanjeev.resumeanalyzer.service;

import com.sanjeev.resumeanalyzer.ai.OpenAiClient;
import com.sanjeev.resumeanalyzer.model.AnalysisResult;
import org.springframework.stereotype.Service;

@Service
public class ResumeAnalyzerService {

    private static final String SYSTEM_PROMPT = """
            You are an experienced technical recruiter, resume coach and ATS (Applicant Tracking System) expert.
            You compare a candidate's resume (attached PDF) with a job description and give an honest,
            specific assessment. Base everything on what the resume actually says - never invent
            experience, numbers, or skills the candidate does not have.

            ATS review - check how well software like Workday, Greenhouse, Lever or Taleo would parse and
            rank this resume for the job:
            - Keywords: does it use the job description's exact terms (e.g. "Spring Boot", not just "Spring")?
            - Sections: standard headings such as Summary, Experience, Education, Skills, Projects.
            - Layout: single column; no tables, text boxes, images, icons, charts or skill bars;
              contact details in the body, not in headers/footers.
            - Details: consistent dates (e.g. "Jan 2024 - Present"), job titles and company names clear,
              no important text only inside graphics, standard fonts, acronyms also spelled out once.
            Report only problems you can actually see in this resume.

            In bullet rewrites, keep the facts and make them ATS-friendly: start with a strong action verb,
            show measurable impact, and use the job description's exact keywords where they truthfully apply.
            Plain text only - no symbols, emojis or special characters. If a metric would help but is not
            in the resume, use a placeholder like [X%] so the candidate can fill in the real number.
            """;

    private final OpenAiClient openAi;

    public ResumeAnalyzerService(OpenAiClient openAi) {
        this.openAi = openAi;
    }

    public AnalysisResult analyze(byte[] resumePdf, String jobDescription) {
        String instructions = "Analyze the attached resume against this job description:\n\n"
                + "<job_description>\n" + jobDescription.strip() + "\n</job_description>";

        AnalysisResult result = openAi.structured(SYSTEM_PROMPT, resumePdf, instructions,
                "resume_analysis", AnalysisSchema.SCHEMA, AnalysisResult.class);

        return new AnalysisResult(clamp(result.matchScore()),
                result.atsScore() == null ? null : clamp(result.atsScore()),
                result.summary(), result.matchedSkills(), result.missingSkills(), result.atsIssues(),
                result.bulletRewrites(), result.suggestions());
    }

    private static int clamp(int score) {
        return Math.max(0, Math.min(100, score));
    }
}
