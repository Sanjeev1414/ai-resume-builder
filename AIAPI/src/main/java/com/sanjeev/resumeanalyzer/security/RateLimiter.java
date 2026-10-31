package com.sanjeev.resumeanalyzer.security;

import com.sanjeev.resumeanalyzer.exception.TooManyRequestsException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory sliding-window rate limiter. Protects sign-in from password guessing and the
 * analyze endpoint from using up the Gemini quota. For several server instances, swap this
 * for a shared store such as Redis.
 */
@Component
public class RateLimiter {

    private final Map<String, Deque<Instant>> hits = new ConcurrentHashMap<>();

    /** Records one attempt for the key, or throws if the key already used its limit in the window. */
    public void check(String key, int limit, Duration window, String message) {
        Instant now = Instant.now();
        Deque<Instant> times = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (times) {
            while (!times.isEmpty() && times.peekFirst().isBefore(now.minus(window))) {
                times.pollFirst();
            }
            if (times.size() >= limit) {
                long retryAfter = Duration.between(now, times.peekFirst().plus(window)).toSeconds() + 1;
                throw new TooManyRequestsException(message, retryAfter);
            }
            times.addLast(now);
        }
    }

    /** Drops keys with no recent attempts so memory doesn't grow forever. */
    @Scheduled(fixedRate = 10 * 60 * 1000)
    void cleanUp() {
        Instant cutoff = Instant.now().minus(Duration.ofHours(1));
        hits.entrySet().removeIf(entry -> {
            synchronized (entry.getValue()) {
                return entry.getValue().isEmpty() || entry.getValue().peekLast().isBefore(cutoff);
            }
        });
    }
}
