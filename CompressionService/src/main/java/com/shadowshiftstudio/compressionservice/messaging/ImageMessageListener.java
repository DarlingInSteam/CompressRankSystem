package com.shadowshiftstudio.compressionservice.messaging;

import com.shadowshiftstudio.compressionservice.config.RabbitMQConfig;
import com.shadowshiftstudio.compressionservice.dto.message.CompressionMessage;
import com.shadowshiftstudio.compressionservice.dto.message.ImageMessage;
import com.shadowshiftstudio.compressionservice.model.Image;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

@Component
public class ImageMessageListener {

    private static final Logger logger = LoggerFactory.getLogger(ImageMessageListener.class);
    
    // This map stores callbacks for pending message responses
    private final Map<String, Consumer<ImageMessage>> pendingRequests = new ConcurrentHashMap<>();
    
    // This map temporarily stores image data retrieved from storage service
    private final Map<String, byte[]> imageDataCache = new ConcurrentHashMap<>();
    
    @RabbitListener(queues = {RabbitMQConfig.COMPRESSION_QUEUE})
    public void processCompressionMessage(ImageMessage message) {
        logger.info("Received message from storage service: {}, action: {}", 
                message.getMessageId(), message.getAction());
        
        String imageId = message.getImageId();
        String action = message.getAction();
        
        // Store image data in cache when applicable
        if (message instanceof CompressionMessage && "IMAGE_DATA".equals(action)) {
            CompressionMessage compMsg = (CompressionMessage) message;
            imageDataCache.put(imageId, compMsg.getImageData());
        }
        
        // Check if there's a pending request waiting for this response
        Consumer<ImageMessage> callback = pendingRequests.remove(imageId);
        if (callback != null) {
            callback.accept(message);
        } else {
            logger.warn("Received response for imageId {} but no pending request found", imageId);
        }
    }
    
    /**
     * Register a callback for a response to a specific image ID
     * 
     * @param imageId ID of the image
     * @param callback callback to execute when response is received
     */
    public void registerCallback(String imageId, Consumer<ImageMessage> callback) {
        pendingRequests.put(imageId, callback);
    }
    
    /**
     * Get cached image data for an image ID
     * 
     * @param imageId ID of the image
     * @return image data or null if not in cache
     */
    public byte[] getImageData(String imageId) {
        return imageDataCache.remove(imageId); // Get and remove from cache
    }
    
    /**
     * Gets all images data map from message cache
     * 
     * @param requestId the ID of the request
     * @return map of images metadata by image ID
     */
    public Map<String, Image> getAllImagesData(String requestId) {
        // In a real implementation, this would deserialize the image data from the message
        // For simplicity, we're just returning an empty map here
        return new HashMap<>();
    }
}