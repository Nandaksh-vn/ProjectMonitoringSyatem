package com.infrawatch;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
public class DatabaseIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("Verify Database Schema & Synthetic Seed Data Counts")
    public void testDatabaseSchemaAndSeedData() {
        assertTableCount("roles", 4);
        assertTableCount("users", 3);
        assertTableCount("ministries", 5);
        assertTableCount("sectors", 5);
        assertTableCount("agencies", 6);
        assertTableCount("projects", 5);
        assertTableCount("project_monthly_data", 30);
        assertTableCount("milestones", 9);
        assertTableCount("model_versions", 3);
        assertTableCount("predictions", 5);
        assertTableCount("risk_factors", 6);
        assertTableCount("alerts", 4);
        assertTableCount("recommendations", 4);
    }

    @Test
    @DisplayName("Test Analytical Query - Projects Risk Profile Distribution")
    public void testProjectsRiskDistribution() {
        Integer criticalCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM predictions WHERE risk_level = 'CRITICAL'", Integer.class);
        assertNotNull(criticalCount);
        assertEquals(1, criticalCount);

        Integer highCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM predictions WHERE risk_level = 'HIGH'", Integer.class);
        assertNotNull(highCount);
        assertEquals(1, highCount);

        Integer lowCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM predictions WHERE risk_level = 'LOW'", Integer.class);
        assertNotNull(lowCount);
        assertEquals(2, lowCount);
    }

    @Test
    @DisplayName("Test Analytical Query - Monthly Progress Trend Observations")
    public void testMonthlyTrendObservations() {
        Integer subansiriMonthlyDataCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM project_monthly_data WHERE project_id = 3", Integer.class);
        assertNotNull(subansiriMonthlyDataCount);
        assertEquals(6, subansiriMonthlyDataCount);
    }

    private void assertTableCount(String tableName, int expectedCount) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + tableName, Integer.class);
        assertNotNull(count, "Count for table " + tableName + " should not be null");
        assertEquals(expectedCount, count, "Table " + tableName + " count mismatch");
    }
}
