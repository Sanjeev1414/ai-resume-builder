package com.sanjeev.resumeanalyzer.auth;

import com.sanjeev.resumeanalyzer.auth.AuthDtos.AuthResponse;
import com.sanjeev.resumeanalyzer.auth.AuthDtos.ChangePasswordRequest;
import com.sanjeev.resumeanalyzer.auth.AuthDtos.ForgotPasswordRequest;
import com.sanjeev.resumeanalyzer.auth.AuthDtos.LoginRequest;
import com.sanjeev.resumeanalyzer.auth.AuthDtos.MessageResponse;
import com.sanjeev.resumeanalyzer.auth.AuthDtos.RegisterRequest;
import com.sanjeev.resumeanalyzer.auth.AuthDtos.ResetPasswordRequest;
import com.sanjeev.resumeanalyzer.auth.AuthDtos.UserResponse;
import com.sanjeev.resumeanalyzer.security.RateLimiter;
import com.sanjeev.resumeanalyzer.user.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Locale;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String TOO_MANY_ATTEMPTS = "Too many attempts. Please wait a few minutes and try again.";

    private final AuthService authService;
    private final CurrentUser currentUser;
    private final RateLimiter rateLimiter;

    public AuthController(AuthService authService, CurrentUser currentUser, RateLimiter rateLimiter) {
        this.authService = authService;
        this.currentUser = currentUser;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request, HttpServletRequest http) {
        rateLimiter.check("register:" + http.getRemoteAddr(), 5, Duration.ofHours(1), TOO_MANY_ATTEMPTS);
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        // Limit by IP (one attacker, many accounts) and by email (many IPs, one account)
        rateLimiter.check("login-ip:" + http.getRemoteAddr(), 20, Duration.ofMinutes(15), TOO_MANY_ATTEMPTS);
        rateLimiter.check("login-email:" + normalize(request.email()), 8, Duration.ofMinutes(15), TOO_MANY_ATTEMPTS);
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return AuthService.toResponse(currentUser.from(jwt));
    }

    @PostMapping("/change-password")
    public AuthResponse changePassword(@AuthenticationPrincipal Jwt jwt,
                                       @Valid @RequestBody ChangePasswordRequest request) {
        rateLimiter.check("change-password:" + jwt.getSubject(), 5, Duration.ofMinutes(15), TOO_MANY_ATTEMPTS);
        return authService.changePassword(currentUser.from(jwt), request.currentPassword(), request.newPassword());
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request, HttpServletRequest http) {
        rateLimiter.check("forgot-ip:" + http.getRemoteAddr(), 10, Duration.ofHours(1), TOO_MANY_ATTEMPTS);
        rateLimiter.check("forgot-email:" + normalize(request.email()), 3, Duration.ofHours(1), TOO_MANY_ATTEMPTS);
        authService.requestPasswordReset(request.email());
        return new MessageResponse("If an account exists for that email, a reset link is on its way.");
    }

    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request, HttpServletRequest http) {
        rateLimiter.check("reset-ip:" + http.getRemoteAddr(), 10, Duration.ofMinutes(15), TOO_MANY_ATTEMPTS);
        authService.resetPassword(request.token(), request.newPassword());
        return new MessageResponse("Your password has been reset. You can now sign in.");
    }

    private static String normalize(String email) {
        return email.strip().toLowerCase(Locale.ROOT);
    }
}
