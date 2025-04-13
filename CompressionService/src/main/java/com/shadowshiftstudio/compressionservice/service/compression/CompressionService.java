package com.shadowshiftstudio.compressionservice.service.compression;

import com.shadowshiftstudio.compressionservice.model.Image;
import com.shadowshiftstudio.compressionservice.service.ImageStorageService;
import com.shadowshiftstudio.compressionservice.service.webp.WebpService;
import com.shadowshiftstudio.compressionservice.util.webp.WebpOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class CompressionService {

    private static final Logger logger = LoggerFactory.getLogger(CompressionService.class);
    private final ImageStorageService imageStorageService;
    private final WebpService webpService;

    @Autowired
    public CompressionService(ImageStorageService imageStorageService, WebpService webpService) {
        this.imageStorageService = imageStorageService;
        this.webpService = webpService;
    }

    /**
     * Сжимает изображение на основе уровня сжатия
     * @param imageId ID изображения
     * @param compressionLevel уровень сжатия (0-10, где 0 - без сжатия, 10 - максимальное сжатие)
     * @return обновленные метаданные изображения
     */
    public Image compressImage(String imageId, int compressionLevel) throws Exception {
        if (compressionLevel < 0 || compressionLevel > 10) {
            throw new IllegalArgumentException("Compression level must be between 0 and 10");
        }
        
        if (compressionLevel == 0) {
            return imageStorageService.getImageMetadata(imageId);
        }
        
        byte[] imageData = imageStorageService.getImage(imageId);
        Image imageMetadata = imageStorageService.getImageMetadata(imageId);
        
        if (imageData == null || imageMetadata == null) {
            throw new IOException("Image not found with id: " + imageId);
        }
        
        try {
            // Преобразуем уровень сжатия (0-10) в качество WebP (0-100)
            int webpQuality = mapCompressionLevelToWebpQuality(compressionLevel);
            
            // Создаем опции для WebP конвертации с указанным качеством
            WebpOptions options = new WebpOptions()
                .withQuality(webpQuality)
                .withExact(true);
            
            // Используем более агрессивное шумоподавление для высоких уровней сжатия
            if (compressionLevel > 7) {
                options.withNoiseFilter(30);
            }
            
            // Для самых высоких уровней сжатия можно добавить дополнительное уменьшение размера
            if (compressionLevel > 9) {
                // Уровень 10 - самый высокий уровень сжатия
                options.withNoiseFilter(50);
            }
            
            // Конвертируем изображение
            byte[] compressedData = webpService.convertToWebp(imageData, options);
            
            if (compressedData == null) {
                throw new IOException("WebP conversion failed");
            }
            
            logger.info("Image compressed with WebP: id={}, level={}, quality={}, original size={}, compressed size={}",
                    imageId, compressionLevel, webpQuality, imageData.length, compressedData.length);
            
            return imageStorageService.storeCompressedImage(imageId, compressedData, compressionLevel);
        } catch (Exception e) {
            logger.error("Error compressing image: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Преобразование уровня сжатия в значение качества WebP
     * @param compressionLevel уровень сжатия (0-10)
     * @return качество WebP (0-100)
     */
    private int mapCompressionLevelToWebpQuality(int compressionLevel) {
        // Инвертируем уровень сжатия в качество WebP:
        // уровень сжатия 0 -> качество 100
        // уровень сжатия 10 -> качество 10
        return Math.max(10, 100 - (compressionLevel * 9));
    }
}