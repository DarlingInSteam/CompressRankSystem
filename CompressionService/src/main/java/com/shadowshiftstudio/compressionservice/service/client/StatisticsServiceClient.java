package com.shadowshiftstudio.compressionservice.service.client;

import com.shadowshiftstudio.compressionservice.messaging.StatisticsEvent;
import com.shadowshiftstudio.compressionservice.messaging.StatisticsEventSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Клиент для взаимодействия с микросервисом статистики
 */
@Service
public class StatisticsServiceClient {
    
    private static final Logger logger = LoggerFactory.getLogger(StatisticsServiceClient.class);
    
    private final RestTemplate restTemplate;
    private final StatisticsEventSender statisticsEventSender;
    
    @Value("${statistics.service.url:http://localhost:8083}")
    private String statisticsServiceUrl;
    
    @Autowired
    public StatisticsServiceClient(RestTemplate restTemplate, StatisticsEventSender statisticsEventSender) {
        this.restTemplate = restTemplate;
        this.statisticsEventSender = statisticsEventSender;
    }
    
    /**
     * Увеличивает счетчик просмотров изображения
     * @param imageId идентификатор изображения
     */
    public void incrementViewCount(String imageId) {
        try {
            statisticsEventSender.sendViewEvent(imageId);
        } catch (Exception e) {
            logger.error("Error incrementing view count: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Увеличивает счетчик скачиваний изображения
     * @param imageId идентификатор изображения
     */
    public void incrementDownloadCount(String imageId) {
        try {
            statisticsEventSender.sendDownloadEvent(imageId);
        } catch (Exception e) {
            logger.error("Error incrementing download count: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Получает статистику для всех изображений
     * @return карта со статистикой изображений
     */
    public Map<String, Map<String, Integer>> getAllImageStatistics() {
        try {
            String url = statisticsServiceUrl + "/api/statistics";
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            if (response.getBody() != null && response.getBody().containsKey("statistics")) {
                return (Map<String, Map<String, Integer>>) response.getBody().get("statistics");
            }
            
            return new HashMap<>();
        } catch (RestClientException e) {
            logger.error("Error retrieving image statistics: {}", e.getMessage(), e);
            return new HashMap<>();
        }
    }
    
    /**
     * Получает статистику для конкретного изображения
     * @param imageId идентификатор изображения
     * @return объект со статистикой
     */
    public Map<String, Integer> getImageStatistics(String imageId) {
        try {
            String url = statisticsServiceUrl + "/api/statistics/" + imageId;
            ResponseEntity<Map<String, Integer>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Integer>>() {}
            );
            
            if (response.getBody() != null) {
                return response.getBody();
            }
            
            return createEmptyStatistics();
        } catch (Exception e) {
            logger.error("Error retrieving statistics for image {}: {}", imageId, e.getMessage(), e);
            return createEmptyStatistics();
        }
    }
    
    /**
     * Получает список наиболее популярных изображений
     * @return список идентификаторов изображений, отсортированных по популярности
     */
    public List<String> getMostPopularImages() {
        try {
            String url = statisticsServiceUrl + "/api/statistics/popular";
            ResponseEntity<List<String>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<String>>() {}
            );
            
            if (response.getBody() != null) {
                return response.getBody();
            }
            
            return new ArrayList<>();
        } catch (Exception e) {
            logger.error("Error retrieving most popular images: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Получает список изображений, отсортированных по просмотрам
     * @return список идентификаторов изображений, отсортированных по просмотрам
     */
    public List<String> getMostViewedImages() {
        try {
            String url = statisticsServiceUrl + "/api/statistics/views";
            ResponseEntity<List<String>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<String>>() {}
            );
            
            if (response.getBody() != null) {
                return response.getBody();
            }
            
            return new ArrayList<>();
        } catch (Exception e) {
            logger.error("Error retrieving most viewed images: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Получает список изображений, отсортированных по скачиваниям
     * @return список идентификаторов изображений, отсортированных по скачиваниям
     */
    public List<String> getMostDownloadedImages() {
        try {
            String url = statisticsServiceUrl + "/api/statistics/downloads";
            ResponseEntity<List<String>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<String>>() {}
            );
            
            if (response.getBody() != null) {
                return response.getBody();
            }
            
            return new ArrayList<>();
        } catch (Exception e) {
            logger.error("Error retrieving most downloaded images: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    private Map<String, Integer> createEmptyStatistics() {
        Map<String, Integer> emptyStats = new HashMap<>();
        emptyStats.put("viewCount", 0);
        emptyStats.put("downloadCount", 0);
        return emptyStats;
    }
}