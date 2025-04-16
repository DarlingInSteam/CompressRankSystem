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
    private static final int DEFAULT_TIMEOUT_SECONDS = 60;

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
        logger.info("Getting image data for image ID: {}", id);
        CompletableFuture<byte[]> future = new CompletableFuture<>();

        messageListener.registerCallback(id, message -> {
            if ("IMAGE_DATA".equals(message.getAction())) {
                byte[] imageData = messageListener.getImageData(id);
                if (imageData != null) {
                    logger.info("Image data successfully retrieved for ID: {}, size: {} bytes", 
                        id, imageData.length);
                    future.complete(imageData);
                } else {
                    logger.error("Retrieved null image data for ID: {} despite receiving IMAGE_DATA action", id);
                    future.completeExceptionally(new IOException("Received IMAGE_DATA action but actual data is null"));
                }
            } else if ("NOT_FOUND".equals(message.getAction()) || "ERROR".equals(message.getAction())) {
                logger.error("Storage service reported image not found or error for ID: {}", id);
                future.completeExceptionally(new IOException("Image not found or error retrieving image"));
            } else {
                logger.warn("Received unexpected action: {} for image ID: {}", message.getAction(), id);
            }
        });

        ImageMessage message = new ImageMessage();
        message.setImageId(id);
        message.setAction("GET_IMAGE");
        messageSender.sendToStorage(message);
        logger.debug("Sent GET_IMAGE request for image ID: {}", id);

        try {
            byte[] result = future.get(DEFAULT_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (result != null) {
                logger.info("Successfully fetched image data for ID: {}, size: {} bytes", id, result.length);
            } else {
                logger.warn("Fetched null image data for ID: {}", id);
            }
            return result;
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            logger.error("Failed to get image data for id: {}, error: {}", id, e.getMessage(), e);
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

        messageListener.registerCallback(id, message -> {
            if ("ORIGINAL_DATA".equals(message.getAction())) {
                byte[] imageData = messageListener.getImageData(id);
                future.complete(imageData);
            } else if ("NOT_FOUND".equals(message.getAction()) || "ERROR".equals(message.getAction())) {
                future.completeExceptionally(new IOException("Original image not found or error retrieving image"));
            }
        });

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
        logger.info("Getting metadata for image ID: {}", id);
        CompletableFuture<Image> future = new CompletableFuture<>();

        messageListener.registerCallback(id, message -> {
            if ("METADATA".equals(message.getAction())) {
                Image image = new Image();
                image.setId(id);
                
                if (message.getMetadata() != null) {
                    if (message.getMetadata().containsKey("originalFilename")) {
                        image.setOriginalFilename(message.getMetadata().get("originalFilename").toString());
                    }
                    if (message.getMetadata().containsKey("contentType")) {
                        image.setContentType(message.getMetadata().get("contentType").toString());
                    }
                    if (message.getMetadata().containsKey("size")) {
                        image.setSize(Long.parseLong(message.getMetadata().get("size").toString()));
                    }
                    if (message.getMetadata().containsKey("compressionLevel")) {
                        image.setCompressionLevel(Integer.parseInt(message.getMetadata().get("compressionLevel").toString()));
                    } else {
                        image.setCompressionLevel(0);
                    }
                    if (message.getMetadata().containsKey("objectName")) {
                        image.setObjectName(message.getMetadata().get("objectName").toString());
                    }
                    if (message.getMetadata().containsKey("originalImageId")) {
                        image.setOriginalImageId(message.getMetadata().get("originalImageId").toString());
                    }
                }
                
                logger.info("Received metadata for image ID: {}, compressionLevel: {}", 
                    id, image.getCompressionLevel());
                future.complete(image);
            } else if ("NOT_FOUND".equals(message.getAction()) || "ERROR".equals(message.getAction())) {
                logger.warn("Image metadata not found for ID: {}", id);
                future.complete(null);
            }
        });

        ImageMessage message = new ImageMessage();
        message.setImageId(id);
        message.setAction("GET_METADATA");
        messageSender.sendToStorage(message);
        logger.debug("Sent GET_METADATA request for image ID: {}", id);

        try {
            Image result = future.get(DEFAULT_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (result != null) {
                logger.info("Successfully retrieved metadata for image ID: {}", id);
            } else {
                logger.warn("No metadata found for image ID: {}", id);
            }
            return result;
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

        messageListener.registerCallback(imageId, message -> {
            if ("UPDATED".equals(message.getAction())) {
                Image image = new Image();
                image.setId(imageId);
                image.setCompressionLevel(compressionLevel);
                
                if (message.getMetadata() != null) {
                    if (message.getMetadata().containsKey("originalFilename")) {
                        image.setOriginalFilename(message.getMetadata().get("originalFilename").toString());
                    }
                    if (message.getMetadata().containsKey("contentType")) {
                        image.setContentType(message.getMetadata().get("contentType").toString());
                    }
                    if (message.getMetadata().containsKey("size")) {
                        image.setSize(Long.parseLong(message.getMetadata().get("size").toString()));
                    }
                    if (message.getMetadata().containsKey("objectName")) {
                        image.setObjectName(message.getMetadata().get("objectName").toString());
                    }
                    if (message.getMetadata().containsKey("originalImageId")) {
                        image.setOriginalImageId(message.getMetadata().get("originalImageId").toString());
                    }
                }
                
                logger.info("Image successfully updated: id={}, compressionLevel={}", 
                    imageId, compressionLevel);
                future.complete(image);
            } else if ("NOT_FOUND".equals(message.getAction()) || "ERROR".equals(message.getAction())) {
                future.completeExceptionally(new IOException("Image not found or error updating image"));
            }
        });

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

        messageListener.registerCallback(id, message -> {
            if ("DELETED".equals(message.getAction())) {
                future.complete(true);
            } else if ("NOT_FOUND".equals(message.getAction())) {
                future.complete(false);
            } else if ("ERROR".equals(message.getAction())) {
                future.completeExceptionally(new IOException("Error deleting image"));
            }
        });

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

        String requestId = "all_images_" + System.currentTimeMillis();
        messageListener.registerCallback(requestId, message -> {
            if ("ALL_METADATA".equals(message.getAction())) {
                Map<String, Image> images = messageListener.getAllImagesData(requestId);
                future.complete(images);
            } else if ("ERROR".equals(message.getAction())) {
                future.complete(new HashMap<>());
            }
        });

        ImageMessage message = new ImageMessage();
        message.setImageId(requestId);
        message.setAction("GET_ALL_METADATA");
        messageSender.sendToStorage(message);

        try {
            return future.get(DEFAULT_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            logger.error("Failed to get all images metadata", e);
            return new HashMap<>();
        }
    }
}