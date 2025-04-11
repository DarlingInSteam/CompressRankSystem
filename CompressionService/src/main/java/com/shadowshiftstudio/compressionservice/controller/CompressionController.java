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
    // TODO : добавить отдельный сервис ранжирования. Пока что автоматизации нет.
    private final CompressionService compressionService;

    @Autowired
    public CompressionController(CompressionService compressionService) {
        this.compressionService = compressionService;
    }

    /**
     * Сжимает изображение с указанным уровнем сжатия
     *
     * @param imageId идентификатор изображения
     * @param compressionLevel уровень сжатия (0-10)
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
            
            @Parameter(description = "Уровень сжатия от 0 (минимальное) до 10 (максимальное)", example = "5")
            @RequestParam(defaultValue = "5") int compressionLevel) {
        
        try {
            if (compressionLevel < 0 || compressionLevel > 10) {
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
}