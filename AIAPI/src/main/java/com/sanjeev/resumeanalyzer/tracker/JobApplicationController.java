package com.sanjeev.resumeanalyzer.tracker;

import com.sanjeev.resumeanalyzer.exception.NotFoundException;
import com.sanjeev.resumeanalyzer.tracker.JobApplication.Status;
import com.sanjeev.resumeanalyzer.user.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Job tracker: create, list, update and delete the user's job applications. */
@RestController
@RequestMapping("/api/applications")
public class JobApplicationController {

    private static final int MAX_APPLICATIONS = 500;

    public record ApplicationRequest(
            @NotBlank(message = "Company is required") @Size(max = 120) String company,
            @NotBlank(message = "Role is required") @Size(max = 120) String role,
            @NotNull(message = "Status is required") Status status,
            @Size(max = 120) String location,
            @Size(max = 500) @Pattern(regexp = "^$|^https?://.*", message = "Job link must start with http:// or https://")
            String jobUrl,
            LocalDate appliedOn,
            @Size(max = 5000, message = "Notes are too long") String notes) {
    }

    public record ApplicationView(Long id, String company, String role, Status status, String location,
                                  String jobUrl, LocalDate appliedOn, String notes, Instant updatedAt) {
        static ApplicationView of(JobApplication a) {
            return new ApplicationView(a.getId(), a.getCompany(), a.getRole(), a.getStatus(), a.getLocation(),
                    a.getJobUrl(), a.getAppliedOn(), a.getNotes(), a.getUpdatedAt());
        }
    }

    private final JobApplicationRepository applications;
    private final CurrentUser currentUser;

    public JobApplicationController(JobApplicationRepository applications, CurrentUser currentUser) {
        this.applications = applications;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<ApplicationView> list(@AuthenticationPrincipal Jwt jwt) {
        return applications.findByUserIdOrderByUpdatedAtDesc(Long.valueOf(jwt.getSubject())).stream()
                .map(ApplicationView::of).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationView create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ApplicationRequest request) {
        var user = currentUser.from(jwt);
        if (applications.countByUserId(user.getId()) >= MAX_APPLICATIONS) {
            throw new IllegalArgumentException("You can track up to " + MAX_APPLICATIONS + " applications.");
        }
        JobApplication application = new JobApplication(user);
        apply(application, request);
        return ApplicationView.of(applications.save(application));
    }

    @PutMapping("/{id}")
    @Transactional
    public ApplicationView update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                  @Valid @RequestBody ApplicationRequest request) {
        JobApplication application = find(jwt, id);
        apply(application, request);
        return ApplicationView.of(applications.save(application));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        applications.delete(find(jwt, id));
    }

    private JobApplication find(Jwt jwt, Long id) {
        return applications.findByIdAndUserId(id, Long.valueOf(jwt.getSubject()))
                .orElseThrow(() -> new NotFoundException("Application not found."));
    }

    private static void apply(JobApplication a, ApplicationRequest r) {
        a.update(r.company().strip(), r.role().strip(), r.status(), blankToNull(r.location()),
                blankToNull(r.jobUrl()), r.appliedOn(), blankToNull(r.notes()));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
