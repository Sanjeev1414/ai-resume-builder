package com.sanjeev.resumeanalyzer.analysis;

import com.sanjeev.resumeanalyzer.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

/** One saved resume analysis. The full AI result is stored as JSON. */
@Entity
@Table(name = "analyses", indexes = @Index(name = "idx_analyses_user", columnList = "user_id, createdAt"))
public class Analysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String resumeFileName;

    @JdbcTypeCode(SqlTypes.LONG32VARCHAR) // TEXT on PostgreSQL, LONGTEXT on MySQL
    @Column(nullable = false)
    private String jobDescription;

    @Column(nullable = false)
    private int matchScore;

    @JdbcTypeCode(SqlTypes.LONG32VARCHAR) // TEXT on PostgreSQL, LONGTEXT on MySQL
    @Column(nullable = false)
    private String resultJson;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected Analysis() {
    }

    public Analysis(User user, String resumeFileName, String jobDescription, int matchScore, String resultJson) {
        this.user = user;
        this.resumeFileName = resumeFileName;
        this.jobDescription = jobDescription;
        this.matchScore = matchScore;
        this.resultJson = resultJson;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getResumeFileName() { return resumeFileName; }
    public String getJobDescription() { return jobDescription; }
    public int getMatchScore() { return matchScore; }
    public String getResultJson() { return resultJson; }
    public Instant getCreatedAt() { return createdAt; }
}
