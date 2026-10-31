package com.sanjeev.resumeanalyzer.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> badInput(IllegalArgumentException e) {
        return error(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> invalidBody(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .findFirst()
                .orElse("Invalid request.");
        return error(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<Map<String, String>> missingFile(MissingServletRequestPartException e) {
        return error(HttpStatus.BAD_REQUEST, "Please upload your resume.");
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> badLogin(BadCredentialsException e) {
        return error(HttpStatus.UNAUTHORIZED, e.getMessage());
    }

    @ExceptionHandler(InsufficientAuthenticationException.class)
    public ResponseEntity<Map<String, String>> notSignedIn(InsufficientAuthenticationException e) {
        return error(HttpStatus.UNAUTHORIZED, e.getMessage());
    }

    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<Map<String, String>> tooManyRequests(TooManyRequestsException e) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("Retry-After", String.valueOf(e.getRetryAfterSeconds()))
                .body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Map<String, String>> notFound(NotFoundException e) {
        return error(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> tooLarge(MaxUploadSizeExceededException e) {
        return error(HttpStatus.PAYLOAD_TOO_LARGE, "Resume file is too large (max 10 MB).");
    }

    @ExceptionHandler(AnalysisException.class)
    public ResponseEntity<Map<String, String>> analysisFailed(AnalysisException e) {
        return error(HttpStatus.UNPROCESSABLE_ENTITY, e.getMessage());
    }

    @ExceptionHandler(HttpClientErrorException.Unauthorized.class)
    public ResponseEntity<Map<String, String>> badApiKey(HttpClientErrorException.Unauthorized e) {
        log.error("OpenAI authentication failed - check OPENAI_API_KEY");
        return error(HttpStatus.SERVICE_UNAVAILABLE, "The AI service is not configured correctly.");
    }

    @ExceptionHandler(HttpClientErrorException.TooManyRequests.class)
    public ResponseEntity<Map<String, String>> rateLimited(HttpClientErrorException.TooManyRequests e) {
        if (e.getResponseBodyAsString().contains("insufficient_quota")) {
            log.error("OpenAI account has no credits left - add billing at https://platform.openai.com/settings/organization/billing");
            return error(HttpStatus.SERVICE_UNAVAILABLE,
                    "The AI service is temporarily unavailable (out of credits). Please try again later.");
        }
        log.warn("OpenAI rate limit exceeded: {}", e.getResponseBodyAsString());
        return error(HttpStatus.TOO_MANY_REQUESTS, "Too many requests right now. Please wait a minute and try again.");
    }

    @ExceptionHandler(RestClientResponseException.class)
    public ResponseEntity<Map<String, String>> aiError(RestClientResponseException e) {
        log.error("OpenAI API error (status {}): {}", e.getStatusCode().value(), e.getResponseBodyAsString());
        return error(HttpStatus.BAD_GATEWAY, "The AI service returned an error. Please try again.");
    }

    @ExceptionHandler(ResourceAccessException.class)
    public ResponseEntity<Map<String, String>> aiUnreachable(ResourceAccessException e) {
        log.error("Could not reach OpenAI", e);
        return error(HttpStatus.GATEWAY_TIMEOUT, "The AI service did not respond in time. Please try again.");
    }

    private static ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("error", message));
    }
}
