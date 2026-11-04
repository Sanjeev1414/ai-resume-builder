package com.sanjeev.resumeanalyzer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanjeev.resumeanalyzer.compiler.CompilerClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.web.client.ResourceAccessException;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Online compiler endpoint. The call to Wandbox is mocked. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CompilerIntegrationTest {

    private static final AtomicInteger ipCounter = new AtomicInteger(1);

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;

    @MockBean private CompilerClient compiler;
    @MockBean private JavaMailSender mailSender;

    @Test
    void runReturnsTheProgramOutput() throws Exception {
        when(compiler.run(eq("python"), any(), any()))
                .thenReturn(new CompilerClient.RunResult("0", "", "", "hello\n", ""));

        run(register(), Map.of("language", "python", "code", "print('hello')"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stdout").value("hello\n"));
    }

    @Test
    void runRequiresSignIn() throws Exception {
        mvc.perform(post("/api/compiler/run").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("language", "python", "code", "print(1)"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void emptyCodeIsRejected() throws Exception {
        run(register(), Map.of("language", "python", "code", "  "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Please write some code first."));
    }

    @Test
    void compilerOutageGivesAFriendlyMessage() throws Exception {
        when(compiler.run(eq("java"), any(), any())).thenThrow(new ResourceAccessException("timed out"));

        run(register(), Map.of("language", "java", "code", "class Main {}"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("The online compiler is not responding. Please try again in a moment."));
    }

    private ResultActions run(String token, Map<String, String> body) throws Exception {
        return mvc.perform(post("/api/compiler/run").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body)));
    }

    private String register() throws Exception {
        String ip = "10.77.0." + ipCounter.getAndIncrement();
        return json.readTree(mvc.perform(post("/api/auth/register").with(r -> { r.setRemoteAddr(ip); return r; })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("name", "Compiler User",
                                "email", UUID.randomUUID() + "@example.com", "password", "password123"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).get("token").asText();
    }
}
