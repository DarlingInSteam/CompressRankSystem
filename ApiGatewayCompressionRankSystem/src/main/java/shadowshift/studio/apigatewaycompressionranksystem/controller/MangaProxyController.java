package shadowshift.studio.apigatewaycompressionranksystem.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Контроллер-прокси для обработки запросов к API манги.
 * Предназначен для обхода проблем с маршрутизацией через Spring Cloud Gateway.
 */
@RestController
@RequestMapping("/api/manga")
public class MangaProxyController {

    private static final Logger logger = LoggerFactory.getLogger(MangaProxyController.class);
    private final WebClient webClient;
    
    public MangaProxyController(@Value("${IMAGE_STORAGE_SERVICE_URL:http://localhost:8081}") String imageStorageServiceUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(imageStorageServiceUrl)
                .build();
        logger.info("MangaProxyController initialized with image storage URL: {}", imageStorageServiceUrl);
    }
    
    /**
     * Создание новой манги (проксирование запроса к сервису хранения)
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> createManga(
            @RequestBody String mangaData,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Received create manga request: {}", mangaData);
        
        // Enhanced logging for request troubleshooting
        logger.debug("Request headers: Authorization present: {}", (authHeader != null && !authHeader.isEmpty()));
        
        return webClient.post()
                .uri("/api/manga")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", authHeader != null ? authHeader : "")
                .bodyValue(mangaData) // Pass the raw JSON string directly
                .retrieve()
                .bodyToMono(Object.class)
                .map(response -> {
                    logger.info("Manga creation successful");
                    return ResponseEntity.status(HttpStatus.CREATED).body(response);
                })
                .onErrorResume(WebClientResponseException.class, e -> {
                    logger.error("Error forwarding manga creation request: {} - Response body: {}, Request body: {}", 
                                e.getMessage(), e.getResponseBodyAsString(), mangaData);
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()));
                })
                .onErrorResume(Exception.class, e -> {
                    logger.error("Unexpected error in manga creation: {}", e.getMessage(), e);
                    return Mono.just(ResponseEntity
                            .status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "Internal Server Error", "message", e.getMessage())));
                });
    }
    
    /**
     * Получение списка манг (проксирование запроса к сервису хранения)
     */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> getAllMangas(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sort", defaultValue = "createdAt") String sort,
            @RequestParam(value = "direction", defaultValue = "desc") String direction,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Fetching all mangas, page: {}, size: {}", page, size);
        
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/manga")
                        .queryParam("page", page)
                        .queryParam("size", size)
                        .queryParam("sort", sort)
                        .queryParam("direction", direction)
                        .build())
                .header("Authorization", authHeader != null ? authHeader : "")
                .retrieve()
                .bodyToMono(Object.class)
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.class, e -> {
                    logger.error("Error fetching mangas: {}", e.getMessage());
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()));
                });
    }

    /**
     * Получение манги по ID (проксирование запроса к сервису хранения)
     */
    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> getManga(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "false") boolean includeVolumes,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Fetching manga with id: {}, includeVolumes: {}", id, includeVolumes);
        
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/manga/{id}")
                        .queryParam("includeVolumes", includeVolumes)
                        .build(id))
                .header("Authorization", authHeader != null ? authHeader : "")
                .retrieve()
                .bodyToMono(Object.class)
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.class, e -> {
                    if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                        return Mono.just(ResponseEntity.notFound().build());
                    }
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()));
                });
    }
    
    /**
     * Обновление манги (проксирование запроса к сервису хранения)
     */
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> updateManga(
            @PathVariable String id,
            @RequestBody Map<String, Object> mangaData,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Updating manga with id: {}", id);
        
        return webClient.put()
                .uri("/api/manga/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", authHeader != null ? authHeader : "")
                .bodyValue(mangaData)
                .retrieve()
                .bodyToMono(Object.class)
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.class, e -> {
                    if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                        return Mono.just(ResponseEntity.notFound().build());
                    }
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()));
                });
    }
    
    /**
     * Удаление манги (проксирование запроса к сервису хранения)
     */
    @DeleteMapping(value = "/{id}")
    public Mono<ResponseEntity<Void>> deleteManga(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Deleting manga with id: {}", id);
        
        return webClient.delete()
                .uri("/api/manga/{id}", id)
                .header("Authorization", authHeader != null ? authHeader : "")
                .retrieve()
                .bodyToMono(Void.class)
                .then(Mono.just(ResponseEntity.noContent().<Void>build()))
                .onErrorResume(WebClientResponseException.class, e -> {
                    if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                        return Mono.just(ResponseEntity.notFound().<Void>build());
                    }
                    logger.error("Error deleting manga: {}", e.getMessage());
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .<Void>build());
                });
    }
    
    /**
     * Получение опубликованных манг (проксирование запроса к сервису хранения)
     */
    @GetMapping(value = "/published", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> getPublishedMangas(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Fetching published mangas, page: {}, size: {}", page, size);
        
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/manga/published")
                        .queryParam("page", page)
                        .queryParam("size", size)
                        .build())
                .header("Authorization", authHeader != null ? authHeader : "")
                .retrieve()
                .bodyToMono(Object.class)
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.class, e -> {
                    logger.error("Error fetching published mangas: {}", e.getMessage());
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()));
                });
    }
    
    /**
     * Поиск манг по названию (проксирование запроса к сервису хранения)
     */
    @GetMapping(value = "/search", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> searchMangas(
            @RequestParam String query,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Searching mangas with query: {}", query);
        
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/manga/search")
                        .queryParam("query", query)
                        .queryParam("page", page)
                        .queryParam("size", size)
                        .build())
                .header("Authorization", authHeader != null ? authHeader : "")
                .retrieve()
                .bodyToMono(Object.class)
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.class, e -> {
                    logger.error("Error searching mangas: {}", e.getMessage());
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()));
                });
    }
}