package com.sanjeev.resumeanalyzer.analysis;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

/**
 * The resume PDF behind an analysis, plus the AI-tailored resume generated from it. Kept out of
 * {@link Analysis} so loading the history list never pulls PDF bytes from the database.
 */
@Entity
@Table(name = "analysis_resumes")
public class AnalysisResume {

    /** Same value as the analysis id (database/schema.sql adds the foreign key). */
    @Id
    @Column(name = "analysis_id")
    private Long analysisId;

    @JdbcTypeCode(SqlTypes.LONG32VARBINARY) // BYTEA on PostgreSQL, LONGBLOB on MySQL
    @Column(nullable = false)
    private byte[] pdf;

    @JdbcTypeCode(SqlTypes.LONG32VARCHAR)
    private String tailoredJson;

    private Instant tailoredAt;

    protected AnalysisResume() {
    }

    public AnalysisResume(Long analysisId, byte[] pdf) {
        this.analysisId = analysisId;
        this.pdf = pdf;
    }

    public void replacePdf(byte[] pdf) {
        this.pdf = pdf;
    }

    public void setTailored(String json) {
        this.tailoredJson = json;
        this.tailoredAt = Instant.now();
    }

    public byte[] getPdf() { return pdf; }
    public String getTailoredJson() { return tailoredJson; }
    public Instant getTailoredAt() { return tailoredAt; }
}
