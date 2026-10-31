package com.sanjeev.resumeanalyzer.exception;

/** A failure whose message is safe to show to the user. */
public class AnalysisException extends RuntimeException {

    public AnalysisException(String message) {
        super(message);
    }
}
