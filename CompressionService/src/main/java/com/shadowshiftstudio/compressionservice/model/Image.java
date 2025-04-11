package com.shadowshiftstudio.compressionservice.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class Image {
    
    private String id;
    private String originalFilename;
    private String contentType;
    private String objectName;
    private long size;
    private int compressionLevel;
    private String originalImageId;
    private LocalDateTime uploadedAt;
    private LocalDateTime lastAccessed;
    private int accessCount;

    public Image(String originalFilename, String contentType, long size) {
        this.id = UUID.randomUUID().toString();
        this.originalFilename = originalFilename;
        this.contentType = contentType;
        this.size = size;
        this.compressionLevel = 0;
        this.uploadedAt = LocalDateTime.now();
        this.lastAccessed = this.uploadedAt;
        this.accessCount = 0;
        this.objectName = id + "_" + originalFilename.replaceAll("\\s+", "_");
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getObjectName() {
        return objectName;
    }

    public void setObjectName(String objectName) {
        this.objectName = objectName;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    public int getCompressionLevel() {
        return compressionLevel;
    }

    public void setCompressionLevel(int compressionLevel) {
        this.compressionLevel = compressionLevel;
    }

    public String getOriginalImageId() {
        return originalImageId;
    }

    public void setOriginalImageId(String originalImageId) {
        this.originalImageId = originalImageId;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public LocalDateTime getLastAccessed() {
        return lastAccessed;
    }

    public void setLastAccessed(LocalDateTime lastAccessed) {
        this.lastAccessed = lastAccessed;
    }

    public int getAccessCount() {
        return accessCount;
    }

    public void setAccessCount(int accessCount) {
        this.accessCount = accessCount;
    }

    public void incrementAccessCount() {
        this.accessCount++;
        this.lastAccessed = LocalDateTime.now();
    }
}