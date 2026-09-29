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
        String msg = request.getMessage().toLowerCase();
        StringBuilder reply = new StringBuilder();
        List<String> sources = new ArrayList<>();

        // 1. Reject unrelated/inappropriate questions
        if (msg.contains("cricket") || msg.contains("weather") || msg.contains("movie") || msg.contains("sport") || msg.contains("who will win") || msg.contains("recipe") || msg.contains("song")) {
            return new ChatResponse("I can help with infrastructure project monitoring, risk, progress, cost, schedule, milestones, and project analysis. Please rephrase your question.", List.of());
        }

        // Global query handling (no specific project selected, or asking about "projects" plural)
        boolean isGlobalQuery = request.getProjectId() == null || (msg.contains("which projects") || msg.contains("show projects") || msg.contains("show high risk projects") || msg.contains("show delayed projects") || msg.contains("water projects"));

        if (isGlobalQuery) {
            List<Project> allProjects = projectRepository.findAll();
            sources.add("FACT");
            
            if (msg.contains("high risk") || msg.contains("critical") || msg.contains("risk")) {
                long criticalCount = allProjects.stream().filter(p -> "CRITICAL".equalsIgnoreCase(p.getStatus()) || "AT_RISK".equalsIgnoreCase(p.getStatus())).count();
                reply.append("I found ").append(criticalCount).append(" projects currently flagged as Critical or At Risk in the portfolio based on latest reports.\n");
                return new ChatResponse(reply.toString().trim(), sources);
            }
            
            if (msg.contains("delay") || msg.contains("delayed") || msg.contains("schedule")) {
                long delayedCount = allProjects.stream().filter(p -> "DELAYED".equalsIgnoreCase(p.getStatus())).count();
                reply.append("There are ").append(delayedCount).append(" projects currently marked as DELAYED in their schedule.\n");
                return new ChatResponse(reply.toString().trim(), sources);
            }
            
            if (msg.contains("cost overrun") || msg.contains("cost increase") || msg.contains("revised cost")) {
                long costOverrunCount = allProjects.stream().filter(p -> p.getRevisedCost() != null && p.getApprovedCost() != null && p.getRevisedCost().compareTo(p.getApprovedCost()) > 0).count();
                reply.append("There are ").append(costOverrunCount).append(" projects experiencing cost overruns (revised cost exceeds approved cost).\n");
                return new ChatResponse(reply.toString().trim(), sources);
            }
            
            if (msg.contains("water") || msg.contains("transport") || msg.contains("energy") || msg.contains("mining")) {
                // Approximate sector by searching for matching words in project name or checking if sectorId exists
                long sectorCount = allProjects.stream().filter(p -> p.getProjectName().toLowerCase().contains("water") || p.getProjectName().toLowerCase().contains("transport") || p.getSectorId() != null).count();
                reply.append("I found ").append(sectorCount).append(" projects potentially matching that sector criteria.\n");
                return new ChatResponse(reply.toString().trim(), sources);
            }
            
            if (msg.contains("karnataka") || msg.contains("state")) {
                long stateCount = allProjects.stream().filter(p -> p.getState() != null && p.getState().toLowerCase().contains("karnataka")).count();
                reply.append("I found ").append(stateCount).append(" projects located in Karnataka.\n");
                return new ChatResponse(reply.toString().trim(), sources);
            }
            
            if (msg.contains("ministry")) {
                long ministryCount = allProjects.stream().filter(p -> p.getMinistryId() != null).count();
                reply.append("There are ").append(ministryCount).append(" projects associated with ministries.\n");
                return new ChatResponse(reply.toString().trim(), sources);
            }
            
            if (msg.contains("physical progress") || msg.contains("financial progress")) {
                long lowProgressCount = allProjects.stream().filter(p -> p.getPhysicalProgress() != null && p.getPhysicalProgress().compareTo(new java.math.BigDecimal("50.0")) < 0).count();
                reply.append("There are ").append(lowProgressCount).append(" projects with less than 50% physical progress.\n");
                return new ChatResponse(reply.toString().trim(), sources);
            }
            
            if (msg.contains("milestone")) {
                reply.append("To view milestone data, please select a specific project or visit the Early Warnings page for global alerts.\n");
                return new ChatResponse(reply.toString().trim(), sources);
            }

            return new ChatResponse("I can help with infrastructure project monitoring, risk, progress, cost, schedule, milestones, and project analysis. Please rephrase your question.", List.of());
        }

        // Project-specific handling
        Project project = projectRepository.findById(request.getProjectId()).orElse(null);
        if (project == null) {
            return new ChatResponse("I don't have enough information in the available project data to answer that. (Project not found)", List.of());
        }

        // Fetch context
        List<Prediction> predictions = predictionRepository.findByProjectIdOrderByPredictionDateDesc(project.getId());
        Prediction latestPrediction = predictions.isEmpty() ? null : predictions.get(0);
        
        List<RiskFactor> riskFactors = latestPrediction != null ? riskFactorRepository.findByPredictionId(latestPrediction.getId()) : List.of();
        List<Alert> alerts = alertRepository.findByProjectId(project.getId());
        List<Recommendation> recommendations = recommendationRepository.findByProjectId(project.getId());
        List<Milestone> milestones = milestoneRepository.findByProjectId(project.getId());

        boolean understood = false;

        if (msg.contains("high risk") || msg.contains("critical") || msg.contains("risk") || msg.contains("risk factor")) {
            understood = true;
            sources.add("FACT");
            sources.add("PREDICTION");
            reply.append("The project ").append(project.getProjectName()).append(" is currently in ").append(project.getStatus() != null ? project.getStatus() : "UNKNOWN").append(" status.\n\n");
            
            if (latestPrediction != null) {
                reply.append("The ML model predicts an overall risk score of ").append(latestPrediction.getOverallRiskScore()).append(" (Risk Level: ").append(latestPrediction.getRiskLevel()).append(").\n\n");
            } else {
                reply.append("No ML risk predictions are currently available for this project.\n\n");
            }
            if (!riskFactors.isEmpty()) {
                reply.append("The main risk factors identified are:\n");
                for (RiskFactor rf : riskFactors) {
                    reply.append("- ").append(rf.getFactorName()).append("\n");
                }
            } else {
                reply.append("No specific ML risk factors have been recorded.\n");
            }
        } 
        
        if (msg.contains("milestone") || msg.contains("delay") || msg.contains("schedule") || msg.contains("behind")) {
            understood = true;
            sources.add("FACT");
            reply.append("The approved completion date is ").append(project.getOriginalCompletionDate()).append(".\n");
            if (project.getRevisedCompletionDate() != null) {
                reply.append("The revised completion date is ").append(project.getRevisedCompletionDate()).append(".\n");
            }
            long delayedMilestones = milestones.stream().filter(m -> "DELAYED".equalsIgnoreCase(m.getStatus())).count();
            reply.append("There are ").append(delayedMilestones).append(" delayed milestones out of ").append(milestones.size()).append(" total milestones recorded.\n");
        } 
        
        if (msg.contains("recommend") || msg.contains("action") || msg.contains("mitigat")) {
            understood = true;
            sources.add("RECOMMENDATION");
            if (!recommendations.isEmpty()) {
                reply.append("The following recommendations are available based on detected risks:\n");
                for (Recommendation r : recommendations) {
                    reply.append("- ").append(r.getTitle()).append(": ").append(r.getDescription()).append("\n");
                }
            } else {
                reply.append("No recommendations are currently available for this project.\n");
            }
        } 
        
        if (msg.contains("cost") || msg.contains("expenditure") || msg.contains("financial") || msg.contains("approved cost")) {
            understood = true;
            sources.add("FACT");
            reply.append("The approved cost is ₹").append(project.getApprovedCost() != null ? project.getApprovedCost() : 0).append(" Cr. ");
            if (project.getRevisedCost() != null && project.getApprovedCost() != null && project.getRevisedCost().compareTo(project.getApprovedCost()) > 0) {
                reply.append("The revised cost is ₹").append(project.getRevisedCost()).append(" Cr, indicating a cost overrun.\n");
            } else {
                reply.append("There is no officially recorded cost overrun at this time.\n");
            }
            reply.append("Financial progress is currently at ").append(project.getFinancialProgress() != null ? project.getFinancialProgress() : 0).append("%.\n");
        } 
        
        if (msg.contains("progress") || msg.contains("physical progress") || msg.contains("status")) {
            understood = true;
            sources.add("FACT");
            reply.append("The physical progress is ").append(project.getPhysicalProgress() != null ? project.getPhysicalProgress() : 0).append("%. ");
            reply.append("The financial progress is ").append(project.getFinancialProgress() != null ? project.getFinancialProgress() : 0).append("%.\n");
            reply.append("The overall status is marked as ").append(project.getStatus() != null ? project.getStatus() : "UNKNOWN").append(".\n");
        }

        if (!understood) {
            return new ChatResponse("I couldn't understand the request. Please rephrase it.", List.of());
        }

        return new ChatResponse(reply.toString().trim(), sources);
    }
}
