package com.sanjeev.resumeanalyzer.config;

import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
@EnableAsync
@EnableScheduling
public class AppConfig {

    /** HTTP client for the OpenAI API. The key comes from OPENAI_API_KEY - never hardcode it. */
    @Bean
    public RestClient openAiRestClient(@Value("${openai.base-url}") String baseUrl,
                                       @Value("${openai.api-key}") String apiKey) {
        if (apiKey == null || apiKey.isBlank()) {
            LoggerFactory.getLogger(AppConfig.class).warn(
                    "OPENAI_API_KEY is not set - resume analysis will fail. Add it to AIAPI/.env and restart.");
        }
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        // Reading a resume and writing the analysis can take a while
        requestFactory.setReadTimeout(Duration.ofSeconds(180));

        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .build();
    }
}
