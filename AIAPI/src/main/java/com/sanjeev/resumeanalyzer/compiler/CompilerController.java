package com.sanjeev.resumeanalyzer.compiler;

import com.sanjeev.resumeanalyzer.compiler.CompilerClient.RunResult;
import com.sanjeev.resumeanalyzer.security.RateLimiter;
import com.sanjeev.resumeanalyzer.user.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.Map;

/** Online compiler for the Interview Preparation pages: signed-in users run Java and Python. */
@RestController
@RequestMapping("/api/compiler")
public class CompilerController {

    private static final Logger log = LoggerFactory.getLogger(CompilerController.class);
    private static final int RUNS_PER_MINUTE = 30;

    private final CompilerClient compiler;
    private final CurrentUser currentUser;
    private final RateLimiter rateLimiter;

    public CompilerController(CompilerClient compiler, CurrentUser currentUser, RateLimiter rateLimiter) {
        this.compiler = compiler;
        this.currentUser = currentUser;
        this.rateLimiter = rateLimiter;
    }

    public record RunRequest(
            @NotBlank(message = "Please choose a language.") String language,
            @NotBlank(message = "Please write some code first.")
            @Size(max = 50_000, message = "Code is too long (max 50,000 characters).") String code,
            @Size(max = 10_000, message = "Input is too long (max 10,000 characters).") String stdin) {}

    @PostMapping("/run")
    public RunResult run(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody RunRequest request) {
        rateLimiter.check("compiler:" + currentUser.from(jwt).getId(), RUNS_PER_MINUTE, Duration.ofMinutes(1),
                "You've reached the limit of " + RUNS_PER_MINUTE + " runs per minute. Please wait a moment.");
        return compiler.run(request.language(), request.code(), request.stdin());
    }

    /** Wandbox limits requests per address, and all users of this server share one address. */
    @ExceptionHandler(HttpClientErrorException.TooManyRequests.class)
    public ResponseEntity<Map<String, String>> compilerBusy(HttpClientErrorException.TooManyRequests e) {
        log.warn("Online compiler rate limit reached");
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of("error", "The free online compiler is busy right now. Please wait a few seconds and press Run again."));
    }

    /** Takes priority over the global handlers, whose messages are about the AI service. */
    @ExceptionHandler(RestClientException.class)
    public ResponseEntity<Map<String, String>> compilerUnavailable(RestClientException e) {
        log.warn("Online compiler call failed: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "The online compiler is not responding. Please try again in a moment."));
    }
}
