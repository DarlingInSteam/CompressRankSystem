package com.shadowshiftstudio.compressionservice.controller;

import com.shadowshiftstudio.compressionservice.model.Image;
import com.shadowshiftstudio.compressionservice.service.CompressionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/compression")
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
    @PostMapping("/{imageId}")
    public ResponseEntity<Image> compressImage(
            @PathVariable String imageId, 
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