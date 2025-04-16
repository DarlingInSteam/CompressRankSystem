package shadowshift.studio.apigatewaycompressionranksystem.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Модели данных для документации API и обмена информацией между сервисами.
 * Содержит классы, используемые в API Gateway для представления ключевых сущностей системы.
 */
public class ApiModels {

    /**
     * Ответ при ошибке API.
     * Используется для единообразного представления ошибок во всех API.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Модель ответа при возникновении ошибки")
    public static class ErrorResponse {
        
        @Schema(description = "Статус ответа", example = "error")
        private String status;
        
        @Schema(description = "Сообщение об ошибке", example = "Сервис временно недоступен")
        private String message;
        
        @Schema(description = "Код ошибки", example = "SERVICE_UNAVAILABLE")
        private String code;
        
        @Schema(description = "Метка времени возникновения ошибки (Unix timestamp)", example = "1618569930000")
        private long timestamp;
        
        @Schema(description = "Путь запроса, вызвавшего ошибку", example = "/api/images/123")
        private String path;
    }

    /**
     * Модель информации о сервисе.
     * Используется для отображения информации о состоянии и конфигурации сервиса.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Информация о микросервисе")
    public static class ServiceInfo {
        
        @Schema(description = "Название сервиса", example = "Image Storage Service")
        private String name;
        
        @Schema(description = "Версия сервиса", example = "1.0.0")
        private String version;
        
        @Schema(description = "Статус работы сервиса", example = "UP")
        private String status;
        
        @Schema(description = "URL сервиса", example = "http://localhost:8081")
        private String url;
        
        @Schema(description = "Дополнительная информация о сервисе")
        private Map<String, Object> details;
    }

    /**
     * Общая модель для метаданных изображения.
     * Используется для документации API. В реальности данные приходят из разных сервисов.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Метаданные изображения")
    public static class ImageMetadata {
        
        @Schema(description = "Идентификатор изображения", example = "550e8400-e29b-41d4-a716-446655440000")
        private String id;
        
        @Schema(description = "Имя файла изображения", example = "sunset_photo.jpg")
        private String filename;
        
        @Schema(description = "MIME-тип изображения", example = "image/jpeg")
        private String contentType;
        
        @Schema(description = "Размер изображения в байтах", example = "1048576")
        private Long size;
        
        @Schema(description = "Дата и время загрузки")
        private LocalDateTime uploadedAt;
        
        @Schema(description = "Статус сжатия", example = "ORIGINAL")
        private String compressionStatus;
        
        @Schema(description = "Степень сжатия (0-100)", example = "75")
        private Integer compressionLevel;
        
        @Schema(description = "Оригинальный размер до сжатия в байтах", example = "2097152")
        private Long originalSize;
        
        @Schema(description = "Дополнительные метаданные изображения")
        private Map<String, Object> additionalMetadata;
    }

    /**
     * Модель для отчета о состоянии здоровья системы.
     * Используется для представления статуса всех компонентов системы.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Отчет о состоянии системы")
    public static class SystemHealthReport {
        
        @Schema(description = "Общий статус системы", example = "UP")
        private String status;
        
        @Schema(description = "Метка времени проверки (Unix timestamp)", example = "1618569930000")
        private long timestamp;
        
        @Schema(description = "Информация о шлюзе API")
        private String gateway;
        
        @Schema(description = "Информация о сервисе хранения изображений")
        private Map<String, Object> imageStorageService;
        
        @Schema(description = "Информация о сервисе сжатия")
        private Map<String, Object> compressionService;
    }
}