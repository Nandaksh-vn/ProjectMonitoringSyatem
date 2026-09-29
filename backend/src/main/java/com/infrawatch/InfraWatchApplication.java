package com.infrawatch;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
@EnableScheduling
public class InfraWatchApplication {

    public static void main(String[] args) {
        SpringApplication.run(InfraWatchApplication.class, args);
    }

    /**
     * Shared client for ML service calls.
     *
     * <p>Timeouts are mandatory here: without them a stalled ML container holds the
     * caller thread indefinitely, because {@code RestTemplate} defaults to an
     * infinite connect and read timeout.
     */
    @Bean
    public RestTemplate restTemplate(
            @Value("${ml.service.connect-timeout-ms:3000}") int connectTimeoutMs,
            @Value("${ml.service.read-timeout-ms:15000}") int readTimeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeoutMs);
        factory.setReadTimeout(readTimeoutMs);
        return new RestTemplate(factory);
    }
}
