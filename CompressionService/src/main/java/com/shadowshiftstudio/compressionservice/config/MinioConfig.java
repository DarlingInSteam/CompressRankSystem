package com.shadowshiftstudio.compressionservice.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.errors.MinioException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.retry.annotation.Retryable;

import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

@Configuration
@EnableRetry
@ConditionalOnProperty(name = "minio.direct.connection", havingValue = "true", matchIfMissing = false)
public class MinioConfig {

    private static final Logger logger = LoggerFactory.getLogger(MinioConfig.class);

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.accessKey}")
    private String accessKey;

    @Value("${minio.secretKey}")
    private String secretKey;

    @Value("${minio.bucket}")
    private String bucketName;

    @Bean
    @Retryable(value = Exception.class, maxAttempts = 10, backoff = @Backoff(delay = 3000))
    public MinioClient minioClient() throws MinioException, IOException,
            NoSuchAlgorithmException, InvalidKeyException {
        
        logger.info("Инициализация прямого подключения к MinIO endpoint: {}", endpoint);
        logger.warn("Прямое подключение к MinIO не рекомендуется. Используйте RemoteImageStorageService.");
        
        MinioClient minioClient = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
        
        try {
            boolean bucketExists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!bucketExists) {
                logger.info("Creating bucket: {}", bucketName);
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
                logger.info("Bucket created successfully: {}", bucketName);
            } else {
                logger.info("Bucket already exists: {}", bucketName);
            }
        } catch (Exception e) {
            logger.error("Error initializing MinIO bucket: {}", e.getMessage());
            throw e;
        }
        
        return minioClient;
    }
}