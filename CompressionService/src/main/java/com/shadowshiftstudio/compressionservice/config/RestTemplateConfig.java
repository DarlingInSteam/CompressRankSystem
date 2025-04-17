package com.shadowshiftstudio.compressionservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Configuration class for RestTemplate bean
 */
@Configuration
public class RestTemplateConfig {

    /**
     * Creates a RestTemplate bean to be used for HTTP requests to other services
     * @return configured RestTemplate instance
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}