package com.infrawatch.service;

import com.infrawatch.dto.ChatRequest;
import com.infrawatch.dto.ChatResponse;
import com.infrawatch.entity.*;
import com.infrawatch.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AiAssistantService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PredictionRepository predictionRepository;

    @Autowired
    private RiskFactorRepository riskFactorRepository;

    @Autowired
    private RecommendationRepository recommendationRepository;

    @Autowired
    private AlertRepository alertRepository;
    
    @Autowired
    private MilestoneRepository milestoneRepository;

    public ChatResponse processChat(ChatRequest request) {
        if (request.getProjectId() == null) {
            return new ChatResponse("Project ID is required. I can only answer questions related to a specific project context.", List.of());
        }

        Project project = projectRepository.findById(request.getProjectId()).orElse(null);
        if (project == null) {
            return new ChatResponse("The requested project could not be found. Please provide a valid project ID.", List.of());
        }

        // Fetch context
        List<Prediction> predictions = predictionRepository.findByProjectIdOrderByPredictionDateDesc(project.getId());
        Prediction latestPrediction = predictions.isEmpty() ? null : predictions.get(0);
        
        List<RiskFactor> riskFactors = latestPrediction != null ? riskFactorRepository.findByPredictionId(latestPrediction.getId()) : List.of();
        List<Alert> alerts = alertRepository.findByProjectId(project.getId());
        List<Recommendation> recommendations = recommendationRepository.findByProjectId(project.getId());
        List<Milestone> milestones = milestoneRepository.findByProjectId(project.getId());

        String msg = request.getMessage().toLowerCase();
        StringBuilder reply = new StringBuilder();
        List<String> sources = new ArrayList<>();

        // Basic keyword matching to simulate LLM logic based on context
        if (msg.contains("high risk") || msg.contains("risk score") || msg.contains("level")) {
            sources.add("FACT");
            sources.add("PREDICTION");
            reply.append("**FACT:** ").append(project.getProjectName()).append(" is currently in the sector ID ").append(project.getSectorId()).append(" under ministry ID ").append(project.getMinistryId()).append(".\n\n");
            
            if (latestPrediction != null) {
                reply.append("**PREDICTION:** The ML model predicts an overall risk score of ").append(latestPrediction.getOverallRiskScore()).append(" (Risk Level: ").append(latestPrediction.getRiskLevel()).append("). ");
                reply.append("There is a ").append(latestPrediction.getCostOverrunProbability()).append("% probability of cost overrun and ").append(latestPrediction.getTimeOverrunProbability()).append("% probability of time delay.\n\n");
            }
            if (!riskFactors.isEmpty()) {
                reply.append("**SHAP FACTORS:** The key risk drivers are:\n");
                for (RiskFactor rf : riskFactors) {
                    reply.append("- ").append(rf.getFactorName()).append(" (Impact: ").append(rf.getShapValue()).append(")\n");
                }
            }
        } else if (msg.contains("milestone") || msg.contains("delay")) {
            sources.add("FACT");
            sources.add("PREDICTION");
            reply.append("**FACT:** The original completion date is ").append(project.getOriginalCompletionDate()).append(", revised to ").append(project.getRevisedCompletionDate()).append(".\n");
            long delayedMilestones = milestones.stream().filter(m -> "DELAYED".equalsIgnoreCase(m.getStatus())).count();
            reply.append("There are ").append(delayedMilestones).append(" delayed milestones.\n\n");
            if (latestPrediction != null) {
                reply.append("**PREDICTION:** The predicted delay is ").append(latestPrediction.getPredictedDelayMonths()).append(" months.\n");
            }
        } else if (msg.contains("recommend") || msg.contains("review") || msg.contains("action")) {
            sources.add("RECOMMENDATION");
            sources.add("PREDICTION");
            if (!recommendations.isEmpty()) {
                reply.append("**RECOMMENDATION:** Based on the risk profile, the following actions are suggested:\n");
                for (Recommendation r : recommendations) {
                    reply.append("- [").append(r.getRecommendationType()).append("] ").append(r.getTitle()).append(": ").append(r.getDescription()).append("\n");
                }
            } else {
                reply.append("**RECOMMENDATION:** No specific recommendations are available at this time.\n");
            }
        } else if (msg.contains("cost") || msg.contains("expenditure")) {
             sources.add("FACT");
             sources.add("PREDICTION");
             reply.append("**FACT:** The approved cost is ").append(project.getApprovedCost()).append(" with a revised cost of ").append(project.getRevisedCost()).append(". ");
             reply.append("Current expenditure stands at ").append(project.getCurrentExpenditure()).append(" (").append(project.getFinancialProgress()).append("% financial progress).\n\n");
             if (latestPrediction != null) {
                 reply.append("**PREDICTION:** The predicted cost overrun percentage is ").append(latestPrediction.getPredictedCostOverrunPct()).append("%.\n");
             }
        } else {
            // General summary
            sources.add("FACT");
            reply.append("**FACT:** ").append(project.getProjectName()).append(" (").append(project.getProjectCode()).append(") ");
            reply.append("has physical progress of ").append(project.getPhysicalProgress()).append("% and financial progress of ").append(project.getFinancialProgress()).append("%.\n\n");
            if (latestPrediction != null) {
                sources.add("PREDICTION");
                reply.append("**PREDICTION:** The current ML risk level is ").append(latestPrediction.getRiskLevel()).append(".\n\n");
            }
            if (!recommendations.isEmpty()) {
                sources.add("RECOMMENDATION");
                reply.append("**RECOMMENDATION:** You have ").append(recommendations.size()).append(" pending recommendations for this project.\n");
            }
        }

        return new ChatResponse(reply.toString(), sources);
    }
}
