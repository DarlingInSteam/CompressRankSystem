package com.shadowshiftstudio.compressionservice.service.client;

import com.shadowshiftstudio.compressionservice.dto.message.CompressionMessage;
import com.shadowshiftstudio.compressionservice.dto.message.ImageMessage;
import com.shadowshiftstudio.compressionservice.messaging.ImageMessageListener;
import com.shadowshiftstudio.compressionservice.messaging.MessageSender;
import com.shadowshiftstudio.compressionservice.model.Image;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Client service for interacting with the ImageStorageService via message broker
 */
@Service
public class ImageStorageClient {

    private static final Logger logger = LoggerFactory.getLogger(ImageStorageClient.class);
    private static final int DEFAULT_TIMEOUT_SECONDS = 10;

    private final MessageSender messageSender;
    private final ImageMessageListener messageListener;

    @Autowired
    public ImageStorageClient(MessageSender messageSender, ImageMessageListener messageListener) {
        this.messageSender = messageSender;
        this.messageListener = messageListener;
    }

    /**
     * Stores an image through the storage service
     * 
     * @param file multipart file to store
     * @return image metadata
     * @throws IOException if storage operation fails
     */
    public Image storeImage(MultipartFile file) throws IOException {
        // This is a direct REST API call since we need to transfer the file
        // The actual implementation would use a REST client to call the storage service directly
        throw new UnsupportedOperationException("Direct upload via message broker is not supported. Use REST API instead.");
    }

    /**
     * Gets an image from the storage service
     * 
     * @param id image ID
     * @return image data
     * @throws IOException if retrieval fails
     */
    public byte[] getImage(String id) throws IOException {
        CompletableFuture<byte[]> future = new CompletableFuture<>();

        // Register callback to process the response
        messageListener.registerCallback(id, message -> {
            if ("IMAGE_DATA".equals(message.getAction())) {
                byte[] imageData = messageListener.getImageData(id);
                future.complete(imageData);
            } else if ("NOT_FOUND".equals(message.getAction()) || "ERROR".equals(message.getAction())) {
                future.completeExceptionally(new IOException("Image not found or error retrieving image"));
            }
        });

        // Send request to storage service
        ImageMessage message = new ImageMessage();
        message.setImageId(id);
        message.setAction("GET_IMAGE");
        messageSender.sendToStorage(message);

        try {
            return future.get(DEFAULT_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            logger.error("Failed to get image data for id: {}", id, e);
            throw new IOException("Failed to get image: " + e.getMessage(), e);
        }
    }

    /**
     * Gets original image backup from storage service
     * 
     * @param id image ID
     * @return original image data
     * @throws IOException if retrieval fails
     */
    public byte[] getOriginalImageBackup(String id) throws IOException {
        CompletableFuture<byte[]> future = new CompletableFuture<>();

        // Register callback to process the response
        messageListener.registerCallback(id, message -> {
            if ("ORIGINAL_DATA".equals(message.getAction())) {
                byte[] imageData = messageListener.getImageData(id);
                future.complete(imageData);
            } else if ("NOT_FOUND".equals(message.getAction()) || "ERROR".equals(message.getAction())) {
                future.completeExceptionally(new IOException("Original image not found or error retrieving image"));
            }
        });

        // Send request to storage service
        ImageMessage message = new ImageMessage();
        message.setImageId(id);
        message.setAction("GET_ORIGINAL");
        messageSender.sendToStorage(message);

        try {
            return future.get(DEFAULT_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            logger.error("Failed to get original image data for id: {}", id, e);
            throw new IOException("Failed to get original image: " + e.getMessage(), e);
        }
    }

    /**
     * Gets image metadata from storage service
     * 
     * @param id image ID
     * @return image metadata
     */
    public Image getImageMetadata(String id) {
        CompletableFuture<Image> future = new CompletableFuture<>();

        // Register callback to process the response
        messageListener.registerCallback(id, message -> {
            if ("METADATA".equals(message.getAction())) {
                // For this example, we're creating a simplified Image object
                // In a real implementation, we'd need to deserialize a more complete response
                Image image = new Image();
                image.setId(id);
                future.complete(image);
            } else if ("NOT_FOUND".equals(message.getAction()) || "ERROR".equals(message.getAction())) {
                future.complete(null); // Image not found
            }
        });

        // Send request to storage service
        ImageMessage message = new ImageMessage();
        message.setImageId(id);
        message.setAction("GET_METADATA");
        messageSender.sendToStorage(message);

        try {
            return future.get(DEFAULT_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            logger.error("Failed to get metadata for image id: {}", id, e);
            return null;
        }
    }

    /**
     * Updates image compression in storage service
     * 
     * @param imageId image ID
     * @param imageData new image data
     * @param compressionLevel compression level
     * @return updated image metadata
     * @throws IOException if update fails
     */
    public Image updateImageCompression(String imageId, byte[] imageData, int compressionLevel) throws IOException {
        CompletableFuture<Image> future = new CompletableFuture<>();

        // Register callback to process the response
        messageListener.registerCallback(imageId, message -> {
            if ("UPDATED".equals(message.getAction())) {
                // For this example, we're creating a simplified Image object with updated compression level
                Image image = new Image();
                image.setId(imageId);
                image.setCompressionLevel(compressionLevel);
                future.complete(image);
            } else if ("NOT_FOUND".equals(message.getAction()) || "ERROR".equals(message.getAction())) {
                future.completeExceptionally(new IOException("Image not found or error updating image"));
            }
        });

        // Send request to storage service with image data
        CompressionMessage message = new CompressionMessage();
        message.setImageId(imageId);
        message.setAction("UPDATE_COMPRESSION");
        message.setImageData(imageData);
        message.setCompressionLevel(compressionLevel);
        messageSender.sendToStorage(message);

        try {
            return future.get(DEFAULT_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            logger.error("Failed to update image compression for id: {}", imageId, e);
            throw new IOException("Failed to update image compression: " + e.getMessage(), e);
        }
    }

    /**
     * Deletes an image from storage service
     * 
     * @param id image ID
     * @return true if deleted successfully
     * @throws IOException if deletion fails
     */
    public boolean deleteImage(String id) throws IOException {
        CompletableFuture<Boolean> future = new CompletableFuture<>();

        // Register callback to process the response
        messageListener.registerCallback(id, message -> {
            if ("DELETED".equals(message.getAction())) {
                future.complete(true);
            } else if ("NOT_FOUND".equals(message.getAction())) {
                future.complete(false);
            } else if ("ERROR".equals(message.getAction())) {
                future.completeExceptionally(new IOException("Error deleting image"));
            }
        });

        // Send request to storage service
        ImageMessage message = new ImageMessage();
        message.setImageId(id);
        message.setAction("DELETE");
        messageSender.sendToStorage(message);

        try {
            return future.get(DEFAULT_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            logger.error("Failed to delete image id: {}", id, e);
            throw new IOException("Failed to delete image: " + e.getMessage(), e);
        }
    }

    /**
     * Gets all images metadata from storage service
     * 
     * @return Map of all images with their IDs as keys
     */
    public Map<String, Image> getAllImages() {
        CompletableFuture<Map<String, Image>> future = new CompletableFuture<>();

        // Register callback to process the response
        String requestId = "all_images_" + System.currentTimeMillis();
        messageListener.registerCallback(requestId, message -> {
            if ("ALL_METADATA".equals(message.getAction())) {
                // In a real implementation, we'd deserialize the complete map from the message
                // For this example, we'll create a simplified empty map
                Map<String, Image> images = messageListener.getAllImagesData(requestId);
                future.complete(images);
            } else if ("ERROR".equals(message.getAction())) {
                future.complete(new HashMap<>()); // Return empty map on error
            }
        });

        // Send request to storage service
        ImageMessage message = new ImageMessage();
        message.setImageId(requestId);
        message.setAction("GET_ALL_METADATA");
        messageSender.sendToStorage(message);

        try {
            return future.get(DEFAULT_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            logger.error("Failed to get all images metadata", e);
            return new HashMap<>(); // Return empty map on exception
        }
    }
}