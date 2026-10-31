package com.sanjeev.resumeanalyzer.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request and response bodies for /api/auth. */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank(message = "Name is required")
            @Size(max = 100, message = "Name is too long")
            String name,

            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            @Size(max = 254)
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 72, message = "Password must be 8-72 characters")
            String password
    ) {
    }

    public record LoginRequest(
            @NotBlank(message = "Email is required") String email,
            @NotBlank(message = "Password is required") String password
    ) {
    }

    public record ChangePasswordRequest(
            @NotBlank(message = "Current password is required") String currentPassword,

            @NotBlank(message = "New password is required")
            @Size(min = 8, max = 72, message = "New password must be 8-72 characters")
            String newPassword
    ) {
    }

    public record ForgotPasswordRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            String email
    ) {
    }

    public record ResetPasswordRequest(
            @NotBlank(message = "Reset link is invalid") String token,

            @NotBlank(message = "New password is required")
            @Size(min = 8, max = 72, message = "New password must be 8-72 characters")
            String newPassword
    ) {
    }

    public record UserResponse(Long id, String name, String email) {
    }

    public record AuthResponse(String token, UserResponse user) {
    }

    public record MessageResponse(String message) {
    }
}
