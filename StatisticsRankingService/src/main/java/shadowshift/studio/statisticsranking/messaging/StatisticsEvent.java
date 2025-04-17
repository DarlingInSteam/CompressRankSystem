package shadowshift.studio.statisticsranking.messaging;

import java.io.Serializable;
import java.time.LocalDateTime;

public class StatisticsEvent implements Serializable {

    public enum EventType {
        VIEW,
        DOWNLOAD
    }
    
    private String imageId;
    private EventType eventType;
    private LocalDateTime timestamp;
    
    public StatisticsEvent() {
        this.timestamp = LocalDateTime.now();
    }
    
    public StatisticsEvent(String imageId, EventType eventType) {
        this.imageId = imageId;
        this.eventType = eventType;
        this.timestamp = LocalDateTime.now();
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

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}