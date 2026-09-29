package com.infrawatch.dto;

import java.util.List;

public class ChatResponse {
    private String reply;
    private List<String> sources; // Sources like FACT, PREDICTION, RECOMMENDATION
    private String error;

    public ChatResponse() {}

    public ChatResponse(String reply, List<String> sources) {
        this.reply = reply;
        this.sources = sources;
    }
    
    public ChatResponse(String error) {
        this.error = error;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public List<String> getSources() {
        return sources;
    }

    public void setSources(List<String> sources) {
        this.sources = sources;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
