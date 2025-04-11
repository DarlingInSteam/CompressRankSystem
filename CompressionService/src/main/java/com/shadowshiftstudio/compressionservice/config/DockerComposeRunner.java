package com.shadowshiftstudio.compressionservice.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationStartedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;

@Component
public class DockerComposeRunner implements ApplicationListener<ApplicationStartedEvent> {
    
    private final Logger logger = LoggerFactory.getLogger(DockerComposeRunner.class);
    
    @Override
    public void onApplicationEvent(ApplicationStartedEvent event) {
        try {
            startDockerCompose();
        } catch (Exception e) {
            logger.error("Failed to start Docker Compose", e);
        }
    }
    
    private void startDockerCompose() throws IOException, InterruptedException {
        File dockerComposeFile = new File("docker-compose.yml");
        if (!dockerComposeFile.exists()) {
            logger.warn("docker-compose.yml not found in the current directory");
            dockerComposeFile = new File("CompressionService/docker-compose.yml");
            if (!dockerComposeFile.exists()) {
                logger.error("docker-compose.yml not found");
                return;
            }
        }
        
        String dockerComposeDirectory = dockerComposeFile.getParent() != null ? dockerComposeFile.getParent() : ".";
        
        logger.info("Starting Docker Compose from directory: " + dockerComposeDirectory);
        
        ProcessBuilder processBuilder = new ProcessBuilder("docker-compose", "up", "-d");
        processBuilder.directory(new File(dockerComposeDirectory));
        processBuilder.redirectErrorStream(true);
        
        Process process = processBuilder.start();
        
        // Читаем вывод команды
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                logger.info("Docker Compose: " + line);
            }
        }
        
        int exitCode = process.waitFor();
        if (exitCode == 0) {
            logger.info("Docker Compose started successfully");
        } else {
            logger.error("Docker Compose failed to start with exit code: " + exitCode);
        }
    }
}