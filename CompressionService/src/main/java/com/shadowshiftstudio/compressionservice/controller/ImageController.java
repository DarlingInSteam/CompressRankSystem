package com.shadowshiftstudio.compressionservice.controller;

import com.shadowshiftstudio.compressionservice.model.Image;
import com.shadowshiftstudio.compressionservice.service.ImageStatisticsService;
import com.shadowshiftstudio.compressionservice.service.ImageStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/images")
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
    @PostMapping
    public ResponseEntity<Image> uploadImage(@RequestParam("file") MultipartFile file) {
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
    @GetMapping("/{id}")
    public ResponseEntity<byte[]> getImage(@PathVariable String id, 
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
    @GetMapping
    public ResponseEntity<Map<String, Image>> getAllImages() {
        Map<String, Image> images = imageStorageService.getAllImageMetadata();
        return ResponseEntity.ok(images);
    }

    /**
     * Получение метаданных изображения по ID
     */
    @GetMapping("/{id}/metadata")
    public ResponseEntity<Image> getImageMetadata(@PathVariable String id) {
        Image image = imageStorageService.getImageMetadata(id);
        if (image == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(image);
    }

    /**
     * Удаление изображения по ID
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImage(@PathVariable String id) {
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