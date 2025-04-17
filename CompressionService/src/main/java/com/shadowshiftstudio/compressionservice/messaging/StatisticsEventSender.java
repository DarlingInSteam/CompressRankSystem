package com.shadowshiftstudio.compressionservice.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Компонент для отправки событий статистики в RabbitMQ
 */
@Component
public class StatisticsEventSender {

    private static final Logger logger = LoggerFactory.getLogger(StatisticsEventSender.class);

    @Value("${exchange.image.statistics}")
    private String exchange;

    @Value("${routing.key.image.statistics}")
    private String routingKey;

    private final RabbitTemplate rabbitTemplate;

    @Autowired
    public StatisticsEventSender(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Отправляет событие просмотра изображения
     * @param imageId идентификатор изображения
     */
    public void sendViewEvent(String imageId) {
        try {
            StatisticsEvent event = new StatisticsEvent(imageId, StatisticsEvent.EventType.VIEW);
            logger.debug("Sending view event for image ID: {}", imageId);
            rabbitTemplate.convertAndSend(exchange, routingKey, event);
        } catch (Exception e) {
            logger.error("Error sending view event: {}", e.getMessage(), e);
        }
    }

    /**
     * Отправляет событие скачивания изображения
     * @param imageId идентификатор изображения
     */
    public void sendDownloadEvent(String imageId) {
        try {
            StatisticsEvent event = new StatisticsEvent(imageId, StatisticsEvent.EventType.DOWNLOAD);
            logger.debug("Sending download event for image ID: {}", imageId);
            rabbitTemplate.convertAndSend(exchange, routingKey, event);
        } catch (Exception e) {
            logger.error("Error sending download event: {}", e.getMessage(), e);
        }
    }
}