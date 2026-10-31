package com.sanjeev.resumeanalyzer.email;

import com.sanjeev.resumeanalyzer.model.TailoredResume;
import org.springframework.web.util.HtmlUtils;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Renders a tailored resume as email-safe HTML (inline styles only) in one of the frontend's
 * templates: classic, modern or compact. Mirrors the .resume-paper styles in AIweb/src/features.css.
 */
final class ResumeHtml {

    private record Style(String font, String size, String align, String nameColor, String headingStyle) {
    }

    private static final Style CLASSIC = new Style("Arial,Helvetica,sans-serif", "14px", "center", "#0f1b33",
            "color:#1e3a8a;border-bottom:1.5px solid #1e3a8a;text-transform:uppercase;letter-spacing:1px");
    private static final Style MODERN = new Style("Arial,Helvetica,sans-serif", "14px", "left", "#0f766e",
            "color:#0f766e;border-left:3px solid #0f766e;padding-left:8px");
    private static final Style COMPACT = new Style("Georgia,'Times New Roman',serif", "13px", "center", "#111827",
            "color:#111827;border-bottom:1px solid #111827;text-transform:uppercase;letter-spacing:1px");

    private ResumeHtml() {
    }

    static String render(TailoredResume r, String template) {
        Style s = switch (template) {
            case "modern" -> MODERN;
            case "compact" -> COMPACT;
            default -> CLASSIC;
        };
        StringBuilder h = new StringBuilder("<div style=\"font-family:" + s.font() + ";font-size:" + s.size()
                + ";line-height:1.45;color:#111827\">");
        h.append("<div style=\"text-align:").append(s.align()).append("\">")
                .append("<div style=\"font-size:26px;font-weight:bold;color:").append(s.nameColor()).append("\">")
                .append(esc(r.fullName())).append("</div>");
        if (present(r.title())) h.append("<div style=\"color:#374151\">").append(esc(r.title())).append("</div>");
        String contact = Stream.of(r.email(), r.phone(), r.location(), r.linkedin(), r.website())
                .filter(ResumeHtml::present).map(ResumeHtml::esc).collect(Collectors.joining(" | "));
        if (!contact.isEmpty()) h.append("<div style=\"color:#374151;font-size:12px\">").append(contact).append("</div>");
        h.append("</div>");

        if (present(r.summary())) heading(h, s, "Summary").append("<p style=\"margin:0\">").append(esc(r.summary())).append("</p>");
        if (!list(r.skills()).isEmpty()) {
            heading(h, s, "Skills").append("<p style=\"margin:0\">").append(esc(String.join(", ", r.skills()))).append("</p>");
        }
        if (!list(r.experience()).isEmpty()) {
            heading(h, s, "Experience");
            for (TailoredResume.Experience e : r.experience()) {
                row(h, join(", ", e.role(), e.company()), join(" - ", e.start(), e.end()));
                if (present(e.location())) h.append("<div style=\"color:#4b5563;font-size:12px\">").append(esc(e.location())).append("</div>");
                bullets(h, e.bullets());
            }
        }
        if (!list(r.projects()).isEmpty()) {
            heading(h, s, "Projects");
            for (TailoredResume.Project p : r.projects()) {
                row(h, join(" | ", p.name(), p.tech()), p.link());
                bullets(h, p.bullets());
            }
        }
        if (!list(r.education()).isEmpty()) {
            heading(h, s, "Education");
            for (TailoredResume.Education e : r.education()) {
                row(h, join(", ", e.degree(), e.school()), e.year());
                if (present(e.score())) h.append("<div style=\"color:#4b5563;font-size:12px\">").append(esc(e.score())).append("</div>");
            }
        }
        if (!list(r.certifications()).isEmpty()) {
            heading(h, s, "Certifications");
            bullets(h, r.certifications());
        }
        return h.append("</div>").toString();
    }

    private static StringBuilder heading(StringBuilder h, Style s, String title) {
        return h.append("<div style=\"margin:16px 0 6px;padding-bottom:3px;font-weight:bold;font-size:14px;")
                .append(s.headingStyle()).append("\">").append(title).append("</div>");
    }

    /** Bold title on the left, date/link on the right - a table so it lines up in every mail client. */
    private static void row(StringBuilder h, String left, String right) {
        h.append("<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin-top:6px\"><tr>")
                .append("<td style=\"font-weight:bold\">").append(esc(left)).append("</td>")
                .append("<td style=\"text-align:right;color:#374151;font-size:12px;white-space:nowrap\">")
                .append(esc(right)).append("</td></tr></table>");
    }

    private static void bullets(StringBuilder h, List<String> items) {
        if (list(items).isEmpty()) return;
        h.append("<ul style=\"margin:4px 0 0;padding-left:18px\">");
        items.stream().filter(ResumeHtml::present).forEach(b -> h.append("<li>").append(esc(b)).append("</li>"));
        h.append("</ul>");
    }

    private static String join(String separator, String... parts) {
        return Stream.of(parts).filter(ResumeHtml::present).collect(Collectors.joining(separator));
    }

    private static <T> List<T> list(List<T> items) {
        return items == null ? List.of() : items.stream().filter(Objects::nonNull).toList();
    }

    private static boolean present(String text) {
        return text != null && !text.isBlank();
    }

    private static String esc(String text) {
        return text == null ? "" : HtmlUtils.htmlEscape(text);
    }
}
