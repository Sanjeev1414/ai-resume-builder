package com.sanjeev.resumeanalyzer.compiler;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CompilerClientTest {

    @Test
    void removesPublicOnlyFromTopLevelTypes() {
        String code = """
                public final class Main {
                    public static class Inner {}
                    public static void main(String[] args) {}
                }
                public interface Shape {}
                """;
        assertEquals("""
                final class Main {
                    public static class Inner {}
                    public static void main(String[] args) {}
                }
                interface Shape {}
                """, CompilerClient.forWandbox(code));
    }
}
