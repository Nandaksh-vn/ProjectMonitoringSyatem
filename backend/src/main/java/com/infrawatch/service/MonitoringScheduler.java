package com.infrawatch.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Periodic refresh of alerts, recommendations and ML predictions.
 *
 * <p>Previously the rules engine only ran when an administrator manually called
 * {@code POST /v1/alerts/run}, so alerts and recommendations went stale between
 * manual refreshes. Both jobs are toggleable and default to enabled; set
 * {@code infrawatch.scheduling.enabled=false} to disable them in tests or demos.
 */
@Component
public class MonitoringScheduler {

    private static final Logger logger = LoggerFactory.getLogger(MonitoringScheduler.class);

    private final RecommendationEngineService recommendationEngineService;
    private final PredictionSyncService predictionSyncService;
    private final boolean schedulingEnabled;

    public MonitoringScheduler(RecommendationEngineService recommendationEngineService,
                               PredictionSyncService predictionSyncService,
                               @Value("${infrawatch.scheduling.enabled:true}") boolean schedulingEnabled) {
        this.recommendationEngineService = recommendationEngineService;
        this.predictionSyncService = predictionSyncService;
        this.schedulingEnabled = schedulingEnabled;
    }

    /** Re-evaluates the rules engine. Default: every 30 minutes. */
    @Scheduled(
            initialDelayString = "${infrawatch.scheduling.rules-initial-delay-ms:60000}",
            fixedDelayString = "${infrawatch.scheduling.rules-interval-ms:1800000}")
    public void runRulesEngine() {
        if (!schedulingEnabled) {
            return;
        }
        try {
            recommendationEngineService.runEngine();
            logger.info("Scheduled rules engine run completed");
        } catch (Exception e) {
            logger.error("Scheduled rules engine run failed", e);
        }
    }

    /** Refreshes ML predictions. Default: hourly, after the rules engine. */
    @Scheduled(
            initialDelayString = "${infrawatch.scheduling.prediction-initial-delay-ms:120000}",
            fixedDelayString = "${infrawatch.scheduling.prediction-interval-ms:3600000}")
    public void runPredictionSync() {
        if (!schedulingEnabled) {
            return;
        }
        try {
            Map<String, Object> summary = predictionSyncService.syncAllProjects();
            logger.info("Scheduled prediction sync: {}", summary);
        } catch (Exception e) {
            logger.error("Scheduled prediction sync failed", e);
        }
    }
}
