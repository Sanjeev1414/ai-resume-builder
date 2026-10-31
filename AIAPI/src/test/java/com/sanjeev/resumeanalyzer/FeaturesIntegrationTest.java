package com.sanjeev.resumeanalyzer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanjeev.resumeanalyzer.ai.GeminiClient;
import com.sanjeev.resumeanalyzer.coverletter.CoverLetterController.AiLetter;
import com.sanjeev.resumeanalyzer.interview.InterviewPrepController.PrepResult;
import com.sanjeev.resumeanalyzer.interview.InterviewPrepController.Question;
import com.sanjeev.resumeanalyzer.model.AnalysisResult;
import com.sanjeev.resumeanalyzer.model.TailoredResume;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Cover letters, interview prep, tailored resumes, job tracker and resume builder. Gemini is mocked. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FeaturesIntegrationTest {

    private static final String JOB = "We are hiring a Java developer with Spring Boot, REST APIs, SQL and AWS experience.";
    private static final AtomicInteger ipCounter = new AtomicInteger(100);

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;

    @MockBean private GeminiClient gemini;
    @MockBean private JavaMailSender mailSender;

    @Test
    void coverLetterIsGeneratedSavedEditedAndDeleted() throws Exception {
        when(gemini.structured(anyString(), any(), anyString(), eq("cover_letter"), any(), eq(AiLetter.class)))
                .thenReturn(new AiLetter("Application for Java Developer", "Dear Hiring Manager,\n\nI am excited..."));
        String token = register();

        String id = json.readTree(mvc.perform(multipart("/api/cover-letters").file(pdf())
                        .param("jobDescription", JOB).param("companyName", "Acme").param("tone", "enthusiastic")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.subject").value("Application for Java Developer"))
                .andExpect(jsonPath("$.companyName").value("Acme"))
                .andReturn().getResponse().getContentAsString()).get("id").asText();

        mvc.perform(put("/api/cover-letters/" + id).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("subject", "Edited", "content", "New text"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("New text"));

        mvc.perform(get("/api/cover-letters").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.length()").value(1));

        String other = register();
        mvc.perform(get("/api/cover-letters/" + id).header("Authorization", "Bearer " + other))
                .andExpect(status().isNotFound());

        mvc.perform(delete("/api/cover-letters/" + id).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    @Test
    void coverLetterRejectsUnknownTone() throws Exception {
        mvc.perform(multipart("/api/cover-letters").file(pdf()).param("jobDescription", JOB).param("tone", "rude")
                        .header("Authorization", "Bearer " + register()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void interviewPrepWorksWithoutAResume() throws Exception {
        when(gemini.structured(anyString(), any(), anyString(), eq("interview_prep"), any(), eq(PrepResult.class)))
                .thenReturn(new PrepResult(List.of("Spring Boot"), List.of(
                        new Question("Technical", "What is dependency injection?", "Checks basics",
                                List.of("Define it", "Give an example"), "Dependency injection is..."))));
        String token = register();

        mvc.perform(multipart("/api/interview-prep").param("jobDescription", JOB).param("jobTitle", "SDE")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.result.questions[0].category").value("Technical"));

        mvc.perform(get("/api/interview-prep").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$[0].questionCount").value(1))
                .andExpect(jsonPath("$[0].jobTitle").value("SDE"));
    }

    @Test
    void jobTrackerCrud() throws Exception {
        String token = register();
        String body = json.writeValueAsString(Map.of("company", "Google", "role", "SDE", "status", "APPLIED",
                "appliedOn", "2026-10-01", "jobUrl", "https://careers.google.com/x"));

        String id = json.readTree(mvc.perform(post("/api/applications").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).get("id").asText();

        mvc.perform(put("/api/applications/" + id).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("company", "Google", "role", "SDE", "status", "INTERVIEW"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INTERVIEW"));

        mvc.perform(post("/api/applications").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("company", "X", "role", "Y", "status", "APPLIED",
                                "jobUrl", "javascript:alert(1)"))))
                .andExpect(status().isBadRequest());

        mvc.perform(delete("/api/applications/" + id).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/applications").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void resumeBuilderSavesAndLoads() throws Exception {
        String token = register();
        mvc.perform(get("/api/resume-builder").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").doesNotExist());

        mvc.perform(put("/api/resume-builder").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"data\":{\"fullName\":\"Asha Rao\",\"skills\":\"Java, Spring Boot\"}}"))
                .andExpect(status().isOk());

        mvc.perform(get("/api/resume-builder").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.data.fullName").value("Asha Rao"));
    }

    @Test
    void browserRequestsFromTheFrontendAllowEveryMethodWeUse() throws Exception {
        String token = register();
        for (String method : List.of("GET", "POST", "PUT", "DELETE")) {
            mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                            .options("/api/resume-builder")
                            .header("Origin", "http://localhost:5173")
                            .header("Access-Control-Request-Method", method)
                            .header("Access-Control-Request-Headers", "authorization,content-type"))
                    .andExpect(status().isOk());
        }
        // A real cross-origin PUT, as the browser sends it
        mvc.perform(put("/api/resume-builder").header("Origin", "http://localhost:5173")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"data\":{\"fullName\":\"A\"}}"))
                .andExpect(status().isOk());
    }

    @Test
    void tailoredResumeIsGeneratedFromTheAnalysedPdfSavedAndEmailed() throws Exception {
        when(gemini.structured(anyString(), any(), anyString(), eq("resume_analysis"), any(), eq(AnalysisResult.class)))
                .thenReturn(new AnalysisResult(72, 80, "Good fit", List.of("Java"), List.of("AWS"), List.of(),
                        List.of(), List.of("Add AWS projects")));
        when(gemini.structured(anyString(), any(), anyString(), eq("tailored_resume"), any(), eq(TailoredResume.class)))
                .thenReturn(new TailoredResume("Asha Rao", "Java Developer", "asha@example.com", "", "Bengaluru", "", "",
                        "Java developer with Spring Boot experience.", List.of("Java", "Spring Boot"),
                        List.of(new TailoredResume.Experience("Developer", "Acme", "", "Jan 2024", "Present",
                                List.of("Built REST APIs in Spring Boot"))),
                        List.of(), List.of(new TailoredResume.Education("B.E. CSE", "VTU", "2020 - 2024", "")), List.of()));
        String token = register();

        String id = json.readTree(mvc.perform(multipart("/api/analyze").file(pdf()).param("jobDescription", JOB)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()).get("id").asText();
        String url = "/api/analyses/" + id + "/tailored-resume";

        // The analysed PDF was kept, so no re-upload is needed
        mvc.perform(get(url).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resume").doesNotExist())
                .andExpect(jsonPath("$.hasSourceResume").value(true));

        mvc.perform(multipart(url).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resume.fullName").value("Asha Rao"))
                .andExpect(jsonPath("$.resume.experience[0].bullets[0]").value("Built REST APIs in Spring Boot"));

        mvc.perform(get(url).header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.resume.title").value("Java Developer"))
                .andExpect(jsonPath("$.generatedAt").exists());

        mvc.perform(post(url + "/email").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"template\":\"modern\"}"))
                .andExpect(status().isAccepted());
        mvc.perform(post(url + "/email").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"template\":\"fancy\"}"))
                .andExpect(status().isBadRequest());

        String other = register();
        mvc.perform(get(url).header("Authorization", "Bearer " + other)).andExpect(status().isNotFound());
        mvc.perform(multipart(url).header("Authorization", "Bearer " + other)).andExpect(status().isNotFound());
    }

    private String register() throws Exception {
        int n = ipCounter.getAndIncrement();
        String response = mvc.perform(post("/api/auth/register")
                        .with(r -> { r.setRemoteAddr("10.9." + (n / 250) + "." + (n % 250 + 1)); return r; })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("name", "Test User",
                                "email", "u-" + UUID.randomUUID() + "@example.com", "password", "secret123"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(response).get("token").asText();
    }

    private static MockMultipartFile pdf() {
        return new MockMultipartFile("resume", "resume.pdf", "application/pdf",
                "%PDF-1.4 test resume".getBytes(StandardCharsets.UTF_8));
    }
}
