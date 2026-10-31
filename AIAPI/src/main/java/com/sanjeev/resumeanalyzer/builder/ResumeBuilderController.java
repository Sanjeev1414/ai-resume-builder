package com.sanjeev.resumeanalyzer.builder;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanjeev.resumeanalyzer.user.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.UncheckedIOException;
import java.time.Instant;

/** Saves and loads the Resume Builder form. The frontend owns the form's structure. */
@RestController
@RequestMapping("/api/resume-builder")
public class ResumeBuilderController {

    private static final int MAX_SIZE = 100_000;

    public record SaveRequest(@NotNull(message = "Resume data is required") JsonNode data) {
    }

    public record ResumeView(JsonNode data, Instant updatedAt) {
    }

    private final ResumeDocumentRepository documents;
    private final CurrentUser currentUser;
    private final ObjectMapper objectMapper;

    public ResumeBuilderController(ResumeDocumentRepository documents, CurrentUser currentUser, ObjectMapper objectMapper) {
        this.documents = documents;
        this.currentUser = currentUser;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public ResumeView get(@AuthenticationPrincipal Jwt jwt) {
        return documents.findByUserId(Long.valueOf(jwt.getSubject()))
                .map(d -> new ResumeView(readJson(d.getDataJson()), d.getUpdatedAt()))
                .orElse(new ResumeView(null, null));
    }

    @PutMapping
    @Transactional
    public ResumeView save(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody SaveRequest request) {
        if (!request.data().isObject()) {
            throw new IllegalArgumentException("Resume data must be an object.");
        }
        String json = request.data().toString();
        if (json.length() > MAX_SIZE) {
            throw new IllegalArgumentException("Resume is too long to save.");
        }
        var user = currentUser.from(jwt);
        ResumeDocument document = documents.findByUserId(user.getId()).orElseGet(() -> new ResumeDocument(user));
        document.update(json);
        ResumeDocument saved = documents.save(document);
        return new ResumeView(request.data(), saved.getUpdatedAt());
    }

    private JsonNode readJson(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (JsonProcessingException e) {
            throw new UncheckedIOException(e);
        }
    }
}
