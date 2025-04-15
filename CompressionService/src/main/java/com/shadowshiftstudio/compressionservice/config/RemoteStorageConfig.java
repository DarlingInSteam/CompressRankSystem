package com.shadowshiftstudio.compressionservice.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

/**
 * Конфигурация для использования удаленного хранилища вместо прямого подключения к MinIO.
 * В этой архитектуре CompressionService взаимодействует с хранилищем только
 * через ImageStorageService API.
 */
@Configuration
@Primary
public class RemoteStorageConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(RemoteStorageConfig.class);
    
    public RemoteStorageConfig() {
        logger.info("Инициализирована конфигурация удаленного хранилища. CompressionService будет использовать RemoteImageStorageService.");
    }
}