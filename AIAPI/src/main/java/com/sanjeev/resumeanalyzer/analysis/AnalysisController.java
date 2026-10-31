package com.sanjeev.resumeanalyzer.analysis;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanjeev.resumeanalyzer.analysis.AnalysisDtos.AnalysisDetail;
import com.sanjeev.resumeanalyzer.analysis.AnalysisDtos.AnalysisSummary;
import com.sanjeev.resumeanalyzer.email.EmailService;
import com.sanjeev.resumeanalyzer.exception.NotFoundException;
import com.sanjeev.resumeanalyzer.model.AnalysisResult;
import com.sanjeev.resumeanalyzer.security.RateLimiter;
import com.sanjeev.resumeanalyzer.service.ResumeAnalyzerService;
import com.sanjeev.resumeanalyzer.user.CurrentUser;
import com.sanjeev.resumeanalyzer.user.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AnalysisController {

    private static final int MIN_JOB_DESCRIPTION_LENGTH = 50;
    private static final int MAX_JOB_DESCRIPTION_LENGTH = 20_000;

    private final ResumeAnalyzerService analyzerService;
    private final AnalysisRepository analyses;
    private final AnalysisResumeRepository resumes;
    private final EmailService emailService;
    private final CurrentUser currentUser;
    private final ObjectMapper objectMapper;
    private final RateLimiter rateLimiter;
    private final int analysesPerHour;

    public AnalysisController(ResumeAnalyzerService analyzerService, AnalysisRepository analyses,
                              AnalysisResumeRepository resumes, EmailService emailService, CurrentUser currentUser, ObjectMapper objectMapper,
                              RateLimiter rateLimiter,
                              @Value("${app.rate-limit.analyses-per-hour}") int analysesPerHour) {
        this.analyzerService = analyzerService;
        this.analyses = analyses;
        this.resumes = resumes;
        this.emailService = emailService;
        this.currentUser = currentUser;
        this.objectMapper = objectMapper;
        this.rateLimiter = rateLimiter;
        this.analysesPerHour = analysesPerHour;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    /** Analyzes the resume, saves the result for this user and emails it to them. */
    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AnalysisDetail analyze(@AuthenticationPrincipal Jwt jwt,
                                  @RequestParam("resume") MultipartFile resume,
                                  @RequestParam("jobDescription") String jobDescription) throws IOException {
        User user = currentUser.from(jwt);

        if (resume.isEmpty()) {
            throw new IllegalArgumentException("Please upload your resume.");
        }
        byte[] bytes = resume.getBytes();
        if (!isPdf(bytes)) {
            throw new IllegalArgumentException("Resume must be a PDF file.");
        }
        String jd = jobDescription == null ? "" : jobDescription.strip();
        if (jd.length() < MIN_JOB_DESCRIPTION_LENGTH) {
            throw new IllegalArgumentException("Please paste the full job description (at least "
                    + MIN_JOB_DESCRIPTION_LENGTH + " characters).");
        }
        if (jd.length() > MAX_JOB_DESCRIPTION_LENGTH) {
            throw new IllegalArgumentException("Job description is too long (max "
                    + MAX_JOB_DESCRIPTION_LENGTH + " characters).");
        }

        rateLimiter.check("analyze:" + user.getId(), analysesPerHour, Duration.ofHours(1),
                "You've reached the limit of " + analysesPerHour + " analyses per hour. Please try again later.");
        AnalysisResult result = analyzerService.analyze(bytes, jd);
        Analysis saved = analyses.save(new Analysis(user, safeFileName(resume.getOriginalFilename()), jd,
                result.matchScore(), toJson(result)));
        // Kept so the report can generate a tailored resume later without asking for the file again
        resumes.save(new AnalysisResume(saved.getId(), bytes));

        boolean emailQueued = emailService.isEnabled();
        if (emailQueued) {
            emailService.sendAnalysisReport(user.getEmail(), user.getName(), result);
        }
        return new AnalysisDetail(saved.getId(), saved.getResumeFileName(), jd, saved.getCreatedAt(), result, emailQueued);
    }

    @GetMapping("/analyses")
    public List<AnalysisSummary> history(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.valueOf(jwt.getSubject());
        return analyses.findTop50ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(a -> new AnalysisSummary(a.getId(), a.getResumeFileName(), preview(a.getJobDescription()),
                        a.getMatchScore(), a.getCreatedAt()))
                .toList();
    }

    @GetMapping("/analyses/{id}")
    public AnalysisDetail get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        Analysis a = analyses.findByIdAndUserId(id, Long.valueOf(jwt.getSubject()))
                .orElseThrow(() -> new NotFoundException("Analysis not found."));
        return new AnalysisDetail(a.getId(), a.getResumeFileName(), a.getJobDescription(), a.getCreatedAt(),
                fromJson(a.getResultJson()), false);
    }

    /** Checks the "%PDF" magic bytes rather than trusting the file name or browser-sent type. */
    private static boolean isPdf(byte[] bytes) {
        return bytes.length > 4 && bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F';
    }

    private static String safeFileName(String name) {
        if (name == null || name.isBlank()) return "resume.pdf";
        String base = name.replaceAll("^.*[\\\\/]", "");
        return base.length() > 200 ? base.substring(0, 200) : base;
    }

    private static String preview(String text) {
        String oneLine = text.replaceAll("\\s+", " ").strip();
        return oneLine.length() > 120 ? oneLine.substring(0, 120) + "…" : oneLine;
    }

    private String toJson(AnalysisResult result) {
        try {
            return objectMapper.writeValueAsString(result);
        } catch (JsonProcessingException e) {
            throw new UncheckedIOException(e);
        }
    }

    private AnalysisResult fromJson(String json) {
        try {
            return objectMapper.readValue(json, AnalysisResult.class);
        } catch (JsonProcessingException e) {
            throw new UncheckedIOException(e);
        }
    }
}
