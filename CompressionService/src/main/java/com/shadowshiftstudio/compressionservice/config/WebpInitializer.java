package com.shadowshiftstudio.compressionservice.config;

import com.shadowshiftstudio.compressionservice.util.webp.CWebp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Initializes WebP binary at application startup
 */
@Configuration
public class WebpInitializer {
    
    private static final Logger log = LoggerFactory.getLogger(WebpInitializer.class);
    
    @Bean
    public CommandLineRunner initializeWebp() {
        return args -> {
            log.info("Initializing WebP binary...");
            try {
                // Creating a CWebp instance will trigger the static initialization
                // which will download the binary if it's not available
                new CWebp();
                log.info("WebP binary initialized successfully");
            } catch (Exception e) {
                log.error("Failed to initialize WebP binary", e);
            }
        };
    }
}