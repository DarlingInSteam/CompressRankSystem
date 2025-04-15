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
        if (compressionLevel < 0 || compressionLevel > 100) {
            throw new IllegalArgumentException("Compression level must be between 0 and 100");
        }
        
        // Get image data and metadata from storage service
        byte[] imageData = imageStorageClient.getImage(imageId);
        Image imageMetadata = imageStorageClient.getImageMetadata(imageId);
        
        if (imageData == null || imageMetadata == null) {
            throw new IOException("Image not found with id: " + imageId);
        }

        // If requested compression level is 0, and current compression level is also 0, do nothing
        if (compressionLevel == 0 && imageMetadata.getCompressionLevel() == 0) {
            return imageMetadata;
        }
        
        // If requested compression level is 0, restore original image instead of compressing
        if (compressionLevel == 0) {
            return restoreImage(imageId);
        }

        // Configure WebP conversion options
        WebpOptions options = new WebpOptions();
        options.withQuality(mapCompressionLevelToQuality(compressionLevel));
        
        // Convert image to WebP with specified compression
        byte[] compressedData = webpService.convertToWebp(imageData, options);
        
        if (compressedData == null) {
            throw new IOException("WebP conversion failed");
        }
        
        // Save compressed data directly to original image
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
        Image imageMetadata = imageStorageClient.getImageMetadata(imageId);
        
        if (imageMetadata == null) {
            throw new IOException("Image not found with id: " + imageId);
        }
        
        // If image is already not compressed, just return its metadata
        if (imageMetadata.getCompressionLevel() == 0) {
            return imageMetadata;
        }
        
        // Get original data from backup
        byte[] originalData = imageStorageClient.getOriginalImageBackup(imageId);
        
        if (originalData == null) {
            throw new IOException("Original image backup not found for id: " + imageId);
        }
        
        // Update current image, setting compression level to 0 (no compression)
        return imageStorageClient.updateImageCompression(imageId, originalData, 0);
    }
    
    private int mapCompressionLevelToQuality(int compressionLevel) {
        // Invert compression level for WebP quality
        // Compression level 0 = WebP quality 100
        // Compression level 100 = WebP quality 0
        return Math.max(0, Math.min(100, 100 - compressionLevel));
    }
}