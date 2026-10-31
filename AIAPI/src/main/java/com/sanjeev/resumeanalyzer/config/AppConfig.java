package com.sanjeev.resumeanalyzer.config;

import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
@EnableAsync
@EnableScheduling
public class AppConfig {

    /** HTTP client for the Google Gemini API. The key comes from GEMINI_API_KEY - never hardcode it. */
    @Bean
    public RestClient geminiRestClient(@Value("${gemini.base-url}") String baseUrl,
                                       @Value("${gemini.api-key}") String apiKey) {
        if (apiKey == null || apiKey.isBlank()) {
            LoggerFactory.getLogger(AppConfig.class).warn(
                    "GEMINI_API_KEY is not set - AI features will fail. Add it to AIAPI/.env and restart.");
        }
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        // Reading a resume and writing the analysis can take a while
        requestFactory.setReadTimeout(Duration.ofSeconds(180));

        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .defaultHeader("x-goog-api-key", apiKey)
                .build();
    }
}
