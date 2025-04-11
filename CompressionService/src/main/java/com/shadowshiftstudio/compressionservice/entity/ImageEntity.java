package com.shadowshiftstudio.compressionservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "images")
public class ImageEntity {
    
    @Id
    private String id;
    
    @Column(nullable = false)
    private String originalFilename;
    
    @Column(nullable = false)
    private String contentType;
    
    @Column(nullable = false)
    private String objectName;
    
    @Column(nullable = false)
    private long size;
    
    @Column(nullable = false)
    private int compressionLevel;
    
    @Column
    private String originalImageId;
    
    @Column(nullable = false)
    private LocalDateTime uploadedAt;
    
    @Column(nullable = false)
    private LocalDateTime lastAccessed;
    
    @Column(nullable = false)
    private int accessCount;
    
    public ImageEntity() {
    }
    
    public ImageEntity(String id, String originalFilename, String contentType, String objectName,
                      long size, int compressionLevel, String originalImageId,
                      LocalDateTime uploadedAt, LocalDateTime lastAccessed, int accessCount) {
        this.id = id;
        this.originalFilename = originalFilename;
        this.contentType = contentType;
        this.objectName = objectName;
        this.size = size;
        this.compressionLevel = compressionLevel;
        this.originalImageId = originalImageId;
        this.uploadedAt = uploadedAt;
        this.lastAccessed = lastAccessed;
        this.accessCount = accessCount;
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