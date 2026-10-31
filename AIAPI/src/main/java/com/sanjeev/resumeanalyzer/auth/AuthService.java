package com.sanjeev.resumeanalyzer.auth;

import com.sanjeev.resumeanalyzer.auth.AuthDtos.AuthResponse;
import com.sanjeev.resumeanalyzer.auth.AuthDtos.LoginRequest;
import com.sanjeev.resumeanalyzer.auth.AuthDtos.RegisterRequest;
import com.sanjeev.resumeanalyzer.auth.AuthDtos.UserResponse;
import com.sanjeev.resumeanalyzer.email.EmailService;
import com.sanjeev.resumeanalyzer.user.User;
import com.sanjeev.resumeanalyzer.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final Duration RESET_LINK_LIFETIME = Duration.ofMinutes(30);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository users;
    private final PasswordResetTokenRepository resetTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final EmailService emailService;
    private final Duration tokenLifetime;
    private final String frontendUrl;

    public AuthService(UserRepository users, PasswordResetTokenRepository resetTokens,
                       PasswordEncoder passwordEncoder, JwtEncoder jwtEncoder, EmailService emailService,
                       @Value("${app.jwt.expiry-hours}") long expiryHours,
                       @Value("${app.frontend-url}") String frontendUrl) {
        this.users = users;
        this.resetTokens = resetTokens;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.emailService = emailService;
        this.tokenLifetime = Duration.ofHours(expiryHours);
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalize(request.email());
        if (users.existsByEmail(email)) {
            throw new IllegalArgumentException("An account with this email already exists. Please sign in.");
        }
        User user = users.save(new User(request.name().strip(), email, passwordEncoder.encode(request.password())));
        return new AuthResponse(issueToken(user), toResponse(user));
    }

    public AuthResponse login(LoginRequest request) {
        User user = users.findByEmail(normalize(request.email()))
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                // Same message for unknown email and wrong password, so accounts can't be probed
                .orElseThrow(() -> new BadCredentialsException("Incorrect email or password."));
        return new AuthResponse(issueToken(user), toResponse(user));
    }

    /** Changes the password of a signed-in user. Other sessions are signed out; this one gets a fresh token. */
    @Transactional
    public AuthResponse changePassword(User user, String currentPassword, String newPassword) {
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("New password must be different from the current one.");
        }
        user.changePassword(passwordEncoder.encode(newPassword));
        users.save(user);
        resetTokens.invalidateAllForUser(user.getId());
        return new AuthResponse(issueToken(user), toResponse(user));
    }

    /**
     * Emails a one-time reset link if the account exists. Callers always get the same response,
     * so this can't be used to find out which emails are registered.
     */
    @Transactional
    public void requestPasswordReset(String email) {
        users.findByEmail(normalize(email)).ifPresent(user -> {
            resetTokens.invalidateAllForUser(user.getId());

            byte[] raw = new byte[32];
            RANDOM.nextBytes(raw);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
            resetTokens.save(new PasswordResetToken(user, sha256(token), Instant.now().plus(RESET_LINK_LIFETIME)));

            String link = frontendUrl + "/reset-password?token=" + token;
            if (emailService.isEnabled()) {
                emailService.sendPasswordReset(user.getEmail(), user.getName(), link, RESET_LINK_LIFETIME);
            } else {
                // Development only: email is off, so print the link to use it manually
                log.warn("Email is not configured. Password reset link for user {}: {}", user.getId(), link);
            }
        });
    }

    /** Sets a new password using a reset link. The link works once and expires after 30 minutes. */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = resetTokens.findByTokenHash(sha256(token))
                .filter(PasswordResetToken::isUsable)
                .orElseThrow(() -> new IllegalArgumentException(
                        "This reset link is invalid or has expired. Please request a new one."));

        User user = resetToken.getUser();
        user.changePassword(passwordEncoder.encode(newPassword));
        users.save(user);
        resetToken.markUsed();
        resetTokens.invalidateAllForUser(user.getId());
    }

    public static UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail());
    }

    private String issueToken(User user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("resume-analyzer")
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .issuedAt(now)
                .expiresAt(now.plus(tokenLifetime))
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    private static String normalize(String email) {
        return email.strip().toLowerCase(Locale.ROOT);
    }

    private static String sha256(String value) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
