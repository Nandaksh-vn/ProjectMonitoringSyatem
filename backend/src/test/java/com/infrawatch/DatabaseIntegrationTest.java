package com.infrawatch;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Verifies that the JPA entities map cleanly onto a generated schema and that the
 * H2 test fixture is loaded. Runs on H2 (see application-test.yml) so the suite
 * does not require a MySQL server.
 */
@SpringBootTest
@ActiveProfiles("test")
public class DatabaseIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("Fixture rows load into every mapped table")
    public void testSchemaAndSeedData() {
        assertTableCount("roles", 5);
        assertTableCount("users", 4);
        assertTableCount("ministries", 2);
        assertTableCount("sectors", 2);
        assertTableCount("agencies", 2);
        assertTableCount("projects", 3);
        assertTableCount("project_monthly_data", 7);
        assertTableCount("milestones", 4);
        assertTableCount("model_versions", 2);
        assertTableCount("predictions", 3);
        assertTableCount("risk_factors", 7);
        assertTableCount("alerts", 3);
        assertTableCount("recommendations", 3);
    }

    @Test
    @DisplayName("Risk profile distribution over predictions")
    public void testProjectsRiskDistribution() {
        assertEquals(1, count("SELECT COUNT(*) FROM predictions WHERE risk_level = 'CRITICAL'"));
        assertEquals(1, count("SELECT COUNT(*) FROM predictions WHERE risk_level = 'HIGH'"));
        assertEquals(1, count("SELECT COUNT(*) FROM predictions WHERE risk_level = 'LOW'"));
    }

    @Test
    @DisplayName("Exactly one model version is active")
    public void testSingleActiveModelVersion() {
        assertEquals(1, count("SELECT COUNT(*) FROM model_versions WHERE is_active = TRUE"));
    }

    @Test
    @DisplayName("Every prediction resolves to a project and the active model version")
    public void testPredictionReferentialIntegrity() {
        assertEquals(0, count("SELECT COUNT(*) FROM predictions p"
                + " LEFT JOIN projects pr ON pr.id = p.project_id WHERE pr.id IS NULL"));
        assertEquals(0, count("SELECT COUNT(*) FROM predictions p"
                + " LEFT JOIN model_versions mv ON mv.id = p.model_version_id"
                + " WHERE p.model_version_id IS NOT NULL AND mv.id IS NULL"));
    }

    @Test
    @DisplayName("Monthly progress never exceeds 100 percent")
    public void testMonthlyProgressBounds() {
        assertEquals(0, count("SELECT COUNT(*) FROM project_monthly_data"
                + " WHERE actual_physical_progress > 100 OR actual_financial_progress > 100"
                + " OR actual_physical_progress < 0 OR actual_financial_progress < 0"));
    }

    private void assertTableCount(String tableName, int expectedCount) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + tableName, Integer.class);
        assertNotNull(count, "Count for table " + tableName + " should not be null");
        assertEquals(expectedCount, count, "Table " + tableName + " count mismatch");
    }

    private int count(String sql) {
        Integer result = jdbcTemplate.queryForObject(sql, Integer.class);
        assertNotNull(result);
        return result;
    }
}
