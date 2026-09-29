package com.infrawatch.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityAndControllerTest {

    private static final String MONTHLY_CSV =
            "project_id,reporting_month,planned_physical_progress,actual_physical_progress,"
                    + "planned_financial_progress,actual_financial_progress,monthly_expenditure,"
                    + "cumulative_expenditure,revised_cost,revised_completion_date\n"
                    + "1,2026-11-30,68.00,70.00,74.00,76.50,150.00,5550.00,8250.00,2027-12-31\n";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMultipartFile monthlyCsv() {
        return new MockMultipartFile("file", "monthly.csv", "text/csv", MONTHLY_CSV.getBytes());
    }

    @Test
    @DisplayName("Protected endpoints reject anonymous callers")
    void rejectsAnonymous() throws Exception {
        mockMvc.perform(get("/v1/projects"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/v1/predictions/latest"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Login and registration remain publicly reachable")
    void permitsPublicAuthEndpoints() throws Exception {
        mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("username", "nobody", "password", "wrong"))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/v1/auth/does-not-exist"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("A deactivated account cannot log in")
    void rejectsDeactivatedAccount() throws Exception {
        mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("username", "deactivated_user", "password", "password"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Registration cannot be used to grant an administrative role")
    void registrationCannotEscalatePrivileges() throws Exception {
        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "sneaky-admin",
                                "password", "Str0ngPass!23",
                                "fullName", "Sneaky Admin",
                                "email", "sneaky@infrawatch.gov.in",
                                "department", "None",
                                "role", "ROLE_ADMIN"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        org.hamcrest.Matchers.containsString("cannot be self-assigned")));
    }

    @Test
    @DisplayName("Registration accepts a viewer role")
    void registrationAllowsViewer() throws Exception {
        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "new-viewer",
                                "password", "Str0ngPass!23",
                                "fullName", "New Viewer",
                                "email", "new.viewer@infrawatch.gov.in",
                                "department", "Policy",
                                "role", "ROLE_VIEWER"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(
                        org.hamcrest.Matchers.containsString("registered successfully")));
    }

    @Test
    @DisplayName("A viewer may read projects but not upload data")
    void viewerIsReadOnly() throws Exception {
        mockMvc.perform(get("/v1/projects").with(user("viewer").roles("VIEWER")))
                .andExpect(status().isOk());

        mockMvc.perform(multipart("/v1/data/upload/monthly-data")
                        .file(monthlyCsv())
                        .param("projectId", "1")
                        .with(user("viewer").roles("VIEWER")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("A monitor may upload monthly data")
    void monitorMayUpload() throws Exception {
        mockMvc.perform(multipart("/v1/data/upload/monthly-data")
                        .file(monthlyCsv())
                        .param("projectId", "1")
                        .with(user("monitor").roles("MONITOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.recordsInserted").value(1));
    }

    @Test
    @DisplayName("A monitor cannot import the project master list")
    void monitorCannotImportProjects() throws Exception {
        mockMvc.perform(multipart("/v1/data/upload/projects")
                        .file(new MockMultipartFile("file", "p.csv", "text/csv",
                                "project_code,project_name\nX,Y\n".getBytes()))
                        .with(user("monitor").roles("MONITOR")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("A malformed file is reported as a validation failure, not a server error")
    void malformedUploadReportsValidationFailure() throws Exception {
        mockMvc.perform(multipart("/v1/data/upload/monthly-data")
                        .file(new MockMultipartFile("file", "bad.csv", "text/csv",
                                "project_id,reporting_month\n1,2026-01-31\n".getBytes()))
                        .param("projectId", "1")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("FAILED"))
                .andExpect(jsonPath("$.recordsInserted").value(0))
                .andExpect(jsonPath("$.validationErrors").isNotEmpty());
    }

    @Test
    @DisplayName("Monthly upload without a project is rejected")
    void monthlyUploadRequiresProject() throws Exception {
        mockMvc.perform(multipart("/v1/data/upload/monthly-data")
                        .file(monthlyCsv())
                        .with(user("monitor").roles("MONITOR")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("FAILED"));
    }

    @Test
    @DisplayName("A dry run through the API writes nothing and still reports the row count")
    void dryRunThroughApi() throws Exception {
        mockMvc.perform(multipart("/v1/data/upload/monthly-data")
                        .file(new MockMultipartFile("file", "dry.csv", "text/csv", MONTHLY_CSV.getBytes()))
                        .param("projectId", "1")
                        .param("dryRun", "true")
                        .with(user("monitor").roles("MONITOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dryRun").value(true))
                .andExpect(jsonPath("$.recordsInserted").value(1));
    }

    @Test
    @DisplayName("The upload template endpoint is readable by an analyst")
    void templateEndpointIsReadable() throws Exception {
        mockMvc.perform(get("/v1/data/upload/template").with(user("analyst").roles("ANALYST")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.columns.projects").isNotEmpty())
                .andExpect(jsonPath("$.columns['monthly-data']").isNotEmpty());
    }

    @Test
    @DisplayName("Risk factors are returned for the latest prediction of a project")
    void riskFactorsUseLatestPrediction() throws Exception {
        mockMvc.perform(get("/v1/projects/2/risk-factors").with(user("analyst").roles("ANALYST")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(3));
    }

    @Test
    @DisplayName("Recording a recommendation action persists the status")
    void recommendationActionIsRecorded() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .patch("/v1/recommendations/1/action")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("actionTaken", true, "details", "Reviewed with the field team.")))
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recommendation.actionTakenStatus").value(true))
                .andExpect(jsonPath("$.recommendation.actionTakenDetails").value("Reviewed with the field team."));
    }

    @Test
    @DisplayName("Acting on a missing recommendation returns 404")
    void recommendationActionOnMissingId() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .patch("/v1/recommendations/999999/action")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("actionTaken", true)))
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("A viewer cannot record a recommendation action")
    void viewerCannotRecordAction() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .patch("/v1/recommendations/1/action")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("actionTaken", true)))
                        .with(user("viewer").roles("VIEWER")))
                .andExpect(status().isForbidden());
    }
}
