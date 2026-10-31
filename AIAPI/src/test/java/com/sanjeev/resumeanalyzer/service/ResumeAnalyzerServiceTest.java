package com.sanjeev.resumeanalyzer.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanjeev.resumeanalyzer.ai.GeminiClient;
import com.sanjeev.resumeanalyzer.exception.AnalysisException;
import com.sanjeev.resumeanalyzer.model.AnalysisResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class ResumeAnalyzerServiceTest {

    private static final byte[] PDF = "%PDF-1.4 test".getBytes(StandardCharsets.UTF_8);
    private static final String JOB = "Java developer with Spring Boot and SQL experience for our backend team.";
    private static final String URL = "https://gemini.test/v1beta/models/gemini-test:generateContent";

    private MockRestServiceServer server;
    private ResumeAnalyzerService service;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://gemini.test/v1beta");
        server = MockRestServiceServer.bindTo(builder).build();
        service = new ResumeAnalyzerService(new GeminiClient(builder.build(), new ObjectMapper(), "gemini-test"));
    }

    @Test
    void sendsPdfWithJsonSchemaAndParsesTheResult() {
        String content = """
                {"matchScore":140,"atsScore":-5,"summary":"Great","matchedSkills":["Java"],"missingSkills":[],"atsIssues":["No Skills section"],
                 "bulletRewrites":[{"original":"a","improved":"b","reason":"c"}],"suggestions":["x"]}""";
        server.expect(requestTo(URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(jsonPath("$.generationConfig.responseMimeType").value("application/json"))
                .andExpect(jsonPath("$.generationConfig.responseJsonSchema.type").value("object"))
                .andExpect(jsonPath("$.systemInstruction.parts[0].text").isNotEmpty())
                .andExpect(jsonPath("$.contents[0].parts[0].inlineData.mimeType").value("application/pdf"))
                .andExpect(jsonPath("$.contents[0].parts[0].inlineData.data").isNotEmpty())
                .andRespond(withSuccess(reply(content, "STOP"), MediaType.APPLICATION_JSON));

        AnalysisResult result = service.analyze(PDF, JOB);

        assertThat(result.matchScore()).isEqualTo(100); // clamped to 0-100
        assertThat(result.atsScore()).isEqualTo(0);
        assertThat(result.atsIssues()).containsExactly("No Skills section");
        assertThat(result.matchedSkills()).containsExactly("Java");
        assertThat(result.bulletRewrites().get(0).improved()).isEqualTo("b");
        server.verify();
    }

    @Test
    void safetyBlockBecomesAFriendlyError() {
        server.expect(requestTo(URL))
                .andRespond(withSuccess(reply(null, "SAFETY"), MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> service.analyze(PDF, JOB))
                .isInstanceOf(AnalysisException.class)
                .hasMessageContaining("declined");
    }

    @Test
    void blockedPromptBecomesAFriendlyError() {
        server.expect(requestTo(URL))
                .andRespond(withSuccess("{\"promptFeedback\":{\"blockReason\":\"SAFETY\"}}", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> service.analyze(PDF, JOB))
                .isInstanceOf(AnalysisException.class)
                .hasMessageContaining("declined");
    }

    @Test
    void truncatedReplyBecomesAFriendlyError() {
        server.expect(requestTo(URL))
                .andRespond(withSuccess(reply("{\"matchScore\":", "MAX_TOKENS"), MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> service.analyze(PDF, JOB))
                .isInstanceOf(AnalysisException.class)
                .hasMessageContaining("cut off");
    }

    private static String reply(String text, String finishReason) {
        ObjectMapper mapper = new ObjectMapper();
        var candidate = mapper.createObjectNode().put("finishReason", finishReason);
        if (text != null) {
            var content = candidate.putObject("content").put("role", "model");
            content.putArray("parts").addObject().put("text", text);
        }
        var root = mapper.createObjectNode();
        root.putArray("candidates").add(candidate);
        return root.toString();
    }
}
