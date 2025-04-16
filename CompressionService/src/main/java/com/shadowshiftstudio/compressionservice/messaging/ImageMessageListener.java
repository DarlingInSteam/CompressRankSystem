package com.shadowshiftstudio.compressionservice.messaging;

import com.shadowshiftstudio.compressionservice.config.RabbitMQConfig;
import com.shadowshiftstudio.compressionservice.dto.message.CompressionMessage;
import com.shadowshiftstudio.compressionservice.dto.message.ImageMessage;
import com.shadowshiftstudio.compressionservice.model.Image;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.support.converter.MessageConversionException;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.amqp.core.MessageListener;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

@Component
public class ImageMessageListener implements MessageListener {

    private static final Logger logger = LoggerFactory.getLogger(ImageMessageListener.class);
    
    // This map stores callbacks for pending message responses
    private final Map<String, Consumer<ImageMessage>> pendingRequests = new ConcurrentHashMap<>();
    
    // This map temporarily stores image data retrieved from storage service
    private final Map<String, byte[]> imageDataCache = new ConcurrentHashMap<>();
    
    // This map stores pending binary transfers by correlation ID
    private final Map<String, String> pendingBinaryTransfers = new ConcurrentHashMap<>();

    @Autowired
    private MessageConverter messageConverter;
    
    @Override
    public void onMessage(Message amqpMessage) {
        try {
            MessageProperties props = amqpMessage.getMessageProperties();
            String contentType = props.getContentType();
            String correlationId = props.getCorrelationId();
            
            // First extract important headers that we might need regardless of message type
            Map<String, Object> headers = props.getHeaders();
            String imageId = headers != null && headers.containsKey("imageId") ?
                    headers.get("imageId").toString() : null;
            String action = headers != null && headers.containsKey("action") ?
                    headers.get("action").toString() : null;
            
            logger.debug("Received message with content type: {}, correlation ID: {}, imageId: {}, action: {}", 
                    contentType, correlationId, imageId, action);
            
            // Special handling for binary messages - check before attempting JSON conversion
            if ("application/octet-stream".equals(contentType) || 
                    (headers != null && headers.containsKey("messageType") && 
                     "binary".equals(headers.get("messageType")))) {
                
                processBinaryMessage(amqpMessage);
                return;
            }
            
            // It's a regular JSON message - convert it
            Object converted;
            try {
                converted = messageConverter.fromMessage(amqpMessage);
            } catch (MessageConversionException e) {
                logger.error("Failed to convert message: {}", e.getMessage());
                // If this message has an imageId header, we can try to recover
                if (imageId != null) {
                    logger.warn("Attempting recovery for failed message conversion: imageId={}, action={}", 
                            imageId, action);
                    
                    // If it's a binary message that wasn't properly flagged, process it as binary
                    if ("IMAGE_DATA".equals(action) || "ORIGINAL_DATA".equals(action)) {
                        processBinaryMessage(amqpMessage);
                    }
                }
                return;
            }
            
            if (!(converted instanceof ImageMessage)) {
                logger.error("Received message is not an ImageMessage: {}", 
                        converted != null ? converted.getClass().getName() : "null");
                return;
            }
            
            ImageMessage message = (ImageMessage)converted;
            String receivedImageId = message.getImageId();
            String receivedAction = message.getAction();
            
            logger.info("Received message from storage service: {}, action: {}", 
                    message.getMessageId(), receivedAction);
            
            // Check if it's metadata for a binary transfer
            if (message.getMetadata() != null && Boolean.TRUE.equals(message.getMetadata().get("binaryTransfer"))) {
                // This is metadata for a binary transfer
                if (correlationId != null) {
                    pendingBinaryTransfers.put(correlationId, receivedImageId);
                    logger.debug("Registered pending binary transfer with correlation ID: {} for image ID: {}", 
                            correlationId, receivedImageId);
                    
                    // Don't complete the callback yet - wait for the binary part
                    return;
                }
            }
            
            // Process the message based on action
            processImageMessage(message, receivedAction, receivedImageId);
            
        } catch (Exception e) {
            logger.error("Error processing message: {}", e.getMessage(), e);
        }
    }
    
    private void processBinaryMessage(Message message) {
        try {
            MessageProperties props = message.getMessageProperties();
            String correlationId = props.getCorrelationId();
            
            // Extract headers
            Map<String, Object> headers = props.getHeaders();
            String imageId = headers != null && headers.containsKey("imageId") ?
                    headers.get("imageId").toString() : null;
            String action = headers != null && headers.containsKey("action") ?
                    headers.get("action").toString() : null;
                    
            int dataLength = message.getBody() != null ? message.getBody().length : 0;
            
            if (imageId == null || imageId.isEmpty()) {
                logger.error("Received binary message without imageId header");
                return;
            }
            
            logger.info("Received binary data message: correlationId={}, imageId={}, action={}, size={} bytes", 
                    correlationId, imageId, action, dataLength);
            
            // Store the binary data in the cache regardless of correlation matching
            if (message.getBody() != null && message.getBody().length > 0) {
                logger.debug("Storing binary data in cache for image ID: {}, data length: {} bytes", 
                        imageId, message.getBody().length);
                
                // Store the binary data in the cache
                imageDataCache.put(imageId, message.getBody());
                
                // Create a response message to trigger callback
                ImageMessage response = new ImageMessage();
                response.setImageId(imageId);
                response.setAction(action != null ? action : "IMAGE_DATA");
                
                // If there are additional headers with metadata, add them to the response message
                if (headers != null) {
                    for (Map.Entry<String, Object> entry : headers.entrySet()) {
                        String key = entry.getKey();
                        Object value = entry.getValue();
                        if (value != null && !key.startsWith("__") && 
                            !key.equals("imageId") && !key.equals("action") && 
                            !key.equals("messageType")) {
                            
                            response.addMetadata(key, value);
                        }
                    }
                }
                
                // Complete the pending request
                Consumer<ImageMessage> callback = pendingRequests.remove(imageId);
                if (callback != null) {
                    logger.info("Found and executing callback for image ID: {}", imageId);
                    callback.accept(response);
                } else {
                    logger.warn("No pending request found for binary data with imageId: {}", imageId);
                    
                    // Store data for slightly longer in case the request comes in after the data
                    // This helps with race conditions in message delivery ordering
                    // We'll clean it up eventually with a background task or TTL
                }
            } else {
                logger.error("Received binary message with no data for image ID: {}", imageId);
            }
        } catch (Exception e) {
            logger.error("Error processing binary message: {}", e.getMessage(), e);
        }
    }
    
    private void processImageMessage(ImageMessage message, String action, String imageId) {
        logger.debug("Processing message with action: {} for imageId: {}", action, imageId);
        
        // Special case: check if there's already binary data for this image ID
        if (("IMAGE_DATA".equals(action) || "ORIGINAL_DATA".equals(action)) && 
             imageDataCache.containsKey(imageId)) {
            
            logger.info("Found cached binary data for image ID: {} when processing action: {}", 
                    imageId, action);
            
            // Data is already in cache, can trigger callback directly
            Consumer<ImageMessage> callback = pendingRequests.remove(imageId);
            if (callback != null) {
                callback.accept(message);
                return;
            }
        }
        
        // For all other actions, check if there's a pending request waiting for this response
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
        logger.debug("Registering callback for image ID: {}", imageId);
        
        // First check if we already have data for this ID
        if (imageDataCache.containsKey(imageId)) {
            logger.info("Binary data already available for image ID: {}, executing callback immediately", imageId);
            
            // Create a response message
            ImageMessage response = new ImageMessage();
            response.setImageId(imageId);
            response.setAction("IMAGE_DATA"); // Default action for binary data
            
            // Execute callback directly
            callback.accept(response);
        } else {
            // Store callback for later
            pendingRequests.put(imageId, callback);
        }
    }
    
    /**
     * Get cached image data for an image ID
     * 
     * @param imageId ID of the image
     * @return image data or null if not in cache
     */
    public byte[] getImageData(String imageId) {
        byte[] data = imageDataCache.remove(imageId); // Get and remove from cache
        if (data == null) {
            logger.error("Image data not found in cache for image ID: {}", imageId);
        } else {
            logger.info("Retrieved image data from cache for image ID: {}, data length: {}", imageId, data.length);
        }
        return data;
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