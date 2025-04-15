package shadowshift.studio.imagestorage.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import shadowshift.studio.imagestorage.config.RabbitMQConfig;
import shadowshift.studio.imagestorage.dto.message.ImageMessage;
import shadowshift.studio.imagestorage.model.Image;

import java.util.Map;

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
        
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.IMAGE_EXCHANGE, 
                RabbitMQConfig.COMPRESSION_KEY, 
                message);
    }
}