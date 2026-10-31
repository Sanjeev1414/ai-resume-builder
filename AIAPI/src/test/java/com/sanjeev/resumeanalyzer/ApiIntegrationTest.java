package com.sanjeev.resumeanalyzer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanjeev.resumeanalyzer.email.EmailService;
import com.sanjeev.resumeanalyzer.model.AnalysisResult;
import com.sanjeev.resumeanalyzer.service.ResumeAnalyzerService;
import com.sanjeev.resumeanalyzer.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiIntegrationTest {

    private static final String JOB = "We are hiring a Java developer with Spring Boot, REST APIs, SQL and AWS experience.";
    private static final AtomicInteger ipCounter = new AtomicInteger(1);

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private UserRepository users;

    @MockBean private ResumeAnalyzerService analyzer;  // no real Gemini calls in tests
    @MockBean private JavaMailSender mailSender;        // no real emails in tests
    @SpyBean private EmailService emailService;         // lets tests read the reset link

    @BeforeEach
    void stubAnalyzer() {
        when(analyzer.analyze(any(), anyString())).thenReturn(new AnalysisResult(
                81, 74, "Good fit.", List.of("Java", "Spring Boot"), List.of("AWS"),
                List.of("Uses a two-column layout - switch to one column"),
                List.of(new AnalysisResult.BulletRewrite("Did APIs", "Built 10 REST APIs", "Adds impact")),
                List.of("Add an AWS project")));
        when(mailSender.createMimeMessage()).thenReturn(new jakarta.mail.internet.MimeMessage((jakarta.mail.Session) null));
    }

    // ---------- Auth ----------

    @Test
    void registerReturnsTokenAndStoresOnlyAPasswordHash() throws Exception {
        String email = uniqueEmail();
        mvc.perform(fromNewIp(post("/api/auth/register"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("name", "Asha", "email", email, "password", "secret123")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value(email));

        String storedHash = users.findByEmail(email).orElseThrow().getPasswordHash();
        assertThat(storedHash).isNotEqualTo("secret123").startsWith("$2a$");
    }

    @Test
    void duplicateEmailIsRejected() throws Exception {
        String email = uniqueEmail();
        register(email);
        mvc.perform(fromNewIp(post("/api/auth/register"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("name", "Asha", "email", email.toUpperCase(), "password", "secret123")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("An account with this email already exists. Please sign in."));
    }

    @Test
    void weakPasswordIsRejected() throws Exception {
        mvc.perform(fromNewIp(post("/api/auth/register"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("name", "Asha", "email", uniqueEmail(), "password", "123")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Password must be 8-72 characters"));
    }

    @Test
    void loginWorksWithRightPasswordOnly() throws Exception {
        String email = uniqueEmail();
        register(email);

        mvc.perform(fromNewIp(post("/api/auth/login"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("email", email, "password", "secret123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());

        mvc.perform(fromNewIp(post("/api/auth/login"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("email", email, "password", "wrong-password")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Incorrect email or password."));
    }

    @Test
    void repeatedFailedLoginsAreRateLimited() throws Exception {
        String email = uniqueEmail();
        register(email);
        for (int i = 0; i < 8; i++) {
            mvc.perform(fromNewIp(post("/api/auth/login"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body("email", email, "password", "wrong-password")))
                    .andExpect(status().isUnauthorized());
        }
        mvc.perform(fromNewIp(post("/api/auth/login"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("email", email, "password", "secret123")))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));
    }

    @Test
    void protectedEndpointsNeedAValidToken() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/analyses")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/analyses").header("Authorization", "Bearer not.a.real-token"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/health")).andExpect(status().isOk());
    }

    // ---------- Passwords ----------

    @Test
    void changePasswordSignsOutOldSessionsAndKeepsThisOne() throws Exception {
        String email = uniqueEmail();
        String oldToken = register(email);
        Thread.sleep(1100); // tokens are second-precision; make the change clearly later

        String newToken = readJson(mvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + oldToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("currentPassword", "secret123", "newPassword", "newSecret456")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()).get("token").asText();

        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + oldToken))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + newToken))
                .andExpect(status().isOk());
        mvc.perform(fromNewIp(post("/api/auth/login")).contentType(MediaType.APPLICATION_JSON)
                        .content(body("email", email, "password", "newSecret456")))
                .andExpect(status().isOk());
    }

    @Test
    void changePasswordNeedsTheCurrentPassword() throws Exception {
        String token = register(uniqueEmail());
        mvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("currentPassword", "wrong-one", "newPassword", "newSecret456")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Current password is incorrect."));
    }

    @Test
    void forgotAndResetPasswordFlow() throws Exception {
        String email = uniqueEmail();
        register(email);

        mvc.perform(fromNewIp(post("/api/auth/forgot-password")).contentType(MediaType.APPLICATION_JSON)
                        .content(body("email", email)))
                .andExpect(status().isOk());

        ArgumentCaptor<String> link = ArgumentCaptor.forClass(String.class);
        verify(emailService, timeout(2000)).sendPasswordReset(eq(email), anyString(), link.capture(), any());
        assertThat(link.getValue()).startsWith("http://localhost:5173/reset-password?token=");
        String resetToken = link.getValue().substring(link.getValue().indexOf("token=") + 6);

        mvc.perform(fromNewIp(post("/api/auth/reset-password")).contentType(MediaType.APPLICATION_JSON)
                        .content(body("token", resetToken, "newPassword", "brandNew789")))
                .andExpect(status().isOk());

        // The link works only once
        mvc.perform(fromNewIp(post("/api/auth/reset-password")).contentType(MediaType.APPLICATION_JSON)
                        .content(body("token", resetToken, "newPassword", "another123")))
                .andExpect(status().isBadRequest());

        mvc.perform(fromNewIp(post("/api/auth/login")).contentType(MediaType.APPLICATION_JSON)
                        .content(body("email", email, "password", "brandNew789")))
                .andExpect(status().isOk());
    }

    @Test
    void forgotPasswordDoesNotRevealWhetherAnEmailExists() throws Exception {
        mvc.perform(fromNewIp(post("/api/auth/forgot-password")).contentType(MediaType.APPLICATION_JSON)
                        .content(body("email", uniqueEmail())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If an account exists for that email, a reset link is on its way."));
    }

    // ---------- Analysis ----------

    @Test
    void analysisIsSavedAndListedForItsOwnerOnly() throws Exception {
        String token = register(uniqueEmail());

        JsonNode saved = readJson(mvc.perform(multipart("/api/analyze")
                        .file(pdf())
                        .param("jobDescription", JOB)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.matchScore").value(81))
                .andExpect(jsonPath("$.result.atsScore").value(74))
                .andExpect(jsonPath("$.resumeFileName").value("resume.pdf"))
                .andExpect(jsonPath("$.emailSent").value(true))
                .andReturn().getResponse().getContentAsString());
        long id = saved.get("id").asLong();

        mvc.perform(get("/api/analyses").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].matchScore").value(81));

        mvc.perform(get("/api/analyses/" + id).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.missingSkills[0]").value("AWS"));

        String otherToken = register(uniqueEmail());
        mvc.perform(get("/api/analyses/" + id).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void nonPdfUploadIsRejected() throws Exception {
        String token = register(uniqueEmail());
        MockMultipartFile notPdf = new MockMultipartFile("resume", "resume.pdf", "application/pdf",
                "just text".getBytes(StandardCharsets.UTF_8));
        mvc.perform(multipart("/api/analyze").file(notPdf).param("jobDescription", JOB)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Resume must be a PDF file."));
    }

    @Test
    void shortJobDescriptionIsRejected() throws Exception {
        String token = register(uniqueEmail());
        mvc.perform(multipart("/api/analyze").file(pdf()).param("jobDescription", "too short")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    // ---------- Helpers ----------

    /** Each call looks like a different client, so the per-IP sign-up limit doesn't affect other tests. */
    private static MockHttpServletRequestBuilder fromNewIp(MockHttpServletRequestBuilder builder) {
        int n = ipCounter.getAndIncrement();
        return builder.with(request -> {
            request.setRemoteAddr("10.0." + (n / 250) + "." + (n % 250 + 1));
            return request;
        });
    }

    private String register(String email) throws Exception {
        String response = mvc.perform(fromNewIp(post("/api/auth/register"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("name", "Test User", "email", email, "password", "secret123")))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return readJson(response).get("token").asText();
    }

    private static MockMultipartFile pdf() {
        return new MockMultipartFile("resume", "resume.pdf", "application/pdf",
                "%PDF-1.4 test resume".getBytes(StandardCharsets.UTF_8));
    }

    private static String uniqueEmail() {
        return "user-" + UUID.randomUUID() + "@example.com";
    }

    private String body(String... keyValues) throws Exception {
        var map = new java.util.LinkedHashMap<String, String>();
        for (int i = 0; i < keyValues.length; i += 2) map.put(keyValues[i], keyValues[i + 1]);
        return json.writeValueAsString(map);
    }

    private JsonNode readJson(String text) throws Exception {
        return json.readTree(text);
    }
}
