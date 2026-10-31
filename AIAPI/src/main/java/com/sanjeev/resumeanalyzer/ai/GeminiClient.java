package com.sanjeev.resumeanalyzer.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanjeev.resumeanalyzer.exception.AnalysisException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Shared Google Gemini generateContent call with structured (JSON schema) output. Every AI feature
 * (resume analysis, cover letters, interview prep) goes through here.
 */
@Component
public class GeminiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);
    private static final Set<String> BLOCKED = Set.of(
            "SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII", "IMAGE_SAFETY");

    private final RestClient gemini;
    private final ObjectMapper objectMapper;
    private final String model;

    public GeminiClient(RestClient gemini, ObjectMapper objectMapper, @Value("${gemini.model}") String model) {
        this.gemini = gemini;
        this.objectMapper = objectMapper;
        this.model = model;
    }

    /**
     * Sends the prompt (plus an optional PDF) and parses the reply into {@code type}.
     *
     * @param pdf        PDF bytes to attach, or null for a text-only request
     * @param schemaName short name of the output, used in logs
     */
    public <T> T structured(String systemPrompt, byte[] pdf, String userText,
                            String schemaName, Map<String, Object> schema, Class<T> type) {
        List<Map<String, Object>> parts = new ArrayList<>();
        if (pdf != null) {
            parts.add(Map.of("inlineData", Map.of(
                    "mimeType", "application/pdf",
                    "data", Base64.getEncoder().encodeToString(pdf))));
        }
        parts.add(Map.of("text", userText));

        Map<String, Object> request = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
                "contents", List.of(Map.of("role", "user", "parts", parts)),
                // Structured output: the reply must be JSON matching this schema
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "responseJsonSchema", schema));

        JsonNode response = gemini.post()
                .uri("/models/{model}:generateContent", model)
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(JsonNode.class);

        if (response == null) {
            throw new AnalysisException("The AI returned an empty response. Please try again.");
        }
        if (response.path("promptFeedback").hasNonNull("blockReason")) {
            log.warn("Gemini blocked the {} prompt: {}", schemaName, response.path("promptFeedback"));
            throw new AnalysisException("The AI declined this request. Please try different content.");
        }
        JsonNode candidate = response.path("candidates").path(0);
        if (candidate.isMissingNode()) {
            throw new AnalysisException("The AI returned an empty response. Please try again.");
        }
        String finishReason = candidate.path("finishReason").asText();
        if (BLOCKED.contains(finishReason)) {
            log.warn("Gemini stopped the {} reply: {}", schemaName, finishReason);
            throw new AnalysisException("The AI declined this request. Please try different content.");
        }
        if ("MAX_TOKENS".equals(finishReason)) {
            throw new AnalysisException("The AI response was cut off. Please try a shorter input.");
        }

        // The JSON may be split across several parts; skip any "thought" parts
        StringBuilder text = new StringBuilder();
        for (JsonNode part : candidate.path("content").path("parts")) {
            if (!part.path("thought").asBoolean(false)) {
                text.append(part.path("text").asText(""));
            }
        }
        try {
            return objectMapper.readValue(text.toString(), type);
        } catch (JsonProcessingException e) {
            log.warn("Gemini returned unparseable {} JSON (finishReason={})", schemaName, finishReason);
            throw new AnalysisException("The AI returned an unreadable response. Please try again.");
        }
    }
}
