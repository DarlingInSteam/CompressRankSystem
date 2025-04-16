package shadowshift.studio.imagestorage.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.converter.MessageConversionException;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import shadowshift.studio.imagestorage.config.RabbitMQConfig;
import shadowshift.studio.imagestorage.dto.message.CompressionMessage;
import shadowshift.studio.imagestorage.dto.message.ImageMessage;
import shadowshift.studio.imagestorage.model.Image;
import shadowshift.studio.imagestorage.service.ImageStorageService;

import java.io.IOException;
import java.util.Map;

@Component
public class ImageMessageListener {

    private static final Logger logger = LoggerFactory.getLogger(ImageMessageListener.class);
    
    private final ImageStorageService imageStorageService;
    private final MessageSender messageSender;
    private final MessageConverter messageConverter;

    @Autowired
    public ImageMessageListener(ImageStorageService imageStorageService, MessageSender messageSender, 
                              MessageConverter messageConverter) {
        this.imageStorageService = imageStorageService;
        this.messageSender = messageSender;
        this.messageConverter = messageConverter;
    }

    @RabbitListener(queues = {RabbitMQConfig.STORAGE_QUEUE})
    public void processStorageMessage(Message amqpMessage) {
        try {
            MessageProperties props = amqpMessage.getMessageProperties();
            String contentType = props.getContentType();
            String correlationId = props.getCorrelationId();
            
            logger.debug("Received message with content type: {}, correlation ID: {}", 
                    contentType, correlationId);
            
            // Special handling for binary messages if needed
            if ("application/octet-stream".equals(contentType)) {
                logger.warn("Received binary message directly to storage queue - not expected");
                return;
            }
            
            // Convert message to our expected message type
            Object convertedMessage;
            try {
                convertedMessage = messageConverter.fromMessage(amqpMessage);
            } catch (MessageConversionException e) {
                logger.error("Failed to convert message: {}", e.getMessage(), e);
                return;
            }
            
            if (!(convertedMessage instanceof ImageMessage)) {
                logger.error("Received message is not an ImageMessage: {}", 
                        convertedMessage != null ? convertedMessage.getClass().getName() : "null");
                return;
            }
            
            ImageMessage message = (ImageMessage) convertedMessage;
            logger.info("Processing storage message: {}, action: {}", message.getMessageId(), message.getAction());
            
            processImageMessage(message);
            
        } catch (Exception e) {
            logger.error("Error processing message", e);
            
            // Try to extract imageId from message headers if possible
            MessageProperties props = amqpMessage.getMessageProperties();
            if (props != null && props.getHeaders() != null && props.getHeaders().containsKey("imageId")) {
                String imageId = props.getHeaders().get("imageId").toString();
                sendErrorResponse(imageId, "Message processing error: " + e.getMessage());
            }
        }
    }
    
    private void processImageMessage(ImageMessage message) {
        try {
            String action = message.getAction();
            String imageId = message.getImageId();
            
            switch (action) {
                case "GET_IMAGE":
                    handleGetImageRequest(imageId, message.getMessageId());
                    break;
                case "GET_ORIGINAL":
                    handleGetOriginalRequest(imageId, message.getMessageId());
                    break;
                case "GET_METADATA":
                    handleGetMetadataRequest(imageId, message.getMessageId());
                    break;
                case "GET_ALL_METADATA":
                    handleGetAllMetadataRequest(imageId);
                    break;
                case "DELETE":
                    handleDeleteRequest(imageId, message.getMessageId());
                    break;
                case "UPDATE_COMPRESSION":
                    if (message instanceof CompressionMessage) {
                        handleUpdateCompressionRequest((CompressionMessage) message);
                    } else {
                        logger.error("Expected CompressionMessage but received: {}", message.getClass().getName());
                    }
                    break;
                default:
                    logger.warn("Unknown action: {}", action);
            }
            
        } catch (Exception e) {
            logger.error("Error processing message: {}", message.getMessageId(), e);
            
            // Send error response
            ImageMessage response = new ImageMessage();
            response.setImageId(message.getImageId());
            response.setAction("ERROR");
            messageSender.sendToCompression(response);
        }
    }
    
    private void handleGetImageRequest(String imageId, String messageId) {
        try {
            byte[] imageData = imageStorageService.getImage(imageId);
            Image metadata = imageStorageService.getImageMetadata(imageId);
            
            if (imageData != null && metadata != null) {
                CompressionMessage response = new CompressionMessage();
                response.setImageId(imageId);
                response.setAction("IMAGE_DATA");
                response.setImageData(imageData);
                response.setCompressionLevel(metadata.getCompressionLevel());
                
                // Добавляем важную информацию в метаданные
                response.addMetadata("contentType", metadata.getContentType());
                response.addMetadata("size", imageData.length);
                response.addMetadata("originalFilename", metadata.getOriginalFilename());
                
                // Explicitly confirming image data is set
                logger.debug("Preparing to send image data: ID={}, size={}, compressionLevel={}, imageData null={}", 
                    imageId, imageData.length, metadata.getCompressionLevel(), (response.getImageData() == null));
                
                // Send using direct custom binary message for large data
                messageSender.sendBinaryToCompression(response, imageData);
                logger.info("Sent image data response for image ID: {}, data size: {} bytes", 
                    imageId, imageData.length);
            } else {
                logger.warn("Image or metadata not found for ID: {}", imageId);
                sendNotFoundResponse(imageId);
            }
            
        } catch (IOException e) {
            logger.error("Error retrieving image: {}", imageId, e);
            sendErrorResponse(imageId, "Failed to retrieve image: " + e.getMessage());
        }
    }
    
    private void handleGetOriginalRequest(String imageId, String messageId) {
        try {
            byte[] originalData = imageStorageService.getOriginalImageBackup(imageId);
            
            if (originalData != null) {
                CompressionMessage response = new CompressionMessage();
                response.setImageId(imageId);
                response.setAction("ORIGINAL_DATA");
                response.setImageData(originalData);
                response.setCompressionLevel(0);
                
                // Добавляем размер данных в метаданные
                response.addMetadata("imageDataLength", originalData.length);
                
                logger.debug("Sending original image data: ID={}, size={}", imageId, originalData.length);
                
                messageSender.sendToCompression(response);
                logger.info("Sent original image data response for image ID: {}, data size: {} bytes",
                    imageId, originalData.length);
            } else {
                logger.warn("Original image backup not found for ID: {}", imageId);
                sendNotFoundResponse(imageId);
            }
            
        } catch (IOException e) {
            logger.error("Error retrieving original image: {}", imageId, e);
            sendErrorResponse(imageId, "Failed to retrieve original image: " + e.getMessage());
        }
    }
    
    private void handleGetMetadataRequest(String imageId, String messageId) {
        Image metadata = imageStorageService.getImageMetadata(imageId);
        
        if (metadata != null) {
            ImageMessage response = new ImageMessage();
            response.setImageId(imageId);
            response.setAction("METADATA");
            
            // Добавляем все метаданные изображения в сообщение
            response.addMetadata("originalFilename", metadata.getOriginalFilename());
            response.addMetadata("contentType", metadata.getContentType());
            response.addMetadata("size", metadata.getSize());
            response.addMetadata("compressionLevel", metadata.getCompressionLevel());
            response.addMetadata("objectName", metadata.getObjectName());
            
            if (metadata.getOriginalImageId() != null) {
                response.addMetadata("originalImageId", metadata.getOriginalImageId());
            }
            
            logger.info("Sending metadata for image ID: {}, compressionLevel: {}", 
                imageId, metadata.getCompressionLevel());
            
            messageSender.sendToCompression(response);
        } else {
            sendNotFoundResponse(imageId);
        }
    }
    
    private void handleGetAllMetadataRequest(String requestId) {
        logger.info("Processing GET_ALL_METADATA request with ID: {}", requestId);
        try {
            Map<String, Image> allImages = imageStorageService.getAllImageMetadata();
            
            // Create response
            ImageMessage response = new ImageMessage();
            response.setImageId(requestId);
            response.setAction("ALL_METADATA");
            
            // Send response with metadata
            messageSender.sendToCompression(response, allImages);
            logger.info("Sent metadata for {} images to compression service", allImages.size());
            
        } catch (Exception e) {
            logger.error("Error retrieving all image metadata", e);
            sendErrorResponse(requestId, "Failed to retrieve all image metadata: " + e.getMessage());
        }
    }
    
    private void handleDeleteRequest(String imageId, String messageId) {
        try {
            boolean deleted = imageStorageService.deleteImage(imageId);
            
            if (deleted) {
                ImageMessage response = new ImageMessage();
                response.setImageId(imageId);
                response.setAction("DELETED");
                
                messageSender.sendToCompression(response);
            } else {
                sendNotFoundResponse(imageId);
            }
            
        } catch (IOException e) {
            logger.error("Error deleting image: {}", imageId, e);
            sendErrorResponse(imageId, "Failed to delete image: " + e.getMessage());
        }
    }
    
    private void handleUpdateCompressionRequest(CompressionMessage message) {
        try {
            String imageId = message.getImageId();
            byte[] imageData = message.getImageData();
            int compressionLevel = message.getCompressionLevel();
            
            if (imageData == null || imageData.length == 0) {
                logger.error("Received UPDATE_COMPRESSION request with no image data for ID: {}", imageId);
                sendErrorResponse(imageId, "No image data provided");
                return;
            }
            
            logger.debug("Received image data for compression: ID={}, size={}, compressionLevel={}", 
                imageId, imageData.length, compressionLevel);
            
            Image updatedImage = imageStorageService.updateImageCompression(
                    imageId, imageData, compressionLevel);
            
            if (updatedImage != null) {
                ImageMessage response = new ImageMessage();
                response.setImageId(imageId);
                response.setAction("UPDATED");
                
                // Добавляем обновленные метаданные в ответ
                response.addMetadata("originalFilename", updatedImage.getOriginalFilename());
                response.addMetadata("contentType", updatedImage.getContentType());
                response.addMetadata("size", updatedImage.getSize());
                response.addMetadata("compressionLevel", updatedImage.getCompressionLevel());
                response.addMetadata("objectName", updatedImage.getObjectName());
                
                if (updatedImage.getOriginalImageId() != null) {
                    response.addMetadata("originalImageId", updatedImage.getOriginalImageId());
                }
                
                logger.info("Sending updated metadata for image ID: {}, compressionLevel: {}", 
                    imageId, updatedImage.getCompressionLevel());
                
                messageSender.sendToCompression(response);
            } else {
                sendNotFoundResponse(imageId);
            }
            
        } catch (IOException e) {
            logger.error("Error updating image compression: {}", message.getImageId(), e);
            sendErrorResponse(message.getImageId(), "Failed to update image: " + e.getMessage());
        }
    }
    
    private void sendNotFoundResponse(String imageId) {
        ImageMessage response = new ImageMessage();
        response.setImageId(imageId);
        response.setAction("NOT_FOUND");
        
        messageSender.sendToCompression(response);
    }
    
    private void sendErrorResponse(String imageId, String errorMessage) {
        ImageMessage response = new ImageMessage();
        response.setImageId(imageId);
        response.setAction("ERROR");
        response.addMetadata("errorMessage", errorMessage);
        
        messageSender.sendToCompression(response);
    }
}