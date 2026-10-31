package com.sanjeev.resumeanalyzer.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("update PasswordResetToken t set t.usedAt = :now where t.user.id = :userId and t.usedAt is null")
    void markAllUsedForUser(Long userId, Instant now);

    /** Invalidates older links when a new one is requested or the password changes. */
    default void invalidateAllForUser(Long userId) {
        markAllUsedForUser(userId, Instant.now());
    }
}
