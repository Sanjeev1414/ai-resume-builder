package com.sanjeev.resumeanalyzer.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanjeev.resumeanalyzer.exception.AnalysisException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Shared OpenAI Chat Completions call with strict structured output. Every AI feature
 * (resume analysis, cover letters, interview prep) goes through here.
 */
@Component
public class OpenAiClient {

    private final RestClient openAi;
    private final ObjectMapper objectMapper;
    private final String model;

    public OpenAiClient(RestClient openAi, ObjectMapper objectMapper, @Value("${openai.model}") String model) {
        this.openAi = openAi;
        this.objectMapper = objectMapper;
        this.model = model;
    }

    /**
     * Sends the prompt (plus an optional PDF) and parses the reply into {@code type}.
     *
     * @param pdf PDF bytes to attach, or null for a text-only request
     */
    public <T> T structured(String systemPrompt, byte[] pdf, String userText,
                            String schemaName, Map<String, Object> schema, Class<T> type) {
        List<Map<String, Object>> userContent = new ArrayList<>();
        if (pdf != null) {
            userContent.add(Map.of("type", "file", "file", Map.of(
                    "filename", "resume.pdf",
                    "file_data", "data:application/pdf;base64," + Base64.getEncoder().encodeToString(pdf))));
        }
        userContent.add(Map.of("type", "text", "text", userText));

        Map<String, Object> request = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userContent)),
                // Structured outputs: the reply must match this JSON schema exactly
                "response_format", Map.of(
                        "type", "json_schema",
                        "json_schema", Map.of("name", schemaName, "strict", true, "schema", schema)));

        JsonNode response = openAi.post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(JsonNode.class);

        JsonNode choice = response == null ? null : response.path("choices").path(0);
        if (choice == null || choice.isMissingNode()) {
            throw new AnalysisException("The AI returned an empty response. Please try again.");
        }
        JsonNode message = choice.path("message");
        if (message.hasNonNull("refusal")) {
            throw new AnalysisException("The AI declined this request. Please try different content.");
        }
        if ("length".equals(choice.path("finish_reason").asText())) {
            throw new AnalysisException("The AI response was cut off. Please try a shorter input.");
        }
        try {
            return objectMapper.readValue(message.path("content").asText(), type);
        } catch (JsonProcessingException e) {
            throw new AnalysisException("The AI returned an unreadable response. Please try again.");
        }
    }
}
