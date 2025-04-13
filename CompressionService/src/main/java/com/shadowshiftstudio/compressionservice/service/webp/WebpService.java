package com.shadowshiftstudio.compressionservice.service.webp;

import com.shadowshiftstudio.compressionservice.model.Image;
import com.shadowshiftstudio.compressionservice.util.webp.CWebpException;
import com.shadowshiftstudio.compressionservice.util.webp.WebpConverter;
import com.shadowshiftstudio.compressionservice.util.webp.WebpOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Сервис для работы с WebP изображениями
 */
@Service
public class WebpService {

    private static final Logger logger = LoggerFactory.getLogger(WebpService.class);
    
    @Value("${webp.default-quality:100}")
    private int defaultQuality;
    
    /**
     * Конвертирует изображение в формат WebP с качеством по умолчанию
     * @param imageData байтовые данные исходного изображения
     * @return сконвертированные WebP данные или null, если конвертация не удалась
     */
    public byte[] convertToWebp(byte[] imageData) {
        return convertToWebp(imageData, defaultQuality);
    }
    
    /**
     * Конвертирует изображение в формат WebP с заданным качеством
     * @param imageData байтовые данные исходного изображения
     * @param quality качество WebP (0-100)
     * @return сконвертированные WebP данные или null, если конвертация не удалась
     */
    public byte[] convertToWebp(byte[] imageData, int quality) {
        if (imageData == null || imageData.length == 0) {
            logger.error("Empty input image data");
            return null;
        }
        
        try {
            // Создаем опции для WebP конвертации
            WebpOptions options = new WebpOptions()
                .withQuality(quality)
                .withExact(true);
                
            // Конвертируем изображение напрямую через WebpConverter
            return WebpConverter.imageToWebpByte(imageData, options);
        } catch (CWebpException e) {
            logger.error("Failed to convert image to WebP: {}", e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Конвертирует изображение в формат WebP с расширенными настройками
     * @param imageData байтовые данные исходного изображения
     * @param options настройки конвертации
     * @return сконвертированные WebP данные или null, если конвертация не удалась
     */
    public byte[] convertToWebp(byte[] imageData, WebpOptions options) {
        if (imageData == null || imageData.length == 0) {
            logger.error("Empty input image data");
            return null;
        }
        
        try {
            // Конвертируем изображение через WebpConverter с заданными опциями
            return WebpConverter.imageToWebpByte(imageData, options);
        } catch (CWebpException e) {
            logger.error("Failed to convert image to WebP with custom options: {}", e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Конвертирует изображение с оптимизацией для фотографий
     * @param imageData байтовые данные исходного изображения
     * @return сконвертированные WebP данные или null, если конвертация не удалась
     */
    public byte[] convertToWebpPhoto(byte[] imageData) {
        return convertToWebp(imageData, WebpOptions.presetPhoto());
    }
    
    /**
     * Конвертирует изображение с максимальным сжатием
     * @param imageData байтовые данные исходного изображения
     * @return сконвертированные WebP данные или null, если конвертация не удалась
     */
    public byte[] convertToWebpCompressed(byte[] imageData) {
        return convertToWebp(imageData, WebpOptions.presetCompression());
    }
    
    /**
     * Проверяет, поддерживается ли формат изображения для конвертации в WebP
     * @param imageData байтовые данные изображения
     * @return true если формат поддерживается, false в противном случае
     */
    public boolean isSupportedFormat(byte[] imageData) {
        return WebpConverter.isSupportedFormat(imageData);
    }
}