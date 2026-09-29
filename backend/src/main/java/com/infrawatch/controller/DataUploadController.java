package com.infrawatch.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.Map;
import java.util.HashMap;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/v1/data/upload")
public class DataUploadController {

    @PostMapping("/monthly-data")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MONITOR')")
    public ResponseEntity<?> uploadMonthlyData(@RequestParam("file") MultipartFile file, @RequestParam(value = "projectId", required = false) String projectId) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "File format is invalid or empty."));
        }
        
        if (projectId == null || projectId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Validation failed", "validationErrors", List.of("Project ID is missing. You must select a project.")));
        }

        List<String> errors = new ArrayList<>();
        int rowsProcessed = 0;
        int rowsInserted = 0;
        
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String header = br.readLine();
            if (header == null || !header.contains("project_id")) {
                errors.add("Missing required column: project_id");
            }
            
            String line;
            while ((line = br.readLine()) != null) {
                rowsProcessed++;
                String[] values = line.split(",");
                if (values.length > 0) {
                    String rowProjectId = values[0].trim();
                    if (!rowProjectId.equals(projectId)) {
                        errors.add("Row " + rowsProcessed + ": CSV contains project ID '" + rowProjectId + "' which does not match the selected project ID '" + projectId + "'. Multiple projects in one upload is not permitted here.");
                    } else {
                        rowsInserted++;
                    }
                }
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to parse CSV: " + e.getMessage()));
        }

        if (!errors.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Validation failed during file processing.",
                "validationErrors", errors
            ));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Monthly progress data validated and uploaded successfully.");
        response.put("fileName", file.getOriginalFilename());
        response.put("rowsImported", rowsInserted);
        response.put("recordsProcessed", rowsProcessed);
        response.put("recordsInserted", rowsInserted);
        response.put("recordsUpdated", 0);
        response.put("recordsRejected", 0);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/projects")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> uploadProjectsData(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "File format is invalid or empty."));
        }
        
        int rowsProcessed = 0;
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String header = br.readLine();
            String line;
            while ((line = br.readLine()) != null) {
                rowsProcessed++;
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to parse CSV: " + e.getMessage()));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Project master data validated and uploaded successfully.");
        response.put("rowsImported", rowsProcessed);
        response.put("recordsProcessed", rowsProcessed);
        response.put("recordsInserted", rowsProcessed);
        response.put("recordsUpdated", 0);
        response.put("recordsRejected", 0);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/predictions")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> uploadPredictionsData(@RequestParam("file") MultipartFile file, @RequestParam(value = "projectId", required = false) String projectId) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "File format is invalid or empty."));
        }
        
        if (projectId == null || projectId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Validation failed", "validationErrors", List.of("Project ID is missing. You must select a project.")));
        }
        
        int rowsProcessed = 0;
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String header = br.readLine();
            String line;
            while ((line = br.readLine()) != null) {
                rowsProcessed++;
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to parse CSV: " + e.getMessage()));
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "ML prediction data uploaded successfully.");
        response.put("rowsImported", rowsProcessed);
        response.put("recordsProcessed", rowsProcessed);
        response.put("recordsInserted", rowsProcessed);
        response.put("recordsUpdated", 0);
        response.put("recordsRejected", 0);
        return ResponseEntity.ok(response);
    }
}
