package com.sanjeev.resumeanalyzer.coverletter;

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

@Entity
@Table(name = "cover_letters")
public class CoverLetter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 120)
    private String companyName;

    @Column(length = 120)
    private String jobTitle;

    @Column(nullable = false, length = 20)
    private String tone;

    @Column(nullable = false)
    private String subject;

    @JdbcTypeCode(SqlTypes.LONG32VARCHAR) // TEXT on PostgreSQL, LONGTEXT on MySQL
    @Column(nullable = false)
    private String content;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected CoverLetter() {
    }

    public CoverLetter(User user, String companyName, String jobTitle, String tone, String subject, String content) {
        this.user = user;
        this.companyName = companyName;
        this.jobTitle = jobTitle;
        this.tone = tone;
        this.subject = subject;
        this.content = content;
    }

    public void updateContent(String subject, String content) {
        this.subject = subject;
        this.content = content;
    }

    public Long getId() { return id; }
    public String getCompanyName() { return companyName; }
    public String getJobTitle() { return jobTitle; }
    public String getTone() { return tone; }
    public String getSubject() { return subject; }
    public String getContent() { return content; }
    public Instant getCreatedAt() { return createdAt; }
}
