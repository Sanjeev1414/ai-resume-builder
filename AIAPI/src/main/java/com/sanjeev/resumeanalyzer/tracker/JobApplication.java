package com.sanjeev.resumeanalyzer.tracker;

import com.sanjeev.resumeanalyzer.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;

/** One job the user is tracking, from wishlist to offer. */
@Entity
@Table(name = "job_applications")
public class JobApplication {

    public enum Status { WISHLIST, APPLIED, INTERVIEW, OFFER, REJECTED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 120)
    private String company;

    @Column(nullable = false, length = 120)
    private String role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    @Column(length = 120)
    private String location;

    @Column(length = 500)
    private String jobUrl;

    private LocalDate appliedOn;

    @JdbcTypeCode(SqlTypes.LONG32VARCHAR)
    private String notes;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    protected JobApplication() {
    }

    public JobApplication(User user) {
        this.user = user;
    }

    public void update(String company, String role, Status status, String location, String jobUrl,
                       LocalDate appliedOn, String notes) {
        this.company = company;
        this.role = role;
        this.status = status;
        this.location = location;
        this.jobUrl = jobUrl;
        this.appliedOn = appliedOn;
        this.notes = notes;
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getCompany() { return company; }
    public String getRole() { return role; }
    public Status getStatus() { return status; }
    public String getLocation() { return location; }
    public String getJobUrl() { return jobUrl; }
    public LocalDate getAppliedOn() { return appliedOn; }
    public String getNotes() { return notes; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
