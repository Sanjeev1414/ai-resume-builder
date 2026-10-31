package com.sanjeev.resumeanalyzer.user;

import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/** Looks up the signed-in user from the validated JWT (its subject is the user id). */
@Component
public class CurrentUser {

    private final UserRepository users;

    public CurrentUser(UserRepository users) {
        this.users = users;
    }

    public User from(Jwt jwt) {
        return users.findById(Long.valueOf(jwt.getSubject()))
                .orElseThrow(() -> new InsufficientAuthenticationException("Account no longer exists. Please sign in again."));
    }
}
