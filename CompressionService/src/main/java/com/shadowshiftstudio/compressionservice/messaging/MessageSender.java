package com.shadowshiftstudio.compressionservice.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.shadowshiftstudio.compressionservice.config.RabbitMQConfig;
import com.shadowshiftstudio.compressionservice.dto.message.ImageMessage;

@Service
public class MessageSender {

    private static final Logger logger = LoggerFactory.getLogger(MessageSender.class);
    
    private final RabbitTemplate rabbitTemplate;
    
    @Autowired
    public MessageSender(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }
    
    /**
     * Sends a message to the image storage service
     * 
     * @param message the message to send
     */
    public void sendToStorage(ImageMessage message) {
        logger.info("Sending message to storage service: {}, action: {}", 
                message.getMessageId(), message.getAction());
        
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.IMAGE_EXCHANGE, 
                RabbitMQConfig.STORAGE_KEY, 
                message);
    }
}