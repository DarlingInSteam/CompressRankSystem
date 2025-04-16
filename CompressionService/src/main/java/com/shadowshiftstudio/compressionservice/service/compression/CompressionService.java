package com.shadowshiftstudio.compressionservice.service.compression;

import com.shadowshiftstudio.compressionservice.model.Image;
import com.shadowshiftstudio.compressionservice.service.client.ImageStorageClient;
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
    private final ImageStorageClient imageStorageClient;
    private final WebpService webpService;

    @Autowired
    public CompressionService(ImageStorageClient imageStorageClient, WebpService webpService) {
        this.imageStorageClient = imageStorageClient;
        this.webpService = webpService;
    }

    /**
     * Compresses an image based on compression level
     * @param imageId ID of the image
     * @param compressionLevel compression level (0-100, where 0 is no compression, 100 is max compression)
     * @return updated image metadata
     */
    public Image compressImage(String imageId, int compressionLevel) throws Exception {
        logger.info("Starting compression for image: {}, level: {}", imageId, compressionLevel);
        
        if (compressionLevel < 0 || compressionLevel > 100) {
            logger.warn("Invalid compression level: {}", compressionLevel);
            throw new IllegalArgumentException("Compression level must be between 0 and 100");
        }
        
        // Get image data and metadata from storage service
        byte[] imageData = null;
        Image imageMetadata = null;
        
        try {
            imageData = imageStorageClient.getImage(imageId);
            logger.info("Retrieved image data for ID: {}, size: {} bytes", imageId, 
                imageData != null ? imageData.length : 0);
        } catch (IOException e) {
            logger.error("Failed to retrieve image data for ID: {}", imageId, e);
            throw new IOException("Failed to retrieve image data: " + e.getMessage(), e);
        }
        
        try {
            imageMetadata = imageStorageClient.getImageMetadata(imageId);
            logger.info("Retrieved metadata for image ID: {}, metadata present: {}", 
                imageId, imageMetadata != null);
        } catch (Exception e) {
            logger.error("Failed to retrieve image metadata for ID: {}", imageId, e);
        }
        
        if (imageData == null) {
            logger.error("Image data not found for ID: {}", imageId);
            throw new IOException("Image data not found with id: " + imageId);
        }
        
        if (imageMetadata == null) {
            logger.error("Image metadata not found for ID: {}", imageId);
            throw new IOException("Image metadata not found with id: " + imageId);
        }

        // If requested compression level is 0, and current compression level is also 0, do nothing
        if (compressionLevel == 0 && imageMetadata.getCompressionLevel() == 0) {
            logger.info("No compression needed, image is already uncompressed");
            return imageMetadata;
        }
        
        // If requested compression level is 0, restore original image instead of compressing
        if (compressionLevel == 0) {
            logger.info("Restoring original image instead of compressing");
            return restoreImage(imageId);
        }

        // Configure WebP conversion options
        WebpOptions options = new WebpOptions();
        options.withQuality(mapCompressionLevelToQuality(compressionLevel));
        
        // Convert image to WebP with specified compression
        logger.info("Converting image to WebP with quality: {}", mapCompressionLevelToQuality(compressionLevel));
        byte[] compressedData = webpService.convertToWebp(imageData, options);
        
        if (compressedData == null) {
            logger.error("WebP conversion failed for image ID: {}", imageId);
            throw new IOException("WebP conversion failed");
        }
        
        // Save compressed data directly to original image
        logger.info("Saving compressed image data, original size: {}, compressed size: {}", 
            imageData.length, compressedData.length);
        Image updatedImage = imageStorageClient.updateImageCompression(imageId, compressedData, compressionLevel);
        
        logger.info("Image compressed successfully: id={}, compressionLevel={}, originalSize={}, compressedSize={}",
                imageId, compressionLevel, imageData.length, compressedData.length);
                
        return updatedImage;
    }
    
    /**
     * Restores an image to its original state
     * @param imageId ID of the image
     * @return updated image metadata
     */
    public Image restoreImage(String imageId) throws Exception {
        logger.info("Restoring original image for ID: {}", imageId);
        
        Image imageMetadata = imageStorageClient.getImageMetadata(imageId);
        
        if (imageMetadata == null) {
            logger.error("Image metadata not found for restore operation, ID: {}", imageId);
            throw new IOException("Image not found with id: " + imageId);
        }
        
        // If image is already not compressed, just return its metadata
        if (imageMetadata.getCompressionLevel() == 0) {
            logger.info("Image is already in original state, no restore needed");
            return imageMetadata;
        }
        
        // Get original data from backup
        byte[] originalData = imageStorageClient.getOriginalImageBackup(imageId);
        
        if (originalData == null) {
            logger.error("Original image backup not found for ID: {}", imageId);
            throw new IOException("Original image backup not found for id: " + imageId);
        }
        
        logger.info("Retrieved original backup data for image ID: {}, size: {} bytes", 
            imageId, originalData.length);
        
        // Update current image, setting compression level to 0 (no compression)
        return imageStorageClient.updateImageCompression(imageId, originalData, 0);
    }
    
    private int mapCompressionLevelToQuality(int compressionLevel) {
        // Invert compression level for WebP quality
        // Compression level 0 = WebP quality 100
        // Compression level 100 = WebP quality 0
        return Math.max(0, Math.min(100, 100 - compressionLevel));
    }
    
    /**
     * Получает оригинальный размер изображения до сжатия
     * @param imageId ID изображения
     * @return оригинальный размер изображения в байтах
     * @throws Exception если изображение не найдено или произошла ошибка
     */
    public long getOriginalSize(String imageId) throws Exception {
        logger.info("Getting original size for image ID: {}", imageId);
        
        // Получаем метаданные изображения
        Image imageMetadata = imageStorageClient.getImageMetadata(imageId);
        
        if (imageMetadata == null) {
            logger.error("Image metadata not found for ID: {}", imageId);
            throw new IllegalArgumentException("Image not found with id: " + imageId);
        }
        
        // Если изображение не сжато, его текущий размер и есть оригинальный
        if (imageMetadata.getCompressionLevel() == 0) {
            logger.info("Image is not compressed, returning current size: {}", imageMetadata.getSize());
            return imageMetadata.getSize();
        }
        
        // Если изображение сжато, получаем оригинальное изображение из бэкапа
        try {
            byte[] originalData = imageStorageClient.getOriginalImageBackup(imageId);
            
            if (originalData == null) {
                logger.error("Original image backup not found for ID: {}", imageId);
                // Если бэкап не найден, возвращаем оценочный размер на основе текущего размера и уровня сжатия
                long estimatedSize = Math.round(imageMetadata.getSize() / (1 - imageMetadata.getCompressionLevel() / 100.0));
                logger.info("Using estimated original size: {}", estimatedSize);
                return estimatedSize;
            }
            
            logger.info("Retrieved original data, size: {} bytes", originalData.length);
            return originalData.length;
        } catch (Exception e) {
            logger.error("Error retrieving original size for image ID: {}", imageId, e);
            throw new Exception("Failed to retrieve original image size: " + e.getMessage(), e);
        }
    }
}