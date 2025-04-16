package com.shadowshiftstudio.compressionservice.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Configuration
@Primary
public class RemoteStorageConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(RemoteStorageConfig.class);
    
    public RemoteStorageConfig() {
        logger.info("Инициализирована конфигурация удаленного хранилища. CompressionService будет использовать RemoteImageStorageService.");
    }
}