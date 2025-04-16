package shadowshift.studio.apigatewaycompressionranksystem.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

/**
 * Контроллер для обработки fallback запросов.
 * Предоставляет альтернативные ответы в случае недоступности целевых сервисов.
 */
@RestController
@RequestMapping("/fallback")
public class FallbackController {

    private static final Logger logger = LoggerFactory.getLogger(FallbackController.class);

    /**
     * Обрабатывает fallback для сервиса хранения изображений.
     *
     * @param exchange серверный веб-обмен
     * @return ответ с информацией о недоступности сервиса
     */
    @GetMapping("/image-storage")
    public Mono<ResponseEntity<Map<String, Object>>> imageStorageFallback(ServerWebExchange exchange) {
        logger.warn("Fallback activated for image storage service. Original path: {}",
                exchange.getRequest().getPath());
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "error");
        response.put("message", "Сервис хранения изображений временно недоступен");
        response.put("code", "SERVICE_UNAVAILABLE");
        response.put("timestamp", System.currentTimeMillis());
        
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .contentType(MediaType.APPLICATION_JSON)
                .body(response));
    }

    /**
     * Обрабатывает fallback для сервиса сжатия.
     *
     * @param exchange серверный веб-обмен
     * @return ответ с информацией о недоступности сервиса
     */
    @GetMapping("/compression")
    public Mono<ResponseEntity<Map<String, Object>>> compressionFallback(ServerWebExchange exchange) {
        logger.warn("Fallback activated for compression service. Original path: {}",
                exchange.getRequest().getPath());
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "error");
        response.put("message", "Сервис сжатия изображений временно недоступен");
        response.put("code", "SERVICE_UNAVAILABLE");
        response.put("timestamp", System.currentTimeMillis());
        
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .contentType(MediaType.APPLICATION_JSON)
                .body(response));
    }

    /**
     * Обрабатывает fallback для метрик.
     *
     * @return ответ с заглушкой для метрик
     */
    @GetMapping("/metrics")
    public Mono<ResponseEntity<Map<String, Object>>> metricsFallback() {
        logger.warn("Fallback activated for metrics endpoint");
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "degraded");
        response.put("message", "Данные метрик временно недоступны");
        response.put("timestamp", System.currentTimeMillis());
        
        // Заглушка для базовых метрик
        Map<String, Object> mockMetrics = new HashMap<>();
        mockMetrics.put("total_images", -1);
        mockMetrics.put("compressed_images", -1);
        mockMetrics.put("status", "degraded");
        
        response.put("metrics", mockMetrics);
        
        return Mono.just(ResponseEntity.status(HttpStatus.OK)
                .contentType(MediaType.APPLICATION_JSON)
                .body(response));
    }

    /**
     * Общий fallback для всех внутренних ошибок.
     *
     * @return универсальный ответ об ошибке
     */
    @GetMapping("/internal/**")
    public Mono<ResponseEntity<Map<String, Object>>> internalFallback(ServerWebExchange exchange) {
        logger.error("Internal fallback activated. Path: {}", exchange.getRequest().getPath());
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "error");
        response.put("message", "Произошла внутренняя ошибка");
        response.put("code", "INTERNAL_ERROR");
        response.put("timestamp", System.currentTimeMillis());
        response.put("path", exchange.getRequest().getPath().value());
        
        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_JSON)
                .body(response));
    }
}