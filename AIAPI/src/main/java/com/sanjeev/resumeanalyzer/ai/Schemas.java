package com.sanjeev.resumeanalyzer.ai;

import java.util.List;
import java.util.Map;

/** Small helpers for writing strict JSON schemas (every property required, no extra properties). */
public final class Schemas {

    private Schemas() {
    }

    public static Map<String, Object> string(String description) {
        return Map.of("type", "string", "description", description);
    }

    public static Map<String, Object> integer(String description) {
        return Map.of("type", "integer", "description", description);
    }

    public static Map<String, Object> stringEnum(String description, List<String> values) {
        return Map.of("type", "string", "enum", values, "description", description);
    }

    public static Map<String, Object> stringList(String description) {
        return Map.of("type", "array", "items", Map.of("type", "string"), "description", description);
    }

    public static Map<String, Object> list(String description, Map<String, Object> items) {
        return Map.of("type", "array", "items", items, "description", description);
    }

    public static Map<String, Object> object(Map<String, Object> properties) {
        return Map.of(
                "type", "object",
                "properties", properties,
                "required", List.copyOf(properties.keySet()),
                "additionalProperties", false);
    }
}
