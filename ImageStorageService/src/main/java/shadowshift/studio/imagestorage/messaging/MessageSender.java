package shadowshift.studio.imagestorage.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageBuilder;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.core.MessagePropertiesBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import shadowshift.studio.imagestorage.config.RabbitMQConfig;
import shadowshift.studio.imagestorage.dto.message.CompressionMessage;
import shadowshift.studio.imagestorage.dto.message.ImageMessage;
import shadowshift.studio.imagestorage.model.Image;

import java.io.ByteArrayOutputStream;
import java.io.ObjectOutputStream;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.Base64;

@Service
public class MessageSender {

    private static final Logger logger = LoggerFactory.getLogger(MessageSender.class);
    
    private final RabbitTemplate rabbitTemplate;
    
    @Autowired
    public MessageSender(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }
    
    /**
     * Sends a message to the compression service
     * 
     * @param message the message to send
     */
    public void sendToCompression(ImageMessage message) {
        logger.info("Sending message to compression service: {}, action: {}", 
                message.getMessageId(), message.getAction());
        
        if (message instanceof CompressionMessage) {
            CompressionMessage compMsg = (CompressionMessage) message;
            if (compMsg.getImageData() != null && compMsg.getImageData().length > 0) {
                logger.debug("Sending image data with length: {} bytes", compMsg.getImageData().length);
                
                byte[] imageData = compMsg.getImageData();
                compMsg.setImageData(null);
                
                sendBinaryToCompression(compMsg, imageData);
                return;
            }
        }
        
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.IMAGE_EXCHANGE, 
                RabbitMQConfig.COMPRESSION_KEY, 
                message);
    }
    
    /**
     * Sends a message with image metadata map to the compression service
     * 
     * @param message the message to send
     * @param imagesMap map of image metadata to include with the message
     */
    public void sendToCompression(ImageMessage message, Map<String, Image> imagesMap) {
        logger.info("Sending message with {} images to compression service: {}, action: {}", 
                imagesMap.size(), message.getMessageId(), message.getAction());
        
        if (message.getMetadata() == null) {
            message.setMetadata(new java.util.HashMap<>());
        }
        message.addMetadata("imagesCount", imagesMap.size());
        
        int i = 0;
        for (Map.Entry<String, Image> entry : imagesMap.entrySet()) {
            Image img = entry.getValue();
            message.addMetadata("image_" + i + "_id", img.getId());
            message.addMetadata("image_" + i + "_name", img.getOriginalFilename());
            message.addMetadata("image_" + i + "_compression", img.getCompressionLevel());
            message.addMetadata("image_" + i + "_size", img.getSize());
            i++;
            
            if (i >= 100) break;
        }
        
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.IMAGE_EXCHANGE, 
                RabbitMQConfig.COMPRESSION_KEY, 
                message);
    }
    
    /**
     * Sends a message with binary image data to the compression service using
     * a completely separate message type specifically for binary data
     * 
     * @param message the message containing metadata
     * @param imageData the binary image data
     */
    public void sendBinaryToCompression(CompressionMessage message, byte[] imageData) {
        if (imageData == null || imageData.length == 0) {
            logger.error("Attempted to send null or empty image data");
            return;
        }
        
        String correlationId = UUID.randomUUID().toString();
        String imageId = message.getImageId();
        
        logger.info("Sending binary image data to compression service: {}, action: {}, size: {} bytes, correlationId: {}",
                message.getMessageId(), message.getAction(), imageData.length, correlationId);
        
        try {
            MessageProperties binaryProps = MessagePropertiesBuilder.newInstance()
                    .setContentType("application/octet-stream")
                    .setCorrelationId(correlationId)
                    .setHeader("imageId", imageId)
                    .setHeader("messageType", "binary")
                    .setHeader("action", message.getAction())
                    .setHeader("imageDataLength", imageData.length)
                    .setHeader("compressionLevel", message.getCompressionLevel())
                    .build();
            
            if (message.getMetadata() != null) {
                for (Map.Entry<String, Object> entry : message.getMetadata().entrySet()) {
                    if (entry.getValue() != null) {
                        binaryProps.setHeader(entry.getKey(), entry.getValue().toString());
                    }
                }
            }
            
            Message binaryMessage = MessageBuilder
                    .withBody(imageData)
                    .andProperties(binaryProps)
                    .build();
            
            logger.debug("Sending single binary message with all metadata in headers for imageId: {}", imageId);
            
            rabbitTemplate.send(
                    RabbitMQConfig.IMAGE_EXCHANGE,
                    RabbitMQConfig.COMPRESSION_KEY,
                    binaryMessage);
            
            logger.debug("Successfully sent binary message with correlationId: {}", correlationId);
            
        } catch (Exception e) {
            logger.error("Failed to send binary data: {}", e.getMessage(), e);
        }
    }
}