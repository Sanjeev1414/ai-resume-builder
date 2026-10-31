package com.sanjeev.resumeanalyzer.model;

import java.util.List;

/**
 * A resume rewritten by the AI to target one job. Field names match the Resume Builder form so the
 * frontend can open it there; bullets and lists are arrays here and joined into text on the frontend.
 */
public record TailoredResume(
        String fullName,
        String title,
        String email,
        String phone,
        String location,
        String linkedin,
        String website,
        String summary,
        List<String> skills,
        List<Experience> experience,
        List<Project> projects,
        List<Education> education,
        List<String> certifications) {

    public record Experience(String role, String company, String location, String start, String end, List<String> bullets) {
    }

    public record Project(String name, String tech, String link, List<String> bullets) {
    }

    public record Education(String degree, String school, String year, String score) {
    }
}
