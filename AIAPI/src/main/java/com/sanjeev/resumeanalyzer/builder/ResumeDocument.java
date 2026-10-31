package com.sanjeev.resumeanalyzer.builder;

import com.sanjeev.resumeanalyzer.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

/** The user's resume from the Resume Builder, stored as the form's JSON (one per user). */
@Entity
@Table(name = "resume_documents")
public class ResumeDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @JdbcTypeCode(SqlTypes.LONG32VARCHAR) // TEXT on PostgreSQL, LONGTEXT on MySQL
    @Column(nullable = false)
    private String dataJson;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    protected ResumeDocument() {
    }

    public ResumeDocument(User user) {
        this.user = user;
    }

    public void update(String dataJson) {
        this.dataJson = dataJson;
        this.updatedAt = Instant.now();
    }

    public String getDataJson() { return dataJson; }
    public Instant getUpdatedAt() { return updatedAt; }
}
