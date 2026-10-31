package com.sanjeev.resumeanalyzer.email;

import com.sanjeev.resumeanalyzer.model.AnalysisResult;
import com.sanjeev.resumeanalyzer.model.TailoredResume;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;

/** Emails the analysis report to the user. Runs in the background so the API responds immediately. */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String from;

    public EmailService(JavaMailSender mailSender, @Value("${app.mail.from}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    /** Email is off until MAIL_USERNAME / MAIL_PASSWORD are configured. */
    public boolean isEnabled() {
        return from != null && !from.isBlank();
    }

    @Async
    public void sendAnalysisReport(String to, String name, AnalysisResult result) {
        // Email is a bonus - the analysis is already saved, so failures are only logged
        send(to, "Your resume match score: " + result.matchScore() + "/100", buildHtml(name, result));
    }

    @Async
    public void sendTailoredResume(String to, String name, AnalysisResult result, TailoredResume resume,
                                   String template, String reportLink) {
        String html = "<div style=\"font-family:Arial,sans-serif;max-width:720px;color:#1c2333\">"
                + "<p>Hi " + esc(name) + ", here is your resume tailored for this job.</p>"
                + "<p><b>Match score:</b> " + result.matchScore() + " / 100"
                + (result.atsScore() != null ? " &nbsp;·&nbsp; <b>ATS score:</b> " + result.atsScore() + " / 100" : "")
                + "</p><p><a href=\"" + esc(reportLink) + "\">Open the full report</a> to download it as a PDF.</p>"
                + "<div style=\"border:1px solid #d8dee9;border-radius:6px;padding:28px 32px;margin-top:16px\">"
                + ResumeHtml.render(resume, template) + "</div>"
                + "<p style=\"color:#5d6779;font-size:13px\">Sent by ResumeAI</p></div>";
        String who = resume.fullName() == null || resume.fullName().isBlank() ? "Your" : resume.fullName() + "'s";
        send(to, who + " tailored resume (" + result.matchScore() + "/100 match)", html);
    }

    @Async
    public void sendPasswordReset(String to, String name, String link, Duration validFor) {
        String html = "<div style=\"font-family:Arial,sans-serif;max-width:560px;color:#1c2333\">"
                + "<h2>Reset your password</h2>"
                + "<p>Hi " + esc(name) + ", we received a request to reset your ResumeAI password.</p>"
                + "<p><a href=\"" + esc(link) + "\" style=\"display:inline-block;padding:12px 22px;background:#4f46e5;"
                + "color:#fff;border-radius:8px;text-decoration:none;font-weight:bold\">Choose a new password</a></p>"
                + "<p style=\"color:#5d6779;font-size:13px\">This link works once and expires in "
                + validFor.toMinutes() + " minutes. If you didn't ask for this, you can ignore this email - "
                + "your password won't change.</p></div>";
        send(to, "Reset your ResumeAI password", html);
    }

    private void send(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Sent email: {}", subject);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send email '{}': {}", subject, e.getMessage());
        }
    }

    private static String buildHtml(String name, AnalysisResult r) {
        StringBuilder html = new StringBuilder();
        html.append("<div style=\"font-family:Arial,sans-serif;max-width:640px;color:#1c2333\">")
                .append("<h2>Hi ").append(esc(name)).append(", here is your resume analysis</h2>")
                .append("<p style=\"font-size:28px;margin:8px 0\"><b>").append(r.matchScore()).append("</b> / 100</p>")
                .append("<p>").append(esc(r.summary())).append("</p>");

        if (r.atsScore() != null) {
            html.append("<p><b>ATS score:</b> ").append(r.atsScore()).append(" / 100</p>");
        }
        section(html, "Skills you have", r.matchedSkills());
        section(html, "Missing keywords", r.missingSkills());

        if (r.atsIssues() != null && !r.atsIssues().isEmpty()) {
            html.append("<h3>ATS issues to fix</h3><ul>");
            r.atsIssues().forEach(issue -> html.append("<li>").append(esc(issue)).append("</li>"));
            html.append("</ul>");
        }

        html.append("<h3>Improved bullet points</h3>");
        for (AnalysisResult.BulletRewrite b : r.bulletRewrites()) {
            html.append("<p style=\"color:#5d6779;margin:12px 0 4px\"><b>Before:</b> ").append(esc(b.original())).append("</p>")
                    .append("<p style=\"margin:0 0 4px\"><b>After:</b> ").append(esc(b.improved())).append("</p>")
                    .append("<p style=\"font-size:13px;color:#5d6779;margin:0\"><i>").append(esc(b.reason())).append("</i></p>");
        }

        html.append("<h3>How to improve</h3><ol>");
        r.suggestions().forEach(s -> html.append("<li>").append(esc(s)).append("</li>"));
        html.append("</ol><p style=\"color:#5d6779;font-size:13px\">Sent by AI Resume Analyzer</p></div>");
        return html.toString();
    }

    private static void section(StringBuilder html, String title, List<String> items) {
        html.append("<h3>").append(title).append("</h3>");
        html.append(items.isEmpty() ? "<p>None</p>" : "<p>" + esc(String.join(", ", items)) + "</p>");
    }

    /** AI output and user names are escaped so they can't inject HTML into the email. */
    private static String esc(String text) {
        return text == null ? "" : HtmlUtils.htmlEscape(text);
    }
}
