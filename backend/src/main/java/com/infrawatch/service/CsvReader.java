package com.infrawatch.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Minimal RFC 4180 CSV reader.
 *
 * <p>Written by hand rather than with {@code String.split(",")}, which breaks on
 * any quoted field containing a comma and silently truncated every subsequent
 * column. Handles quoted fields, escaped quotes (""), embedded newlines, both
 * CRLF and LF, and a UTF-8 byte-order mark.
 */
public final class CsvReader {

    private CsvReader() {
    }

    public static List<Map<String, String>> read(InputStream inputStream) throws IOException {
        List<Map<String, String>> rows = new ArrayList<>();
        List<List<String>> records = parseAll(inputStream);
        if (records.isEmpty()) {
            return rows;
        }

        List<String> header = normaliseHeader(records.get(0));
        for (int i = 1; i < records.size(); i++) {
            List<String> record = records.get(i);
            if (isBlankRecord(record)) {
                continue;
            }
            Map<String, String> row = new LinkedHashMap<>();
            for (int c = 0; c < header.size(); c++) {
                String key = header.get(c);
                if (key.isEmpty()) {
                    continue;
                }
                row.put(key, c < record.size() ? record.get(c) : "");
            }
            rows.add(row);
        }
        return rows;
    }

    private static boolean isBlankRecord(List<String> record) {
        for (String value : record) {
            if (value != null && !value.trim().isEmpty()) {
                return false;
            }
        }
        return true;
    }

    private static List<String> normaliseHeader(List<String> rawHeader) {
        List<String> header = new ArrayList<>(rawHeader.size());
        for (int i = 0; i < rawHeader.size(); i++) {
            String name = rawHeader.get(i);
            if (name != null && i == 0) {
                name = name.replace("\uFEFF", "");
            }
            header.add(name == null ? "" : name.trim().toLowerCase());
        }
        return header;
    }

    private static List<List<String>> parseAll(InputStream inputStream) throws IOException {
        String content = readAll(inputStream);
        List<List<String>> records = new ArrayList<>();
        List<String> current = new ArrayList<>();
        StringBuilder field = new StringBuilder();
        boolean inQuotes = false;
        int i = 0;
        int length = content.length();

        while (i < length) {
            char c = content.charAt(i);

            if (inQuotes) {
                if (c == '"') {
                    if (i + 1 < length && content.charAt(i + 1) == '"') {
                        field.append('"');
                        i += 2;
                        continue;
                    }
                    inQuotes = false;
                    i++;
                    continue;
                }
                field.append(c);
                i++;
                continue;
            }

            switch (c) {
                case '"':
                    inQuotes = true;
                    i++;
                    break;
                case ',':
                    current.add(field.toString());
                    field.setLength(0);
                    i++;
                    break;
                case '\r':
                    i++;
                    break;
                case '\n':
                    current.add(field.toString());
                    field.setLength(0);
                    records.add(current);
                    current = new ArrayList<>();
                    i++;
                    break;
                default:
                    field.append(c);
                    i++;
                    break;
            }
        }

        if (field.length() > 0 || !current.isEmpty()) {
            current.add(field.toString());
            records.add(current);
        }
        return records;
    }

    private static String readAll(InputStream inputStream) throws IOException {
        StringBuilder out = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(inputStream, StandardCharsets.UTF_8), 1 << 16)) {
            char[] buffer = new char[8192];
            int read;
            while ((read = reader.read(buffer)) != -1) {
                out.append(buffer, 0, read);
            }
        }
        return out.toString();
    }
}
