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
    private final Map<String, Consumer<ImageMessage>> pendingRequests = new ConcurrentHashMap<>();
    private final Map<String, byte[]> imageDataCache = new ConcurrentHashMap<>();
    private final Map<String, String> pendingBinaryTransfers = new ConcurrentHashMap<>();

    @Autowired
    private MessageConverter messageConverter;
    
    @Override
    public void onMessage(Message amqpMessage) {
        try {
            MessageProperties props = amqpMessage.getMessageProperties();
            String contentType = props.getContentType();
            String correlationId = props.getCorrelationId();
            
            Map<String, Object> headers = props.getHeaders();
            String imageId = headers != null && headers.containsKey("imageId") ?
                    headers.get("imageId").toString() : null;
            String action = headers != null && headers.containsKey("action") ?
                    headers.get("action").toString() : null;
            
            logger.debug("Received message with content type: {}, correlation ID: {}, imageId: {}, action: {}", 
                    contentType, correlationId, imageId, action);
            
            if ("application/octet-stream".equals(contentType) ||
                    (headers != null && headers.containsKey("messageType") && 
                     "binary".equals(headers.get("messageType")))) {
                
                processBinaryMessage(amqpMessage);
                return;
            }
            
            Object converted;
            try {
                converted = messageConverter.fromMessage(amqpMessage);
            } catch (MessageConversionException e) {
                logger.error("Failed to convert message: {}", e.getMessage());
                if (imageId != null) {
                    logger.warn("Attempting recovery for failed message conversion: imageId={}, action={}", 
                            imageId, action);
                    
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
            
            if (message.getMetadata() != null && Boolean.TRUE.equals(message.getMetadata().get("binaryTransfer"))) {
                if (correlationId != null) {
                    pendingBinaryTransfers.put(correlationId, receivedImageId);
                    logger.debug("Registered pending binary transfer with correlation ID: {} for image ID: {}", 
                            correlationId, receivedImageId);
                    
                    return;
                }
            }
            
            processImageMessage(message, receivedAction, receivedImageId);
            
        } catch (Exception e) {
            logger.error("Error processing message: {}", e.getMessage(), e);
        }
    }
    
    private void processBinaryMessage(Message message) {
        try {
            MessageProperties props = message.getMessageProperties();
            String correlationId = props.getCorrelationId();
            
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
            
            if (message.getBody() != null && message.getBody().length > 0) {
                logger.debug("Storing binary data in cache for image ID: {}, data length: {} bytes", 
                        imageId, message.getBody().length);
                
                imageDataCache.put(imageId, message.getBody());
                
                ImageMessage response = new ImageMessage();
                response.setImageId(imageId);
                response.setAction(action != null ? action : "IMAGE_DATA");
                
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
                
                Consumer<ImageMessage> callback = pendingRequests.remove(imageId);
                if (callback != null) {
                    logger.info("Found and executing callback for image ID: {}", imageId);
                    callback.accept(response);
                } else {
                    logger.warn("No pending request found for binary data with imageId: {}", imageId);
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
        
        if (("IMAGE_DATA".equals(action) || "ORIGINAL_DATA".equals(action)) &&
             imageDataCache.containsKey(imageId)) {
            
            logger.info("Found cached binary data for image ID: {} when processing action: {}", 
                    imageId, action);
            
            Consumer<ImageMessage> callback = pendingRequests.remove(imageId);
            if (callback != null) {
                callback.accept(message);
                return;
            }
        }

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
        
        if (imageDataCache.containsKey(imageId)) {
            logger.info("Binary data already available for image ID: {}, executing callback immediately", imageId);
            
            ImageMessage response = new ImageMessage();
            response.setImageId(imageId);
            response.setAction("IMAGE_DATA");
            
            callback.accept(response);
        } else {
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
        return new HashMap<>();
    }
}