package com.sanjeev.resumeanalyzer.analysis;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanjeev.resumeanalyzer.ai.GeminiClient;
import com.sanjeev.resumeanalyzer.ai.Schemas;
import com.sanjeev.resumeanalyzer.ai.Uploads;
import com.sanjeev.resumeanalyzer.email.EmailService;
import com.sanjeev.resumeanalyzer.exception.NotFoundException;
import com.sanjeev.resumeanalyzer.model.AnalysisResult;
import com.sanjeev.resumeanalyzer.model.TailoredResume;
import com.sanjeev.resumeanalyzer.security.RateLimiter;
import com.sanjeev.resumeanalyzer.user.CurrentUser;
import com.sanjeev.resumeanalyzer.user.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.UncheckedIOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Set;

/** "Tailored resume" on a report: the AI rewrites the analysed resume for that job, using only real facts. */
@RestController
@RequestMapping("/api/analyses/{id}/tailored-resume")
public class TailoredResumeController {

    public static final Set<String> TEMPLATES = Set.of("classic", "modern", "compact");
    private static final int EMAILS_PER_HOUR = 5;

    private static final String SYSTEM_PROMPT = """
            You are an expert resume writer who builds ATS-friendly resumes that win interviews.
            Rewrite the candidate's resume (attached PDF) so it is the strongest truthful match for the job described.
            Rules:
            - Use only facts from the resume. Never invent employers, job titles, dates, degrees, certifications,
              metrics or skills. If the resume has no number for an achievement, don't make one up.
            - Keep every real job, project and degree, with the original dates. Drop school-level entries
              (e.g. 10th/12th grade) only if the candidate has a college degree.
            - Title: the target job's title if the candidate's background fits it, otherwise their own title.
            - Summary: 2-3 sentences aimed at this job, using its exact keywords where they truthfully apply.
            - Skills: the candidate's real skills, most relevant to the job first, using the job's wording for
              the same thing (e.g. "REST APIs" not "web services"). Add a missing job skill only if the resume
              shows the candidate used it.
            - Bullets: start with a strong action verb, show impact, 2-5 per role, most relevant first.
              Apply the analysis's improved bullets and suggestions where they fit.
            - Plain text only: no markdown, no emojis, no tables. Use "" or [] for anything the resume lacks.
            """;

    private static final Map<String, Object> SCHEMA = Schemas.object(Map.ofEntries(
            Map.entry("fullName", Schemas.string("Candidate's full name as on the resume")),
            Map.entry("title", Schemas.string("Professional headline, e.g. 'Java Full Stack Developer'")),
            Map.entry("email", Schemas.string("Email from the resume, or empty")),
            Map.entry("phone", Schemas.string("Phone from the resume, or empty")),
            Map.entry("location", Schemas.string("City, country from the resume, or empty")),
            Map.entry("linkedin", Schemas.string("LinkedIn URL/handle from the resume, or empty")),
            Map.entry("website", Schemas.string("GitHub or portfolio URL from the resume, or empty")),
            Map.entry("summary", Schemas.string("2-3 sentence professional summary targeted at this job")),
            Map.entry("skills", Schemas.stringList("Skills, most relevant to the job first")),
            Map.entry("experience", Schemas.list("Work experience, most recent first", Schemas.object(Map.of(
                    "role", Schemas.string("Job title"),
                    "company", Schemas.string("Employer"),
                    "location", Schemas.string("Location, or empty"),
                    "start", Schemas.string("Start date as on the resume, e.g. 'Jan 2024', or empty"),
                    "end", Schemas.string("End date, 'Present', or empty"),
                    "bullets", Schemas.stringList("Achievement bullets without leading dashes"))))),
            Map.entry("projects", Schemas.list("Projects, most relevant to the job first", Schemas.object(Map.of(
                    "name", Schemas.string("Project name"),
                    "tech", Schemas.string("Technologies used, comma separated"),
                    "link", Schemas.string("Project URL, or empty"),
                    "bullets", Schemas.stringList("What the candidate built or achieved"))))),
            Map.entry("education", Schemas.list("Education, most recent first", Schemas.object(Map.of(
                    "degree", Schemas.string("Degree or qualification"),
                    "school", Schemas.string("College or university"),
                    "year", Schemas.string("Years, e.g. '2020 - 2024'"),
                    "score", Schemas.string("CGPA or percentage, or empty"))))),
            Map.entry("certifications", Schemas.stringList("Certifications from the resume"))));

    public record TailoredView(TailoredResume resume, Instant generatedAt, boolean hasSourceResume) {
    }

    public record EmailRequest(String template) {
    }

    private final GeminiClient gemini;
    private final AnalysisRepository analyses;
    private final AnalysisResumeRepository resumes;
    private final EmailService emailService;
    private final CurrentUser currentUser;
    private final ObjectMapper objectMapper;
    private final RateLimiter rateLimiter;
    private final int aiRequestsPerHour;
    private final String frontendUrl;

    public TailoredResumeController(GeminiClient gemini, AnalysisRepository analyses, AnalysisResumeRepository resumes,
                                    EmailService emailService, CurrentUser currentUser, ObjectMapper objectMapper,
                                    RateLimiter rateLimiter,
                                    @Value("${app.rate-limit.analyses-per-hour}") int aiRequestsPerHour,
                                    @Value("${app.frontend-url}") String frontendUrl) {
        this.gemini = gemini;
        this.analyses = analyses;
        this.resumes = resumes;
        this.emailService = emailService;
        this.currentUser = currentUser;
        this.objectMapper = objectMapper;
        this.rateLimiter = rateLimiter;
        this.aiRequestsPerHour = aiRequestsPerHour;
        this.frontendUrl = frontendUrl;
    }

    @GetMapping
    public TailoredView get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        Analysis analysis = owned(jwt, id);
        return resumes.findById(analysis.getId())
                .map(r -> new TailoredView(fromJson(r.getTailoredJson()), r.getTailoredAt(), true))
                .orElse(new TailoredView(null, null, false));
    }

    /**
     * Generates (or regenerates) the tailored resume. Reports made before PDFs were kept have no stored
     * resume, so the user uploads it again once.
     */
    @PostMapping
    public TailoredView generate(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                 @RequestParam(value = "resume", required = false) MultipartFile upload) {
        User user = currentUser.from(jwt);
        Analysis analysis = owned(jwt, id);
        byte[] uploaded = Uploads.optionalPdf(upload);
        AnalysisResume stored = resumes.findById(analysis.getId()).orElse(null);
        if (stored == null && uploaded == null) {
            throw new IllegalArgumentException("Please upload the resume you analysed for this report.");
        }
        rateLimiter.check("tailor:" + user.getId(), aiRequestsPerHour, Duration.ofHours(1),
                "You've reached the limit of " + aiRequestsPerHour + " tailored resumes per hour. Please try again later.");

        byte[] pdf = uploaded != null ? uploaded : stored.getPdf();
        String prompt = "<job_description>\n" + analysis.getJobDescription() + "\n</job_description>\n\n"
                + "<analysis>\n" + analysis.getResultJson() + "\n</analysis>";
        TailoredResume tailored = gemini.structured(SYSTEM_PROMPT, pdf, prompt, "tailored_resume", SCHEMA,
                TailoredResume.class);

        AnalysisResume record = stored != null ? stored : new AnalysisResume(analysis.getId(), pdf);
        if (uploaded != null) record.replacePdf(uploaded);
        record.setTailored(toJson(tailored));
        AnalysisResume saved = resumes.save(record);
        return new TailoredView(tailored, saved.getTailoredAt(), true);
    }

    /** Emails the tailored resume, in the template the user picked, to their registered address. */
    @PostMapping("/email")
    public ResponseEntity<Map<String, String>> email(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                                     @RequestBody EmailRequest request) {
        User user = currentUser.from(jwt);
        Analysis analysis = owned(jwt, id);
        String template = request == null || request.template() == null ? "classic" : request.template();
        if (!TEMPLATES.contains(template)) {
            throw new IllegalArgumentException("Template must be classic, modern or compact.");
        }
        TailoredResume tailored = resumes.findById(analysis.getId())
                .map(r -> fromJson(r.getTailoredJson()))
                .orElse(null);
        if (tailored == null) {
            throw new IllegalArgumentException("Generate the tailored resume first.");
        }
        if (!emailService.isEnabled()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Email isn't set up on the server yet."));
        }
        rateLimiter.check("tailor-email:" + user.getId(), EMAILS_PER_HOUR, Duration.ofHours(1),
                "You've reached the limit of " + EMAILS_PER_HOUR + " emails per hour. Please try again later.");

        AnalysisResult result = readResult(analysis.getResultJson());
        String reportLink = frontendUrl + "/analyses/" + analysis.getId();
        emailService.sendTailoredResume(user.getEmail(), user.getName(), result, tailored, template, reportLink);
        return ResponseEntity.accepted().body(Map.of("message", "Sent to " + user.getEmail()));
    }

    private Analysis owned(Jwt jwt, Long id) {
        return analyses.findByIdAndUserId(id, Long.valueOf(jwt.getSubject()))
                .orElseThrow(() -> new NotFoundException("Analysis not found."));
    }

    private String toJson(TailoredResume resume) {
        try {
            return objectMapper.writeValueAsString(resume);
        } catch (JsonProcessingException e) {
            throw new UncheckedIOException(e);
        }
    }

    private TailoredResume fromJson(String json) {
        if (json == null) return null;
        try {
            return objectMapper.readValue(json, TailoredResume.class);
        } catch (JsonProcessingException e) {
            throw new UncheckedIOException(e);
        }
    }

    private AnalysisResult readResult(String json) {
        try {
            return objectMapper.readValue(json, AnalysisResult.class);
        } catch (JsonProcessingException e) {
            throw new UncheckedIOException(e);
        }
    }
}
