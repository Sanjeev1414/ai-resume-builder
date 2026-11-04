package com.sanjeev.resumeanalyzer.compiler;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Runs code on Wandbox, a free online compiler with no API key. Code never runs on this server,
 * which holds the database password and API keys.
 */
@Component
public class CompilerClient {

    private static final Map<String, String> COMPILERS = Map.of(
            "java", "openjdk-jdk-22+36",
            "python", "cpython-3.12.7");
    private static final int MAX_OUTPUT_CHARS = 100_000;

    // Wandbox saves Java as prog.java, so a top-level "public class Main" would not compile
    private static final Pattern PUBLIC_TOP_LEVEL_TYPE = Pattern.compile(
            "(?m)^public\\s+(?=(?:(?:final|abstract|sealed|non-sealed|strictfp)\\s+)*(?:class|interface|enum|record|@interface)\\b)");

    private final RestClient wandbox;
    private final ObjectMapper objectMapper;

    public CompilerClient(@Value("${compiler.base-url}") String baseUrl, ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(45));
        this.wandbox = RestClient.builder().baseUrl(baseUrl).requestFactory(requestFactory).build();
    }

    public record RunResult(String status, String signal, String compileError, String stdout, String stderr) {}

    public RunResult run(String language, String code, String stdin) {
        String compiler = COMPILERS.get(language);
        if (compiler == null) {
            throw new IllegalArgumentException("Only Java and Python run on the server.");
        }
        // Wandbox sends JSON without a Content-Type header, so it has to be parsed by hand
        String body = wandbox.post()
                .uri("/api/compile.json")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "compiler", compiler,
                        "code", "java".equals(language) ? forWandbox(code) : code,
                        "stdin", stdin == null ? "" : stdin))
                .retrieve()
                .body(String.class);
        JsonNode reply;
        try {
            reply = objectMapper.readTree(body);
        } catch (JsonProcessingException e) {
            throw new RestClientException("Wandbox sent a reply that is not JSON", e);
        }
        return new RunResult(text(reply, "status"), text(reply, "signal"), text(reply, "compiler_error"),
                text(reply, "program_output"), text(reply, "program_error"));
    }

    /** Removes only the word "public", so line numbers in compile errors still match the editor. */
    static String forWandbox(String javaCode) {
        return PUBLIC_TOP_LEVEL_TYPE.matcher(javaCode).replaceAll("");
    }

    private static String text(JsonNode reply, String field) {
        String value = reply == null ? "" : reply.path(field).asText("");
        return value.length() > MAX_OUTPUT_CHARS ? value.substring(0, MAX_OUTPUT_CHARS) + "\n... output truncated" : value;
    }
}
