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
    
    /**
     * Set manga preview image (proxy request to storage service)
     */
    @PutMapping(value = "/{id}/preview-image/{imageId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> setMangaPreviewImage(
            @PathVariable String id,
            @PathVariable String imageId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Setting preview image {} for manga {}", imageId, id);
        
        return webClient.put()
                .uri("/api/manga/{id}/preview-image/{imageId}", id, imageId)
                .header("Authorization", authHeader != null ? authHeader : "")
                .retrieve()
                .bodyToMono(Object.class)
                .map(response -> {
                    logger.info("Preview image set successfully for manga {}", id);
                    return ResponseEntity.ok(response);
                })
                .onErrorResume(WebClientResponseException.class, e -> {
                    logger.error("Error setting preview image for manga {}: {}, Response: {}", 
                            id, e.getMessage(), e.getResponseBodyAsString());
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()));
                })
                .onErrorResume(Exception.class, e -> {
                    logger.error("Unexpected error setting preview image: {}", e.getMessage(), e);
                    return Mono.just(ResponseEntity
                            .status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "Internal Server Error", "message", e.getMessage())));
                });
    }
    
    /**
     * Создание нового тома манги (проксирование запроса к сервису хранения)
     */
    @PostMapping(value = "/volumes/{mangaId}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> createVolume(
            @PathVariable String mangaId,
            @RequestBody String volumeData,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Received create volume request for manga ID: {}", mangaId);
        logger.debug("Volume data: {}", volumeData);
        
        return webClient.post()
                .uri("/api/manga/volumes/{mangaId}", mangaId)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", authHeader != null ? authHeader : "")
                .bodyValue(volumeData)
                .retrieve()
                .bodyToMono(Object.class)
                .map(response -> {
                    logger.info("Volume creation successful for manga ID: {}", mangaId);
                    return ResponseEntity.status(HttpStatus.CREATED).body(response);
                })
                .onErrorResume(WebClientResponseException.class, e -> {
                    logger.error("Error forwarding volume creation request: {} - Response body: {}, Manga ID: {}", 
                                e.getMessage(), e.getResponseBodyAsString(), mangaId);
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()));
                })
                .onErrorResume(Exception.class, e -> {
                    logger.error("Unexpected error in volume creation: {}", e.getMessage(), e);
                    return Mono.just(ResponseEntity
                            .status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "Internal Server Error", "message", e.getMessage())));
                });
    }
    
    /**
     * Получение тома манги по ID (проксирование запроса к сервису хранения)
     */
    @GetMapping(value = "/volumes/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> getVolume(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "false") boolean includeChapters,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Fetching volume with id: {}, includeChapters: {}", id, includeChapters);
        
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/manga/volumes/{id}")
                        .queryParam("includeChapters", includeChapters)
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
     * Получение томов манги по ID манги (проксирование запроса к сервису хранения)
     */
    @GetMapping(value = "/volumes/manga/{mangaId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> getVolumesByMangaId(
            @PathVariable String mangaId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Fetching volumes for manga id: {}", mangaId);
        
        return webClient.get()
                .uri("/api/manga/volumes/manga/{mangaId}", mangaId)
                .header("Authorization", authHeader != null ? authHeader : "")
                .retrieve()
                .bodyToMono(Object.class)
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.class, e -> {
                    logger.error("Error fetching volumes for manga {}: {}", mangaId, e.getMessage());
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()));
                });
    }
    
    /**
     * Обновление тома манги (проксирование запроса к сервису хранения)
     */
    @PutMapping(value = "/volumes/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> updateVolume(
            @PathVariable String id,
            @RequestBody String volumeData,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Updating volume with id: {}", id);
        
        return webClient.put()
                .uri("/api/manga/volumes/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", authHeader != null ? authHeader : "")
                .bodyValue(volumeData)
                .retrieve()
                .bodyToMono(Object.class)
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.class, e -> {
                    logger.error("Error updating volume {}: {}", id, e.getMessage());
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()));
                });
    }
    
    /**
     * Удаление тома манги (проксирование запроса к сервису хранения)
     */
    @DeleteMapping("/volumes/{id}")
    public Mono<ResponseEntity<Void>> deleteVolume(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Deleting volume with id: {}", id);
        
        return webClient.delete()
                .uri("/api/manga/volumes/{id}", id)
                .header("Authorization", authHeader != null ? authHeader : "")
                .retrieve()
                .bodyToMono(Void.class)
                .then(Mono.just(ResponseEntity.noContent().<Void>build()))
                .onErrorResume(WebClientResponseException.class, e -> {
                    logger.error("Error deleting volume {}: {}", id, e.getMessage());
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .<Void>build());
                });
    }
    
    /**
     * Установка обложки для тома манги (проксирование запроса к сервису хранения)
     */
    @PutMapping("/volumes/{id}/cover-image/{imageId}")
    public Mono<ResponseEntity<Object>> setVolumeCoverImage(
            @PathVariable String id,
            @PathVariable String imageId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Setting cover image {} for volume {}", imageId, id);
        
        return webClient.put()
                .uri("/api/manga/volumes/{id}/cover-image/{imageId}", id, imageId)
                .header("Authorization", authHeader != null ? authHeader : "")
                .retrieve()
                .bodyToMono(Object.class)
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.class, e -> {
                    logger.error("Error setting cover image for volume {}: {}", id, e.getMessage());
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()));
                });
    }
    
    /**
     * Создание новой главы манги (проксирование запроса к сервису хранения)
     */
    @PostMapping(value = "/chapters/{volumeId}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> createChapter(
            @PathVariable String volumeId,
            @RequestBody String chapterData,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Received create chapter request for volume ID: {}", volumeId);
        logger.debug("Chapter data: {}", chapterData);
        
        return webClient.post()
                .uri("/api/manga/chapters/{volumeId}", volumeId)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", authHeader != null ? authHeader : "")
                .bodyValue(chapterData)
                .retrieve()
                .bodyToMono(Object.class)
                .map(response -> {
                    logger.info("Chapter creation successful for volume ID: {}", volumeId);
                    return ResponseEntity.status(HttpStatus.CREATED).body(response);
                })
                .onErrorResume(WebClientResponseException.class, e -> {
                    logger.error("Error forwarding chapter creation request: {} - Response body: {}, Volume ID: {}", 
                                e.getMessage(), e.getResponseBodyAsString(), volumeId);
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()));
                })
                .onErrorResume(Exception.class, e -> {
                    logger.error("Unexpected error in chapter creation: {}", e.getMessage(), e);
                    return Mono.just(ResponseEntity
                            .status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "Internal Server Error", "message", e.getMessage())));
                });
    }
    
    /**
     * Получение главы манги по ID (проксирование запроса к сервису хранения)
     */
    @GetMapping(value = "/chapters/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> getChapter(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "false") boolean includePages,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Fetching chapter with id: {}, includePages: {}", id, includePages);
        
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/manga/chapters/{id}")
                        .queryParam("includePages", includePages)
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
     * Получение глав манги по ID тома (проксирование запроса к сервису хранения)
     */
    @GetMapping(value = "/chapters/volume/{volumeId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> getChaptersByVolumeId(
            @PathVariable String volumeId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Fetching chapters for volume id: {}", volumeId);
        
        return webClient.get()
                .uri("/api/manga/chapters/volume/{volumeId}", volumeId)
                .header("Authorization", authHeader != null ? authHeader : "")
                .retrieve()
                .bodyToMono(Object.class)
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.class, e -> {
                    logger.error("Error fetching chapters for volume {}: {}", volumeId, e.getMessage());
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()));
                });
    }
    
    /**
     * Получение глав манги по ID манги (проксирование запроса к сервису хранения)
     */
    @GetMapping(value = "/chapters/manga/{mangaId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> getChaptersByMangaId(
            @PathVariable String mangaId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Fetching chapters for manga id: {}", mangaId);
        
        return webClient.get()
                .uri("/api/manga/chapters/manga/{mangaId}", mangaId)
                .header("Authorization", authHeader != null ? authHeader : "")
                .retrieve()
                .bodyToMono(Object.class)
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.class, e -> {
                    logger.error("Error fetching chapters for manga {}: {}", mangaId, e.getMessage());
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()));
                });
    }
    
    /**
     * Обновление главы манги (проксирование запроса к сервису хранения)
     */
    @PutMapping(value = "/chapters/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> updateChapter(
            @PathVariable String id,
            @RequestBody String chapterData,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Updating chapter with id: {}", id);
        
        return webClient.put()
                .uri("/api/manga/chapters/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", authHeader != null ? authHeader : "")
                .bodyValue(chapterData)
                .retrieve()
                .bodyToMono(Object.class)
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.class, e -> {
                    logger.error("Error updating chapter {}: {}", id, e.getMessage());
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()));
                });
    }
    
    /**
     * Удаление главы манги (проксирование запроса к сервису хранения)
     */
    @DeleteMapping("/chapters/{id}")
    public Mono<ResponseEntity<Void>> deleteChapter(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Deleting chapter with id: {}", id);
        
        return webClient.delete()
                .uri("/api/manga/chapters/{id}", id)
                .header("Authorization", authHeader != null ? authHeader : "")
                .retrieve()
                .bodyToMono(Void.class)
                .then(Mono.just(ResponseEntity.noContent().<Void>build()))
                .onErrorResume(WebClientResponseException.class, e -> {
                    logger.error("Error deleting chapter {}: {}", id, e.getMessage());
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .<Void>build());
                });
    }
    
    /**
     * Получение страницы манги по ID (проксирование запроса к сервису хранения)
     */
    @GetMapping(value = "/pages/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> getPage(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Fetching page with id: {}", id);
        
        return webClient.get()
                .uri("/api/manga/pages/{id}", id)
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
     * Получение страниц манги по ID главы (проксирование запроса к сервису хранения)
     */
    @GetMapping(value = "/pages/chapter/{chapterId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> getPagesByChapterId(
            @PathVariable String chapterId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Fetching pages for chapter id: {}", chapterId);
        
        return webClient.get()
                .uri("/api/manga/pages/chapter/{chapterId}", chapterId)
                .header("Authorization", authHeader != null ? authHeader : "")
                .retrieve()
                .bodyToMono(Object.class)
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.class, e -> {
                    logger.error("Error fetching pages for chapter {}: {}", chapterId, e.getMessage());
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()));
                });
    }
    
    /**
     * Создание страницы манги (проксирование запроса к сервису хранения)
     */
    @PostMapping(value = "/pages/{chapterId}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> createPage(
            @PathVariable String chapterId,
            @RequestBody String pageData,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Received create page request for chapter ID: {}", chapterId);
        
        return webClient.post()
                .uri("/api/manga/pages/{chapterId}", chapterId)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", authHeader != null ? authHeader : "")
                .bodyValue(pageData)
                .retrieve()
                .bodyToMono(Object.class)
                .map(response -> {
                    logger.info("Page creation successful for chapter ID: {}", chapterId);
                    return ResponseEntity.status(HttpStatus.CREATED).body(response);
                })
                .onErrorResume(WebClientResponseException.class, e -> {
                    logger.error("Error forwarding page creation request: {} - Response body: {}, Chapter ID: {}", 
                                e.getMessage(), e.getResponseBodyAsString(), chapterId);
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()));
                });
    }
    
    /**
     * Обновление страницы манги (проксирование запроса к сервису хранения)
     */
    @PutMapping(value = "/pages/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> updatePage(
            @PathVariable String id,
            @RequestBody String pageData,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Updating page with id: {}", id);
        
        return webClient.put()
                .uri("/api/manga/pages/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", authHeader != null ? authHeader : "")
                .bodyValue(pageData)
                .retrieve()
                .bodyToMono(Object.class)
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.class, e -> {
                    logger.error("Error updating page {}: {}", id, e.getMessage());
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()));
                });
    }
    
    /**
     * Удаление страницы манги (проксирование запроса к сервису хранения)
     */
    @DeleteMapping("/pages/{id}")
    public Mono<ResponseEntity<Void>> deletePage(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Deleting page with id: {}", id);
        
        return webClient.delete()
                .uri("/api/manga/pages/{id}", id)
                .header("Authorization", authHeader != null ? authHeader : "")
                .retrieve()
                .bodyToMono(Void.class)
                .then(Mono.just(ResponseEntity.noContent().<Void>build()))
                .onErrorResume(WebClientResponseException.class, e -> {
                    logger.error("Error deleting page {}: {}", id, e.getMessage());
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .<Void>build());
                });
    }
    
    /**
     * Изменение порядка страниц (проксирование запроса к сервису хранения)
     */
    @PutMapping(value = "/pages/reorder/{chapterId}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Object>> reorderPages(
            @PathVariable String chapterId,
            @RequestBody String pageIdsData,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Reordering pages for chapter id: {}", chapterId);
        
        return webClient.put()
                .uri("/api/manga/pages/reorder/{chapterId}", chapterId)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", authHeader != null ? authHeader : "")
                .bodyValue(pageIdsData)
                .retrieve()
                .bodyToMono(Object.class)
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.class, e -> {
                    logger.error("Error reordering pages for chapter {}: {}", chapterId, e.getMessage());
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()));
                });
    }
}