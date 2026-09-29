package com.infrawatch.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CsvReaderTest {

    private List<Map<String, String>> parse(String csv) throws Exception {
        return CsvReader.read(new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    @DisplayName("Simple rows map by header name")
    void parsesSimpleCsv() throws Exception {
        List<Map<String, String>> rows = parse("a,b\n1,2\n3,4\n");
        assertEquals(2, rows.size());
        assertEquals("1", rows.get(0).get("a"));
        assertEquals("4", rows.get(1).get("b"));
    }

    @Test
    @DisplayName("A quoted field containing a comma does not shift later columns")
    void handlesQuotedCommas() throws Exception {
        List<Map<String, String>> rows = parse("code,name\nNH-1,\"Expressway, Phase II\"\n");
        assertEquals("NH-1", rows.get(0).get("code"));
        assertEquals("Expressway, Phase II", rows.get(0).get("name"));
    }

    @Test
    @DisplayName("Escaped double quotes are unescaped")
    void handlesEscapedQuotes() throws Exception {
        List<Map<String, String>> rows = parse("title\n\"He said \"\"yes\"\" loudly\"\n");
        assertEquals("He said \"yes\" loudly", rows.get(0).get("title"));
    }

    @Test
    @DisplayName("Newlines inside a quoted field stay in the value")
    void handlesEmbeddedNewline() throws Exception {
        List<Map<String, String>> rows = parse("a,b\n1,\"line one\nline two\"\n");
        assertEquals(1, rows.size());
        assertEquals("line one\nline two", rows.get(0).get("b"));
    }

    @Test
    @DisplayName("CRLF line endings are handled")
    void handlesCrlf() throws Exception {
        List<Map<String, String>> rows = parse("a,b\r\n1,2\r\n");
        assertEquals(1, rows.size());
        assertEquals("2", rows.get(0).get("b"));
    }

    @Test
    @DisplayName("Headers are lower-cased, trimmed and stripped of a UTF-8 BOM")
    void normalisesHeaders() throws Exception {
        List<Map<String, String>> rows = parse("\uFEFF Project_Code , NAME \nNH-1,Road\n");
        assertTrue(rows.get(0).containsKey("project_code"), "expected lower-cased header, got " + rows.get(0).keySet());
        assertTrue(rows.get(0).containsKey("name"));
    }

    @Test
    @DisplayName("A short row leaves missing trailing columns as empty rather than throwing")
    void toleratesShortRows() throws Exception {
        List<Map<String, String>> rows = parse("a,b,c\n1,2\n");
        assertEquals(1, rows.size());
        assertEquals("2", rows.get(0).get("b"));
        assertEquals("", rows.get(0).get("c"));
    }

    @Test
    @DisplayName("Blank lines are skipped")
    void skipsBlankLines() throws Exception {
        // Two real data rows separated by two empty lines.
        assertEquals(2, parse("a,b\n1,2\n\n\n3,4\n").size());
    }

    @Test
    @DisplayName("A final row without a trailing newline is still returned")
    void handlesMissingTrailingNewline() throws Exception {
        List<Map<String, String>> rows = parse("a,b\n1,2");
        assertEquals(1, rows.size());
        assertEquals("1", rows.get(0).get("a"));
    }

    @Test
    @DisplayName("A header-only file yields no rows")
    void handlesHeaderOnly() throws Exception {
        assertTrue(parse("a,b,c\n").isEmpty());
    }
}
