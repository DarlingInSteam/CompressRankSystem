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
     * @param compressionLevel уровень сжатия (0-100, где 0 - без сжатия, 100 - максимальное сжатие)
     * @return обновленные метаданные изображения
     */
    public Image compressImage(String imageId, int compressionLevel) throws Exception {
        if (compressionLevel < 0 || compressionLevel > 100) {
            throw new IllegalArgumentException("Compression level must be between 0 and 100");
        }
        
        // Получаем данные и метаданные изображения
        byte[] imageData = imageStorageService.getImage(imageId);
        Image imageMetadata = imageStorageService.getImageMetadata(imageId);
        
        if (imageData == null || imageMetadata == null) {
            throw new IOException("Image not found with id: " + imageId);
        }

        // Если запрошен уровень сжатия 0, и текущий уровень сжатия тоже 0, ничего не делаем
        if (compressionLevel == 0 && imageMetadata.getCompressionLevel() == 0) {
            return imageMetadata;
        }

        // Если запрошен уровень сжатия 0, восстанавливаем оригинал
        if (compressionLevel == 0) {
            return restoreImage(imageId);
        }
        
        try {
            // В данном случае уровень сжатия (0-100) совпадает с качеством WebP (0-100)
            // 0 = высокое качество, 100 = максимальное сжатие
            // Для WebP качество обратное: 100 = высокое качество, 0 = максимальное сжатие
            // Поэтому инвертируем значение
            int webpQuality = 100 - compressionLevel;
            
            // Создаем опции для WebP конвертации с указанным качеством
            WebpOptions options = new WebpOptions()
                .withQuality(webpQuality)
                .withExact(true);
            
            // Используем более агрессивное шумоподавление для высоких уровней сжатия
            if (compressionLevel > 70) {
                options.withNoiseFilter(30);
            }
            
            // Для самых высоких уровней сжатия можно добавить дополнительное уменьшение размера
            if (compressionLevel > 90) {
                options.withNoiseFilter(50);
            }
            
            // Конвертируем изображение
            byte[] compressedData = webpService.convertToWebp(imageData, options);
            
            if (compressedData == null) {
                throw new IOException("WebP conversion failed");
            }
            
            // Сохраняем сжатые данные непосредственно в оригинальное изображение
            Image updatedImage = imageStorageService.updateImageCompression(imageId, compressedData, compressionLevel);
            
            logger.info("Image compressed with WebP: id={}, level={}, quality={}, original size={}, compressed size={}",
                    imageId, compressionLevel, webpQuality, imageData.length, compressedData.length);
            
            return updatedImage;
        } catch (Exception e) {
            logger.error("Error compressing image: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Восстанавливает изображение в исходный вид
     * @param imageId ID изображения
     * @return обновленные метаданные изображения
     */
    public Image restoreImage(String imageId) throws Exception {
        Image imageMetadata = imageStorageService.getImageMetadata(imageId);
        
        if (imageMetadata == null) {
            throw new IOException("Image not found with id: " + imageId);
        }
        
        // Если изображение уже не сжато, просто вернуть его метаданные
        if (imageMetadata.getCompressionLevel() == 0) {
            return imageMetadata;
        }
        
        // Получаем оригинальные данные из бэкапа
        byte[] originalData = imageStorageService.getOriginalImageBackup(imageId);
        
        if (originalData == null) {
            throw new IOException("Original image backup not found for id: " + imageId);
        }
        
        // Обновить текущее изображение, установив уровень сжатия 0 (без сжатия)
        return imageStorageService.updateImageCompression(imageId, originalData, 0);
    }
}