package com.sanjeev.resumeanalyzer.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanjeev.resumeanalyzer.ai.OpenAiClient;
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

    private MockRestServiceServer server;
    private ResumeAnalyzerService service;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://api.openai.test/v1");
        server = MockRestServiceServer.bindTo(builder).build();
        service = new ResumeAnalyzerService(new OpenAiClient(builder.build(), new ObjectMapper(), "gpt-test"));
    }

    @Test
    void sendsPdfWithStrictSchemaAndParsesTheResult() {
        String content = """
                {"matchScore":140,"atsScore":-5,"summary":"Great","matchedSkills":["Java"],"missingSkills":[],"atsIssues":["No Skills section"],
                 "bulletRewrites":[{"original":"a","improved":"b","reason":"c"}],"suggestions":["x"]}""";
        server.expect(requestTo("https://api.openai.test/v1/chat/completions"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(jsonPath("$.model").value("gpt-test"))
                .andExpect(jsonPath("$.response_format.json_schema.strict").value(true))
                .andExpect(jsonPath("$.messages[1].content[0].type").value("file"))
                .andExpect(jsonPath("$.messages[1].content[0].file.file_data").value(
                        org.hamcrest.Matchers.startsWith("data:application/pdf;base64,")))
                .andRespond(withSuccess(completion(content, "stop", null), MediaType.APPLICATION_JSON));

        AnalysisResult result = service.analyze(PDF, JOB);

        assertThat(result.matchScore()).isEqualTo(100); // clamped to 0-100
        assertThat(result.atsScore()).isEqualTo(0);
        assertThat(result.atsIssues()).containsExactly("No Skills section");
        assertThat(result.matchedSkills()).containsExactly("Java");
        assertThat(result.bulletRewrites().get(0).improved()).isEqualTo("b");
        server.verify();
    }

    @Test
    void refusalBecomesAFriendlyError() {
        server.expect(requestTo("https://api.openai.test/v1/chat/completions"))
                .andRespond(withSuccess(completion(null, "stop", "I can't help with that."), MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> service.analyze(PDF, JOB))
                .isInstanceOf(AnalysisException.class)
                .hasMessageContaining("declined");
    }

    @Test
    void truncatedReplyBecomesAFriendlyError() {
        server.expect(requestTo("https://api.openai.test/v1/chat/completions"))
                .andRespond(withSuccess(completion("{\"matchScore\":", "length", null), MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> service.analyze(PDF, JOB))
                .isInstanceOf(AnalysisException.class)
                .hasMessageContaining("cut off");
    }

    private static String completion(String content, String finishReason, String refusal) {
        ObjectMapper mapper = new ObjectMapper();
        var message = mapper.createObjectNode().put("role", "assistant");
        message.put("content", content);
        message.put("refusal", refusal);
        var choice = mapper.createObjectNode().put("finish_reason", finishReason);
        choice.set("message", message);
        var root = mapper.createObjectNode();
        root.putArray("choices").add(choice);
        return root.toString();
    }
}
