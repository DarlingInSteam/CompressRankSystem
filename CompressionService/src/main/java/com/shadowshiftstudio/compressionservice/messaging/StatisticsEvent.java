package com.shadowshiftstudio.compressionservice.messaging;

import java.io.Serializable;

/**
 * Событие статистики для отправки в очередь RabbitMQ
 */
public class StatisticsEvent implements Serializable {
    
    private String imageId;
    private EventType eventType;
    
    public enum EventType {
        VIEW,
        DOWNLOAD
    }
    
    public StatisticsEvent() {
        // Default constructor for deserialization
    }
    
    public StatisticsEvent(String imageId, EventType eventType) {
        this.imageId = imageId;
        this.eventType = eventType;
    }
    
    public String getImageId() {
        return imageId;
    }
    
    public void setImageId(String imageId) {
        this.imageId = imageId;
    }
    
    public EventType getEventType() {
        return eventType;
    }
    
    public void setEventType(EventType eventType) {
        this.eventType = eventType;
    }
}