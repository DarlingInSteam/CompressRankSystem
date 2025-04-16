package shadowshift.studio.apigatewaycompressionranksystem.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import shadowshift.studio.apigatewaycompressionranksystem.model.ApiModels;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Контроллер для представления информации об API Gateway и доступных эндпоинтах.
 * Предоставляет структурированное описание API для разработчиков и пользователей системы.
 */
@RestController
@RequestMapping("/api/docs")
@Tag(name = "API Documentation", description = "Документация API Gateway и доступных микросервисов")
public class ApiDocController {

    private final RouteLocator routeLocator;
    
    @Value("${IMAGE_STORAGE_SERVICE_URL:http://localhost:8081}")
    private String imageStorageServiceUrl;

    @Value("${COMPRESSION_SERVICE_URL:http://localhost:8080}")
    private String compressionServiceUrl;

    /**
     * Создает новый экземпляр контроллера документации API.
     *
     * @param routeLocator локатор маршрутов для извлечения информации о настроенных маршрутах
     */
    public ApiDocController(RouteLocator routeLocator) {
        this.routeLocator = routeLocator;
    }

    /**
     * Предоставляет обзор доступных API эндпоинтов.
     *
     * @return информация о доступных API эндпоинтах
     */
    @Operation(summary = "Получить обзор доступных API", description = "Возвращает детальное описание всех доступных API эндпоинтов в системе")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Успешное получение информации об API",
                    content = @Content(mediaType = "application/json"))
    })
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> getApiDocumentation() {
        return Flux.fromIterable(getApiEndpoints())
                .collectMap(ApiEndpoint::getService, endpoint -> {
                    Map<String, Object> endpointInfo = new HashMap<>();
                    endpointInfo.put("baseUrl", endpoint.getBaseUrl());
                    endpointInfo.put("endpoints", endpoint.getEndpoints());
                    return endpointInfo;
                })
                .map(serviceEndpoints -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("apiGateway", Map.of(
                            "name", "CompressRank API Gateway",
                            "version", "1.0",
                            "baseUrl", "http://localhost:8082"
                    ));
                    response.put("services", serviceEndpoints);
                    
                    // Добавляем информацию о маршрутах
                    List<Map<String, String>> routes = new ArrayList<>();
                    routeLocator.getRoutes().subscribe(route -> 
                            routes.add(Map.of(
                                    "id", route.getId(),
                                    "uri", route.getUri().toString(),
                                    "predicates", route.getPredicate().toString()
                            ))
                    );
                    response.put("routes", routes);
                    
                    return ResponseEntity.ok(response);
                });
    }

    /**
     * Возвращает детальное описание API для сервиса хранения изображений.
     *
     * @return описание API сервиса хранения изображений
     */
    @Operation(summary = "Получить документацию API сервиса хранения изображений", 
            description = "Возвращает детальное описание API эндпоинтов сервиса хранения изображений")
    @GetMapping(value = "/image-storage", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> getImageStorageApiDocs() {
        ApiEndpoint imageStorageApi = getApiEndpoints().stream()
                .filter(endpoint -> endpoint.getService().equals("imageStorage"))
                .findFirst()
                .orElse(null);
        
        if (imageStorageApi == null) {
            return ResponseEntity.notFound().build();
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("service", "Image Storage Service");
        response.put("baseUrl", imageStorageApi.getBaseUrl());
        response.put("endpoints", imageStorageApi.getEndpoints());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Возвращает детальное описание API для сервиса сжатия.
     *
     * @return описание API сервиса сжатия
     */
    @Operation(summary = "Получить документацию API сервиса сжатия", 
            description = "Возвращает детальное описание API эндпоинтов сервиса сжатия")
    @GetMapping(value = "/compression", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> getCompressionApiDocs() {
        ApiEndpoint compressionApi = getApiEndpoints().stream()
                .filter(endpoint -> endpoint.getService().equals("compression"))
                .findFirst()
                .orElse(null);
        
        if (compressionApi == null) {
            return ResponseEntity.notFound().build();
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("service", "Compression Service");
        response.put("baseUrl", compressionApi.getBaseUrl());
        response.put("endpoints", compressionApi.getEndpoints());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Возвращает список доступных API эндпоинтов.
     *
     * @return список эндпоинтов API
     */
    private List<ApiEndpoint> getApiEndpoints() {
        List<ApiEndpoint> endpoints = new ArrayList<>();

        // Сервис хранения изображений
        ApiEndpoint imageStorage = new ApiEndpoint("imageStorage", imageStorageServiceUrl, "/api/images");
        imageStorage.addEndpoint("GET", "/api/images", "Получение списка всех изображений");
        imageStorage.addEndpoint("GET", "/api/images/{id}", "Получение конкретного изображения по ID");
        imageStorage.addEndpoint("GET", "/api/images/{id}/metadata", "Получение метаданных изображения");
        imageStorage.addEndpoint("POST", "/api/images", "Загрузка нового изображения");
        imageStorage.addEndpoint("DELETE", "/api/images/{id}", "Удаление изображения");
        imageStorage.addEndpoint("GET", "/api/images/statistics", "Получение статистики по изображениям");
        imageStorage.addEndpoint("GET", "/api/images/{id}/statistics", "Получение статистики по конкретному изображению");
        endpoints.add(imageStorage);

        // Сервис сжатия изображений
        ApiEndpoint compression = new ApiEndpoint("compression", compressionServiceUrl, "/api/compression");
        compression.addEndpoint("POST", "/api/compression/{id}", "Сжатие изображения");
        compression.addEndpoint("POST", "/api/compression/{id}/restore", "Восстановление оригинала изображения");
        compression.addEndpoint("GET", "/api/compression/{id}/original-size", "Получение размера оригинального изображения");
        endpoints.add(compression);

        // API Gateway
        ApiEndpoint gateway = new ApiEndpoint("gateway", "http://localhost:8082", "/api");
        gateway.addEndpoint("GET", "/api/system/health", "Проверка здоровья всей системы");
        gateway.addEndpoint("GET", "/api/system/info", "Информация о системе и версиях");
        gateway.addEndpoint("GET", "/api/docs", "Документация API");
        gateway.addEndpoint("GET", "/api/metrics/aggregated", "Агрегированные метрики по всем сервисам");
        endpoints.add(gateway);

        return endpoints;
    }

    /**
     * Внутренний класс для представления API эндпоинта.
     * Содержит информацию о сервисе и его эндпоинтах.
     */
    private static class ApiEndpoint {
        private final String service;
        private final String baseUrl;
        private final String baseEndpoint;
        private final List<Map<String, String>> endpoints = new ArrayList<>();

        public ApiEndpoint(String service, String baseUrl, String baseEndpoint) {
            this.service = service;
            this.baseUrl = baseUrl;
            this.baseEndpoint = baseEndpoint;
        }

        public void addEndpoint(String method, String path, String description) {
            Map<String, String> endpoint = new HashMap<>();
            endpoint.put("method", method);
            endpoint.put("path", path);
            endpoint.put("description", description);
            endpoints.add(endpoint);
        }

        public String getService() {
            return service;
        }

        public String getBaseUrl() {
            return baseUrl;
        }

        public String getBaseEndpoint() {
            return baseEndpoint;
        }

        public List<Map<String, String>> getEndpoints() {
            return endpoints;
        }
    }
}