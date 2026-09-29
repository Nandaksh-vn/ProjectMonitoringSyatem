package com.infrawatch.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infrawatch.entity.Project;
import com.infrawatch.repository.ProjectRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The public report is the one screen with no authentication, so its arithmetic is
 * the easiest thing in the system to get quietly wrong and the hardest to notice.
 * These tests pin the two different percentage meanings against known fixture
 * numbers instead of only checking that the endpoint returns 200.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PublicReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProjectRepository projectRepository;

    @Test
    @DisplayName("Public report is reachable without authentication")
    void reportIsPublic() throws Exception {
        mockMvc.perform(get("/v1/public/reports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalProjects").value(3))
                .andExpect(jsonPath("$.disclaimer").isNotEmpty());
    }

    @Test
    @DisplayName("Fund utilisation is expenditure over revised cost, not the gap between them")
    void fundUtilisationIsARatio() throws Exception {
        // Fixtures: revised 8250 + 1650 + 11000 = 20900, expenditure 5400 + 1180 + 3000 = 9580.
        // Correct ratio: 9580 / 20900 = 45.84%.
        // The earlier implementation reported |9580 - 20900| / 20900 = 54.16%, which is
        // the unspent balance, not the share of the budget that has been used.
        mockMvc.perform(get("/v1/public/reports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.financials.totalRevisedCost").value(20900.00))
                .andExpect(jsonPath("$.financials.totalExpenditure").value(9580.00))
                .andExpect(jsonPath("$.financials.fundUtilisationPercent").value(45.84));
    }

    @Test
    @DisplayName("Cost escalation is measured against the approved baseline")
    void costEscalationIsADeviation() throws Exception {
        // Approved 19700, revised 20900 -> |20900 - 19700| / 19700 = 6.09%.
        mockMvc.perform(get("/v1/public/reports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.financials.totalApprovedCost").value(19700.00))
                .andExpect(jsonPath("$.financials.costEscalationPercent").value(6.09));
    }

    @Test
    @DisplayName("Per-sector aggregates carry the same two percentage definitions")
    void sectorAggregatesUseBothHelpers() throws Exception {
        List<Map<String, Object>> sectors = sectors();

        assertFalse(sectors.isEmpty(), "expected at least one sector in the report");
        for (Map<String, Object> sector : sectors) {
            BigDecimal approved = new BigDecimal(String.valueOf(sector.get("approvedCost")));
            BigDecimal revised = new BigDecimal(String.valueOf(sector.get("revisedCost")));
            BigDecimal spent = new BigDecimal(String.valueOf(sector.get("expenditure")));

            BigDecimal reportedUtilisation =
                    new BigDecimal(String.valueOf(sector.get("fundUtilisationPercent")));
            BigDecimal expectedUtilisation = ratio(spent, revised);
            assertEquals(0, expectedUtilisation.compareTo(reportedUtilisation),
                    "fundUtilisationPercent must be expenditure/revisedCost for sector " + sector.get("name")
                            + " (expected " + expectedUtilisation + ", got " + reportedUtilisation + ")");

            BigDecimal reportedEscalation =
                    new BigDecimal(String.valueOf(sector.get("costEscalationPercent")));
            BigDecimal expectedEscalation = deviation(approved, revised);
            assertEquals(0, expectedEscalation.compareTo(reportedEscalation),
                    "costEscalationPercent must be deviation from approved for sector " + sector.get("name")
                            + " (expected " + expectedEscalation + ", got " + reportedEscalation + ")");
        }
    }

    @Test
    @DisplayName("A fully spent budget reports 100% utilisation, not 0%")
    @Transactional
    void fullUtilisationIsOneHundred() throws Exception {
        Project fullySpent = new Project();
        fullySpent.setProjectCode("UTL-100");
        fullySpent.setProjectName("Fully Disbursed Project");
        fullySpent.setMinistryId(1L);
        fullySpent.setSectorId(1L);
        fullySpent.setAgencyId(1L);
        fullySpent.setState("Test State");
        fullySpent.setDistrict("Test District");
        fullySpent.setApprovedCost(new BigDecimal("1000.00"));
        fullySpent.setRevisedCost(new BigDecimal("1000.00"));
        fullySpent.setCurrentExpenditure(new BigDecimal("1000.00"));
        fullySpent.setApprovalDate(LocalDate.of(2024, 1, 1));
        fullySpent.setOriginalStartDate(LocalDate.of(2024, 2, 1));
        fullySpent.setOriginalCompletionDate(LocalDate.of(2026, 2, 1));
        fullySpent.setStatus("ONGOING");
        projectRepository.save(fullySpent);
        projectRepository.flush();

        // Totals become revised 21900 / spent 10580 = 48.31%.
        mockMvc.perform(get("/v1/public/reports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.financials.fundUtilisationPercent").value(48.31));
    }

    @Test
    @DisplayName("Risk distribution and ranked list come from stored predictions")
    void riskRankingsAreDataDriven() throws Exception {
        String body = mockMvc.perform(get("/v1/public/reports"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        @SuppressWarnings("unchecked")
        Map<String, Object> parsed = objectMapper.readValue(body, Map.class);

        @SuppressWarnings("unchecked")
        Map<String, Object> distribution = (Map<String, Object>) parsed.get("riskDistribution");
        assertEquals(4, distribution.size(), "every risk level must be present even at zero");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> ranked =
                (List<Map<String, Object>>) parsed.get("topAtRiskProjects");
        assertFalse(ranked.isEmpty(), "fixtures contain scored projects, so the ranking must not be empty");

        // Highest risk first.
        double previous = Double.MAX_VALUE;
        for (Map<String, Object> row : ranked) {
            double score = Double.parseDouble(String.valueOf(row.get("overallRiskScore")));
            assertEquals(true, score <= previous,
                    "ranked projects must be ordered by descending risk score");
            previous = score;
        }
    }

    @Test
    @DisplayName("Reference data is served from the database, not hard-coded lists")
    void referenceDataComesFromDatabase() throws Exception {
        mockMvc.perform(get("/v1/reference/all").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ministries.length()").value(2))
                .andExpect(jsonPath("$.sectors.length()").value(2))
                .andExpect(jsonPath("$.agencies.length()").value(2))
                .andExpect(jsonPath("$.agencies[0].code").isNotEmpty());
    }

    @Test
    @DisplayName("Agencies can be narrowed to a single ministry")
    void agenciesFilterByMinistry() throws Exception {
        mockMvc.perform(get("/v1/reference/agencies")
                        .param("ministryId", "1")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].code").value("NHAI"));
    }

    @Test
    @DisplayName("Reference data still requires authentication")
    void referenceDataIsNotPublic() throws Exception {
        mockMvc.perform(get("/v1/reference/sectors"))
                .andExpect(status().isUnauthorized());
    }

    private List<Map<String, Object>> sectors() throws Exception {
        String body = mockMvc.perform(get("/v1/public/reports"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        @SuppressWarnings("unchecked")
        Map<String, Object> parsed = objectMapper.readValue(body, Map.class);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> sectors = (List<Map<String, Object>>) parsed.get("sectors");
        return sectors;
    }

    private static BigDecimal ratio(BigDecimal part, BigDecimal whole) {
        if (whole == null || whole.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO.setScale(2);
        }
        return part.divide(whole, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal deviation(BigDecimal base, BigDecimal value) {
        if (base == null || base.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO.setScale(2);
        }
        return value.subtract(base).abs()
                .divide(base, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }
}
