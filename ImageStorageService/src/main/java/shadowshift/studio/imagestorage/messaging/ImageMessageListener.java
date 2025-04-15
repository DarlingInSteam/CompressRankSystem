package shadowshift.studio.imagestorage.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
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

    @Autowired
    public ImageMessageListener(ImageStorageService imageStorageService, MessageSender messageSender) {
        this.imageStorageService = imageStorageService;
        this.messageSender = messageSender;
    }

    @RabbitListener(queues = {RabbitMQConfig.STORAGE_QUEUE})
    public void processStorageMessage(ImageMessage message) {
        logger.info("Received storage message: {}, action: {}", message.getMessageId(), message.getAction());
        
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
                
                messageSender.sendToCompression(response);
            } else {
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
                
                messageSender.sendToCompression(response);
            } else {
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
            
            Image updatedImage = imageStorageService.updateImageCompression(
                    imageId, imageData, compressionLevel);
            
            if (updatedImage != null) {
                ImageMessage response = new ImageMessage();
                response.setImageId(imageId);
                response.setAction("UPDATED");
                
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
        
        messageSender.sendToCompression(response);
    }
}