package shadowshift.studio.apigatewaycompressionranksystem.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.HashMap;
import java.util.Map;

/**
 * Контроллер для обработки запросов в случае недоступности микросервисов.
 * Используется совместно с механизмом Circuit Breaker для обработки отказов.
 */
@RestController
@RequestMapping("/fallback")
@Tag(name = "Fallback Controller", description = "API для обработки недоступности микросервисов")
public class FallbackController {

    /**
     * Обрабатывает запросы к сервису хранения изображений, когда он недоступен.
     */
    @GetMapping("/storage")
    @Operation(
        summary = "Запасной обработчик для сервиса хранения изображений",
        description = "Вызывается, когда сервис хранения изображений недоступен",
        responses = {
            @ApiResponse(responseCode = "503", description = "Сервис хранения изображений временно недоступен")
        }
    )
    public ResponseEntity<Map<String, String>> storageServiceFallback() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "error");
        response.put("message", "Сервис хранения изображений временно недоступен. Пожалуйста, повторите попытку позже.");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    /**
     * Обрабатывает запросы к сервису сжатия изображений, когда он недоступен.
     */
    @GetMapping("/compression")
    @Operation(
        summary = "Запасной обработчик для сервиса сжатия изображений",
        description = "Вызывается, когда сервис сжатия изображений недоступен",
        responses = {
            @ApiResponse(responseCode = "503", description = "Сервис сжатия изображений временно недоступен")
        }
    )
    public ResponseEntity<Map<String, String>> compressionServiceFallback() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "error");
        response.put("message", "Сервис сжатия изображений временно недоступен. Пожалуйста, повторите попытку позже.");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    /**
     * Обрабатывает запросы к сервису статистики и рейтингов, когда он недоступен.
     */
    @GetMapping("/statistics")
    @Operation(
        summary = "Запасной обработчик для сервиса статистики и рейтингов",
        description = "Вызывается, когда сервис статистики и рейтингов недоступен",
        responses = {
            @ApiResponse(responseCode = "503", description = "Сервис статистики и рейтингов временно недоступен")
        }
    )
    public ResponseEntity<Map<String, String>> statisticsServiceFallback() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "error");
        response.put("message", "Сервис статистики и рейтингов временно недоступен. Пожалуйста, повторите попытку позже.");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    /**
     * Обрабатывает запросы к сервису аутентификации, когда он недоступен.
     */
    @GetMapping("/auth")
    @Operation(
        summary = "Запасной обработчик для сервиса аутентификации",
        description = "Вызывается, когда сервис аутентификации недоступен",
        responses = {
            @ApiResponse(responseCode = "503", description = "Сервис аутентификации временно недоступен")
        }
    )
    public ResponseEntity<Map<String, String>> authServiceFallback() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "error");
        response.put("message", "Сервис аутентификации временно недоступен. Пожалуйста, повторите попытку позже.");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }
}