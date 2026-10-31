package com.sanjeev.resumeanalyzer.ai;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;

/** Shared checks for resume uploads and job descriptions. Messages are shown to the user. */
public final class Uploads {

    public static final int MIN_JOB_DESCRIPTION_LENGTH = 50;
    public static final int MAX_JOB_DESCRIPTION_LENGTH = 20_000;

    private Uploads() {
    }

    /** Returns the PDF bytes, checking the "%PDF" signature rather than trusting the file name. */
    public static byte[] requirePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please upload your resume.");
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        if (bytes.length <= 4 || bytes[0] != '%' || bytes[1] != 'P' || bytes[2] != 'D' || bytes[3] != 'F') {
            throw new IllegalArgumentException("Resume must be a PDF file.");
        }
        return bytes;
    }

    /** Like {@link #requirePdf} but returns null when no file was sent. */
    public static byte[] optionalPdf(MultipartFile file) {
        return file == null || file.isEmpty() ? null : requirePdf(file);
    }

    public static String requireJobDescription(String jobDescription) {
        String jd = jobDescription == null ? "" : jobDescription.strip();
        if (jd.length() < MIN_JOB_DESCRIPTION_LENGTH) {
            throw new IllegalArgumentException("Please paste the full job description (at least "
                    + MIN_JOB_DESCRIPTION_LENGTH + " characters).");
        }
        if (jd.length() > MAX_JOB_DESCRIPTION_LENGTH) {
            throw new IllegalArgumentException("Job description is too long (max "
                    + MAX_JOB_DESCRIPTION_LENGTH + " characters).");
        }
        return jd;
    }

    /** Trims optional short text fields and caps their length. */
    public static String optionalText(String value, int maxLength) {
        if (value == null || value.isBlank()) return null;
        String trimmed = value.strip();
        return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
    }

    public static String safeFileName(String name) {
        if (name == null || name.isBlank()) return "resume.pdf";
        String base = name.replaceAll("^.*[\\\\/]", "");
        return base.length() > 200 ? base.substring(0, 200) : base;
    }
}
