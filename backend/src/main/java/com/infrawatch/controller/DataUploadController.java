package com.infrawatch.controller;

import com.infrawatch.service.DataImportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/v1/data/upload")
public class DataUploadController {

    private final DataImportService dataImportService;

    public DataUploadController(DataImportService dataImportService) {
        this.dataImportService = dataImportService;
    }

    @PostMapping("/monthly-data")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MONITOR')")
    public ResponseEntity<?> uploadMonthlyData(@RequestParam("file") MultipartFile file,
                                               @RequestParam(value = "projectId", required = false) Long projectId,
                                               @RequestParam(value = "dryRun", defaultValue = "false") boolean dryRun) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("status", "FAILED",
                    "message", "File is empty.", "validationErrors", java.util.List.of("No file content received.")));
        }
        if (projectId == null) {
            return ResponseEntity.badRequest().body(Map.of("status", "FAILED",
                    "message", "Validation failed",
                    "validationErrors", java.util.List.of("Project ID is required. Select the project this file belongs to.")));
        }
        Map<String, Object> result = dataImportService.importMonthlyData(file, projectId, dryRun);
        return "COMPLETED".equals(result.get("status")) ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
    }

    @PostMapping("/projects")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> uploadProjectsData(@RequestParam("file") MultipartFile file,
                                                @RequestParam(value = "dryRun", defaultValue = "false") boolean dryRun) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("status", "FAILED",
                    "message", "File is empty.", "validationErrors", java.util.List.of("No file content received.")));
        }
        Map<String, Object> result = dataImportService.importProjects(file, dryRun);
        return "COMPLETED".equals(result.get("status")) ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
    }

    @PostMapping("/predictions")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> uploadPredictionsData(@RequestParam("file") MultipartFile file,
                                                  @RequestParam(value = "projectId", required = false) Long projectId,
                                                  @RequestParam(value = "dryRun", defaultValue = "false") boolean dryRun) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("status", "FAILED",
                    "message", "File is empty.", "validationErrors", java.util.List.of("No file content received.")));
        }
        Map<String, Object> result = dataImportService.importPredictions(file, projectId, dryRun);
        return "COMPLETED".equals(result.get("status")) ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
    }

    /** Column contract for each import type, so the UI can offer a template. */
    @GetMapping("/template")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MONITOR', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST')")
    public ResponseEntity<?> getTemplate() {
        return ResponseEntity.ok(Map.of(
                "columns", dataImportService.columnTemplates(),
                "notes", java.util.List.of(
                        "Headers are matched case-insensitively and may use spaces, hyphens or camelCase instead of underscores.",
                        "Dates accept yyyy-mm-dd, dd-mm-yyyy and d-m-yyyy.",
                        "Amounts are INR crore; progress columns are percentages from 0 to 100.",
                        "Send dryRun=true to validate without writing any rows.")));
    }
}
