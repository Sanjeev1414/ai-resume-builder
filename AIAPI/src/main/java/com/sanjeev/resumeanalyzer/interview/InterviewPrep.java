package com.sanjeev.resumeanalyzer.interview;

import com.sanjeev.resumeanalyzer.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

/** A saved set of AI interview questions for one job. The questions are stored as JSON. */
@Entity
@Table(name = "interview_preps")
public class InterviewPrep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 120)
    private String jobTitle;

    @Column(length = 120)
    private String companyName;

    @JdbcTypeCode(SqlTypes.LONG32VARCHAR) // TEXT on PostgreSQL, LONGTEXT on MySQL
    @Column(nullable = false)
    private String resultJson;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected InterviewPrep() {
    }

    public InterviewPrep(User user, String jobTitle, String companyName, String resultJson) {
        this.user = user;
        this.jobTitle = jobTitle;
        this.companyName = companyName;
        this.resultJson = resultJson;
    }

    public Long getId() { return id; }
    public String getJobTitle() { return jobTitle; }
    public String getCompanyName() { return companyName; }
    public String getResultJson() { return resultJson; }
    public Instant getCreatedAt() { return createdAt; }
}
