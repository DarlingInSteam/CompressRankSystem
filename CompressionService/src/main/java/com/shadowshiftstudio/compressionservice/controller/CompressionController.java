package com.shadowshiftstudio.compressionservice.controller;

import com.shadowshiftstudio.compressionservice.model.Image;
import com.shadowshiftstudio.compressionservice.service.compression.CompressionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/compression")
@Tag(name = "Сервис сжатия", description = "API для обработки и сжатия изображений")
public class CompressionController {
    private final CompressionService compressionService;

    @Autowired
    public CompressionController(CompressionService compressionService) {
        this.compressionService = compressionService;
    }

    /**
     * Сжимает изображение с указанным уровнем сжатия
     *
     * @param imageId идентификатор изображения
     * @param compressionLevel уровень сжатия (0-100)
     * @return метаданные сжатого изображения
     */
    @Operation(
        summary = "Сжать изображение",
        description = "Сжимает существующее изображение с указанным уровнем компрессии"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Изображение успешно сжато",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Image.class))
        ),
        @ApiResponse(
            responseCode = "400", 
            description = "Неверный уровень сжатия или изображение не найдено",
            content = @Content
        ),
        @ApiResponse(
            responseCode = "500", 
            description = "Внутренняя ошибка сервера",
            content = @Content
        )
    })
    @PostMapping("/{imageId}")
    public ResponseEntity<Image> compressImage(
            @Parameter(description = "Идентификатор изображения", required = true)
            @PathVariable String imageId, 
            
            @Parameter(description = "Уровень сжатия от 0 (без сжатия) до 100 (максимальное сжатие)", example = "50")
            @RequestParam(defaultValue = "50") int compressionLevel) {
        
        try {
            if (compressionLevel < 0 || compressionLevel > 100) {
                return ResponseEntity.badRequest().build();
            }
            
            Image compressedImage = compressionService.compressImage(imageId, compressionLevel);
            return ResponseEntity.ok(compressedImage);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Восстанавливает изображение до исходного вида
     *
     * @param imageId идентификатор изображения
     * @return метаданные восстановленного изображения
     */
    @Operation(
        summary = "Восстановить изображение",
        description = "Восстанавливает сжатое изображение до исходного качества"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Изображение успешно восстановлено",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Image.class))
        ),
        @ApiResponse(
            responseCode = "400", 
            description = "Изображение не найдено или не является сжатым",
            content = @Content
        ),
        @ApiResponse(
            responseCode = "500", 
            description = "Внутренняя ошибка сервера",
            content = @Content
        )
    })
    @PostMapping("/{imageId}/restore")
    public ResponseEntity<Image> restoreImage(
            @Parameter(description = "Идентификатор изображения", required = true)
            @PathVariable String imageId) {
        
        try {
            Image restoredImage = compressionService.restoreImage(imageId);
            return ResponseEntity.ok(restoredImage);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Получение оригинального размера изображения
     *
     * @param imageId идентификатор изображения
     * @return оригинальный размер изображения в байтах
     */
    @Operation(
        summary = "Получить оригинальный размер изображения",
        description = "Возвращает оригинальный размер изображения до сжатия в байтах"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Оригинальный размер успешно получен",
            content = @Content(mediaType = "application/json")
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
    @GetMapping("/{imageId}/original-size")
    public ResponseEntity<Object> getOriginalSize(
            @Parameter(description = "Идентификатор изображения", required = true)
            @PathVariable String imageId) {
        
        try {
            long originalSize = compressionService.getOriginalSize(imageId);
            return ResponseEntity.ok(java.util.Map.of("originalSize", originalSize));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(java.util.Map.of("error", "Изображение не найдено"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(java.util.Map.of("error", "Внутренняя ошибка сервера"));
        }
    }
}