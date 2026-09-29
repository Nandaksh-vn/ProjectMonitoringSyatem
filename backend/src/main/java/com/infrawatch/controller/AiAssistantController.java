package com.infrawatch.controller;

import com.infrawatch.dto.ChatRequest;
import com.infrawatch.dto.ChatResponse;
import com.infrawatch.service.AiAssistantService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/assistant")
public class AiAssistantController {

    public AiAssistantController(AiAssistantService aiAssistantService) {
        this.aiAssistantService = aiAssistantService;
    }


    private final AiAssistantService aiAssistantService;

    @PostMapping("/chat")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        try {
            ChatResponse response = aiAssistantService.processChat(request);
            if (response.getError() != null) {
                return ResponseEntity.badRequest().body(response);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ChatResponse("An error occurred while communicating with the AI service: " + e.getMessage()));
        }
    }
}
