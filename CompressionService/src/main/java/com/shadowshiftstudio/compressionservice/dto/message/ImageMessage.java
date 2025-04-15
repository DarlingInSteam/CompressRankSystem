package com.shadowshiftstudio.compressionservice.dto.message;

import java.io.Serializable;
import java.util.UUID;

public class ImageMessage implements Serializable {
    private String messageId;
    private String imageId;
    private String action;
    private String timestamp;
    
    public ImageMessage() {
        this.messageId = UUID.randomUUID().toString();
        this.timestamp = String.valueOf(System.currentTimeMillis());
    }
    
    public String getMessageId() {
        return messageId;
    }
    
    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }
    
    public String getImageId() {
        return imageId;
    }
    
    public void setImageId(String imageId) {
        this.imageId = imageId;
    }
    
    public String getAction() {
        return action;
    }
    
    public void setAction(String action) {
        this.action = action;
    }
    
    public String getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}