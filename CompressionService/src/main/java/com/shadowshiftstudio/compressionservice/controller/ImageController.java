package com.shadowshiftstudio.compressionservice.controller;

import com.shadowshiftstudio.compressionservice.model.Image;
import com.shadowshiftstudio.compressionservice.service.image.ImageStatisticsService;
import com.shadowshiftstudio.compressionservice.service.ImageStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/images")
@Tag(name = "Управление изображениями", description = "API для загрузки, получения и управления изображениями")
public class ImageController {

    private final ImageStorageService imageStorageService;
    private final ImageStatisticsService statisticsService;

    @Autowired
    public ImageController(ImageStorageService imageStorageService, ImageStatisticsService statisticsService) {
        this.imageStorageService = imageStorageService;
        this.statisticsService = statisticsService;
    }

    /**
     * Загрузка нового изображения
     */
    @Operation(
        summary = "Загрузить изображение",
        description = "Загружает новое изображение в систему"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "201",
            description = "Изображение успешно загружено",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Image.class))
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Ошибка при загрузке изображения",
            content = @Content
        )
    })
    @PostMapping
    public ResponseEntity<Image> uploadImage(
            @Parameter(description = "Файл изображения для загрузки", required = true)
            @RequestParam("file") MultipartFile file) {
        try {
            Image image = imageStorageService.storeImage(file);
            return ResponseEntity.status(HttpStatus.CREATED).body(image);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Получение изображения по ID
     */
    @Operation(
        summary = "Получить изображение",
        description = "Возвращает изображение по его идентификатору, с опцией скачивания"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Изображение успешно возвращено",
            content = @Content(mediaType = "image/*")
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Изображение не найдено",
            content = @Content
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Внутренняя ошибка сервера",
            content = @Content
        )
    })
    @GetMapping("/{id}")
    public ResponseEntity<byte[]> getImage(
            @Parameter(description = "Идентификатор изображения", required = true)
            @PathVariable String id, 
            
            @Parameter(description = "Флаг загрузки: true - скачать, false - просмотреть")
            @RequestParam(required = false, defaultValue = "false") boolean download) {
        try {
            Image image = imageStorageService.getImageMetadata(id);
            if (image == null) {
                return ResponseEntity.notFound().build();
            }
            
            if (download) {
                statisticsService.incrementDownloadCount(id);
            } else {
                statisticsService.incrementViewCount(id);
            }
            
            byte[] imageData = imageStorageService.getImage(id);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(image.getContentType()))
                    .body(imageData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Получение метаданных всех изображений
     */
    @Operation(
        summary = "Получить все изображения",
        description = "Возвращает метаданные всех изображений в системе"
    )
    @ApiResponse(
        responseCode = "200",
        description = "Список всех изображений",
        content = @Content(mediaType = "application/json")
    )
    @GetMapping
    public ResponseEntity<Map<String, Image>> getAllImages() {
        Map<String, Image> images = imageStorageService.getAllImageMetadata();
        return ResponseEntity.ok(images);
    }

    /**
     * Получение метаданных изображения по ID
     */
    @Operation(
        summary = "Получить метаданные изображения",
        description = "Возвращает только метаданные изображения по его идентификатору"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Метаданные изображения успешно возвращены",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Image.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Изображение не найдено",
            content = @Content
        )
    })
    @GetMapping("/{id}/metadata")
    public ResponseEntity<Image> getImageMetadata(
            @Parameter(description = "Идентификатор изображения", required = true)
            @PathVariable String id) {
        Image image = imageStorageService.getImageMetadata(id);
        if (image == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(image);
    }

    /**
     * Удаление изображения по ID
     */
    @Operation(
        summary = "Удалить изображение",
        description = "Удаляет изображение из системы по его идентификатору"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "204",
            description = "Изображение успешно удалено",
            content = @Content
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Изображение не найдено",
            content = @Content
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Внутренняя ошибка сервера",
            content = @Content
        )
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImage(
            @Parameter(description = "Идентификатор изображения для удаления", required = true)
            @PathVariable String id) {
        try {
            boolean result = imageStorageService.deleteImage(id);
            if (result) {
                return ResponseEntity.noContent().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}