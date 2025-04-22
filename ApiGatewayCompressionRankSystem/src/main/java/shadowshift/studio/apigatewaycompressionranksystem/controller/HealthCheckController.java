package shadowshift.studio.apigatewaycompressionranksystem.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Контроллер для проверки состояния системы и подключенных сервисов.
 * Позволяет мониторить доступность всех компонентов системы из единой точки.
 */
@RestController
@RequestMapping("/api/system")
public class HealthCheckController {

    private static final Logger logger = LoggerFactory.getLogger(HealthCheckController.class);
    private final WebClient webClient;

    @Value("${IMAGE_STORAGE_SERVICE_URL:http://localhost:8081}")
    private String imageStorageServiceUrl;

    @Value("${COMPRESSION_SERVICE_URL:http://localhost:8080}")
    private String compressionServiceUrl;

    /**
     * Конструктор контроллера.
     */
    public HealthCheckController() {
        this.webClient = WebClient.builder()
                .codecs(configurer -> configurer
                        .defaultCodecs()
                        .maxInMemorySize(16 * 1024 * 1024))
                .build();
    }

    /**
     * Проверяет состояние всех компонентов системы.
     * Делает запросы к микросервисам и собирает информацию о их доступности.
     *
     * @return информация о состоянии системы
     */
    @GetMapping("/health")
    public Mono<ResponseEntity<Map<String, Object>>> checkSystemHealth() {
        Map<String, Object> result = new HashMap<>();
        result.put("status", "UP");
        result.put("gateway", "UP");
        result.put("timestamp", System.currentTimeMillis());

        Mono<Object> imageStorageCheck = webClient.get()
                .uri(imageStorageServiceUrl + "/actuator/health")
                .retrieve()
                .bodyToMono(Object.class)
                .timeout(Duration.ofSeconds(5))
                .doOnNext(response -> result.put("imageStorageService", Map.of("status", "UP", "details", response)))
                .onErrorResume(e -> {
                    logger.warn("Сервис хранения изображений недоступен: {}", e.getMessage());
                    result.put("imageStorageService", Map.of("status", "DOWN", "error", e.getMessage()));
                    return Mono.empty();
                });

        Mono<Object> compressionCheck = webClient.get()
                .uri(compressionServiceUrl + "/actuator/health")
                .retrieve()
                .bodyToMono(Object.class)
                .timeout(Duration.ofSeconds(5))
                .doOnNext(response -> result.put("compressionService", Map.of("status", "UP", "details", response)))
                .onErrorResume(e -> {
                    logger.warn("Сервис сжатия недоступен: {}", e.getMessage());
                    result.put("compressionService", Map.of("status", "DOWN", "error", e.getMessage()));
                    return Mono.empty();
                });

        return Mono.zip(
                        imageStorageCheck.defaultIfEmpty("unavailable"),
                        compressionCheck.defaultIfEmpty("unavailable"))
                .then(Mono.defer(() -> {
                    boolean anyServiceDown = result.entrySet().stream()
                            .filter(entry -> entry.getKey().endsWith("Service"))
                            .map(entry -> ((Map<?, ?>) entry.getValue()).get("status"))
                            .anyMatch("DOWN"::equals);
                    
                    if (anyServiceDown) {
                        result.put("status", "DEGRADED");
                    }

                    return Mono.just(ResponseEntity.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(result));
                }))
                .onErrorReturn(ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of(
                                "status", "ERROR",
                                "message", "Ошибка при проверке состояния системы",
                                "timestamp", System.currentTimeMillis()
                        )));
    }

    /**
     * Предоставляет информацию о версиях и конфигурации API Gateway и микросервисов.
     *
     * @return информация о версиях системы
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getSystemInfo() {
        Map<String, Object> result = new HashMap<>();
        
        result.put("gateway", Map.of(
                "name", "API Gateway",
                "version", "1.0.0",
                "description", "Шлюз API для системы CompressRank"
        ));
        
        result.put("services", Map.of(
                "imageStorage", Map.of(
                        "name", "Image Storage Service",
                        "url", imageStorageServiceUrl,
                        "endpointPrefix", "/api/images"
                ),
                "compression", Map.of(
                        "name", "Compression Service",
                        "url", compressionServiceUrl,
                        "endpointPrefix", "/api/compression"
                )
        ));
        
        result.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(result);
    }
}