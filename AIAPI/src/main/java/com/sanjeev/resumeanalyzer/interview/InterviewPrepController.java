package com.sanjeev.resumeanalyzer.interview;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanjeev.resumeanalyzer.ai.GeminiClient;
import com.sanjeev.resumeanalyzer.ai.Schemas;
import com.sanjeev.resumeanalyzer.ai.Uploads;
import com.sanjeev.resumeanalyzer.exception.NotFoundException;
import com.sanjeev.resumeanalyzer.security.RateLimiter;
import com.sanjeev.resumeanalyzer.user.CurrentUser;
import com.sanjeev.resumeanalyzer.user.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.UncheckedIOException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/** AI interview prep: likely questions for a job, with tips and sample answers. */
@RestController
@RequestMapping("/api/interview-prep")
public class InterviewPrepController {

    private static final String SYSTEM_PROMPT = """
            You are a senior interviewer and career coach. Prepare the candidate for an interview for the
            job described. If a resume PDF is attached, tailor questions and sample answers to the
            candidate's real experience - never invent facts; if no resume is attached, keep sample
            answers generic and mark where the candidate should add their own example.
            Produce 10-12 realistic questions: about 5 Technical, 3 Behavioral, 2 Role-specific and 1-2 HR.
            For behavioral questions, sample answers follow the STAR method (Situation, Task, Action, Result).
            Keep each sample answer under 120 words. Plain text, no markdown.
            """;

    private static final Map<String, Object> QUESTION = Schemas.object(Map.of(
            "category", Schemas.stringEnum("Question type", List.of("Technical", "Behavioral", "Role-specific", "HR")),
            "question", Schemas.string("The interview question"),
            "whyAsked", Schemas.string("One sentence: what the interviewer wants to learn"),
            "answerTips", Schemas.stringList("2-3 short tips for answering well"),
            "sampleAnswer", Schemas.string("A strong sample answer")));

    private static final Map<String, Object> SCHEMA = Schemas.object(Map.of(
            "focusAreas", Schemas.stringList("3-5 topics the candidate should revise before this interview"),
            "questions", Schemas.list("10-12 likely interview questions", QUESTION)));

    public record Question(String category, String question, String whyAsked,
                           List<String> answerTips, String sampleAnswer) {
    }

    public record PrepResult(List<String> focusAreas, List<Question> questions) {
    }

    public record PrepView(Long id, String jobTitle, String companyName, Instant createdAt, PrepResult result) {
    }

    public record PrepSummary(Long id, String jobTitle, String companyName, int questionCount, Instant createdAt) {
    }

    private final GeminiClient gemini;
    private final InterviewPrepRepository preps;
    private final CurrentUser currentUser;
    private final RateLimiter rateLimiter;
    private final ObjectMapper objectMapper;
    private final int aiRequestsPerHour;

    public InterviewPrepController(GeminiClient gemini, InterviewPrepRepository preps, CurrentUser currentUser,
                                   RateLimiter rateLimiter, ObjectMapper objectMapper,
                                   @Value("${app.rate-limit.analyses-per-hour}") int aiRequestsPerHour) {
        this.gemini = gemini;
        this.preps = preps;
        this.currentUser = currentUser;
        this.rateLimiter = rateLimiter;
        this.objectMapper = objectMapper;
        this.aiRequestsPerHour = aiRequestsPerHour;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public PrepView generate(@AuthenticationPrincipal Jwt jwt,
                             @RequestParam(value = "resume", required = false) MultipartFile resume,
                             @RequestParam("jobDescription") String jobDescription,
                             @RequestParam(value = "jobTitle", required = false) String jobTitle,
                             @RequestParam(value = "companyName", required = false) String companyName) {
        User user = currentUser.from(jwt);
        byte[] pdf = Uploads.optionalPdf(resume);
        String jd = Uploads.requireJobDescription(jobDescription);
        String title = Uploads.optionalText(jobTitle, 120);
        String company = Uploads.optionalText(companyName, 120);
        rateLimiter.check("interview:" + user.getId(), aiRequestsPerHour, Duration.ofHours(1),
                "You've reached the limit of " + aiRequestsPerHour + " interview preps per hour. Please try again later.");

        String prompt = (title != null ? "Job title: " + title + "\n" : "")
                + (company != null ? "Company: " + company + "\n" : "")
                + (pdf == null ? "No resume attached.\n" : "")
                + "\n<job_description>\n" + jd + "\n</job_description>";
        PrepResult result = gemini.structured(SYSTEM_PROMPT, pdf, prompt, "interview_prep", SCHEMA, PrepResult.class);

        InterviewPrep saved = preps.save(new InterviewPrep(user, title, company, toJson(result)));
        return new PrepView(saved.getId(), title, company, saved.getCreatedAt(), result);
    }

    @GetMapping
    public List<PrepSummary> list(@AuthenticationPrincipal Jwt jwt) {
        return preps.findTop50ByUserIdOrderByCreatedAtDesc(Long.valueOf(jwt.getSubject())).stream()
                .map(p -> new PrepSummary(p.getId(), p.getJobTitle(), p.getCompanyName(),
                        fromJson(p.getResultJson()).questions().size(), p.getCreatedAt()))
                .toList();
    }

    @GetMapping("/{id}")
    public PrepView get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        InterviewPrep p = find(jwt, id);
        return new PrepView(p.getId(), p.getJobTitle(), p.getCompanyName(), p.getCreatedAt(), fromJson(p.getResultJson()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        preps.delete(find(jwt, id));
    }

    private InterviewPrep find(Jwt jwt, Long id) {
        return preps.findByIdAndUserId(id, Long.valueOf(jwt.getSubject()))
                .orElseThrow(() -> new NotFoundException("Interview prep not found."));
    }

    private String toJson(PrepResult result) {
        try {
            return objectMapper.writeValueAsString(result);
        } catch (JsonProcessingException e) {
            throw new UncheckedIOException(e);
        }
    }

    private PrepResult fromJson(String json) {
        try {
            return objectMapper.readValue(json, PrepResult.class);
        } catch (JsonProcessingException e) {
            throw new UncheckedIOException(e);
        }
    }
}
