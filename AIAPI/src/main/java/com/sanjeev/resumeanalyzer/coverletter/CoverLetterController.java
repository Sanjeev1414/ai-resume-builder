package com.sanjeev.resumeanalyzer.coverletter;

import com.sanjeev.resumeanalyzer.ai.GeminiClient;
import com.sanjeev.resumeanalyzer.ai.Schemas;
import com.sanjeev.resumeanalyzer.ai.Uploads;
import com.sanjeev.resumeanalyzer.exception.NotFoundException;
import com.sanjeev.resumeanalyzer.security.RateLimiter;
import com.sanjeev.resumeanalyzer.user.CurrentUser;
import com.sanjeev.resumeanalyzer.user.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** AI cover letters: generate from resume + job post, then list, edit and delete saved letters. */
@RestController
@RequestMapping("/api/cover-letters")
public class CoverLetterController {

    private static final Set<String> TONES = Set.of("professional", "enthusiastic", "concise");

    private static final String SYSTEM_PROMPT = """
            You are an expert career coach who writes cover letters that get interviews.
            Write a cover letter for the candidate (resume attached as PDF) applying to the job described.
            Rules:
            - Use only facts from the resume - never invent experience, employers, numbers or skills.
            - Open with a specific hook about the role/company, not "I am writing to apply".
            - Connect 2-3 of the candidate's most relevant achievements to the job's key requirements,
              using the job description's exact keywords where they truthfully apply.
            - Close with a confident call to action.
            - 250-350 words (150-220 for the "concise" tone), plain text, no markdown, no placeholders
              except [Hiring Manager] when no name is known.
            - Include greeting and sign-off with the candidate's name from the resume.
            Separate paragraphs with a blank line.
            """;

    private static final Map<String, Object> SCHEMA = Schemas.object(Map.of(
            "subject", Schemas.string("Email subject line for sending this application"),
            "letter", Schemas.string("The full cover letter text, paragraphs separated by blank lines")));

    public record AiLetter(String subject, String letter) {
    }

    public record CoverLetterView(Long id, String companyName, String jobTitle, String tone,
                                  String subject, String content, Instant createdAt) {
        static CoverLetterView of(CoverLetter c) {
            return new CoverLetterView(c.getId(), c.getCompanyName(), c.getJobTitle(), c.getTone(),
                    c.getSubject(), c.getContent(), c.getCreatedAt());
        }
    }

    public record UpdateRequest(
            @NotBlank(message = "Subject is required") @Size(max = 255) String subject,
            @NotBlank(message = "Letter can't be empty") @Size(max = 10_000) String content) {
    }

    private final GeminiClient gemini;
    private final CoverLetterRepository letters;
    private final CurrentUser currentUser;
    private final RateLimiter rateLimiter;
    private final int aiRequestsPerHour;

    public CoverLetterController(GeminiClient gemini, CoverLetterRepository letters, CurrentUser currentUser,
                                 RateLimiter rateLimiter,
                                 @Value("${app.rate-limit.analyses-per-hour}") int aiRequestsPerHour) {
        this.gemini = gemini;
        this.letters = letters;
        this.currentUser = currentUser;
        this.rateLimiter = rateLimiter;
        this.aiRequestsPerHour = aiRequestsPerHour;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public CoverLetterView generate(@AuthenticationPrincipal Jwt jwt,
                                    @RequestParam("resume") MultipartFile resume,
                                    @RequestParam("jobDescription") String jobDescription,
                                    @RequestParam(value = "companyName", required = false) String companyName,
                                    @RequestParam(value = "jobTitle", required = false) String jobTitle,
                                    @RequestParam(value = "tone", defaultValue = "professional") String tone) {
        User user = currentUser.from(jwt);
        byte[] pdf = Uploads.requirePdf(resume);
        String jd = Uploads.requireJobDescription(jobDescription);
        String company = Uploads.optionalText(companyName, 120);
        String title = Uploads.optionalText(jobTitle, 120);
        if (!TONES.contains(tone)) {
            throw new IllegalArgumentException("Tone must be professional, enthusiastic or concise.");
        }
        rateLimiter.check("cover-letter:" + user.getId(), aiRequestsPerHour, Duration.ofHours(1),
                "You've reached the limit of " + aiRequestsPerHour + " cover letters per hour. Please try again later.");

        String prompt = "Tone: " + tone + "\n"
                + (company != null ? "Company: " + company + "\n" : "")
                + (title != null ? "Job title: " + title + "\n" : "")
                + "\n<job_description>\n" + jd + "\n</job_description>";
        AiLetter ai = gemini.structured(SYSTEM_PROMPT, pdf, prompt, "cover_letter", SCHEMA, AiLetter.class);

        CoverLetter saved = letters.save(new CoverLetter(user, company, title, tone,
                truncate(ai.subject(), 255), ai.letter().strip()));
        return CoverLetterView.of(saved);
    }

    @GetMapping
    public List<CoverLetterView> list(@AuthenticationPrincipal Jwt jwt) {
        return letters.findTop50ByUserIdOrderByCreatedAtDesc(userId(jwt)).stream().map(CoverLetterView::of).toList();
    }

    @GetMapping("/{id}")
    public CoverLetterView get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return CoverLetterView.of(find(jwt, id));
    }

    @PutMapping("/{id}")
    @Transactional
    public CoverLetterView update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                  @Valid @RequestBody UpdateRequest request) {
        CoverLetter letter = find(jwt, id);
        letter.updateContent(request.subject().strip(), request.content().strip());
        return CoverLetterView.of(letters.save(letter));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        letters.delete(find(jwt, id));
    }

    private CoverLetter find(Jwt jwt, Long id) {
        return letters.findByIdAndUserId(id, userId(jwt))
                .orElseThrow(() -> new NotFoundException("Cover letter not found."));
    }

    private static Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }

    private static String truncate(String text, int max) {
        String value = text == null ? "Application" : text.strip();
        return value.length() > max ? value.substring(0, max) : value;
    }
}
