package com.shadowshiftstudio.compressionservice.mapper;

import com.shadowshiftstudio.compressionservice.entity.ImageEntity;
import com.shadowshiftstudio.compressionservice.model.Image;
import org.springframework.stereotype.Component;

@Component
public class ImageMapper {

    public ImageEntity toEntity(Image image) {
        if (image == null) {
            return null;
        }
        
        return new ImageEntity(
            image.getId(),
            image.getOriginalFilename(),
            image.getContentType(),
            image.getObjectName(),
            image.getSize(),
            image.getCompressionLevel(),
            image.getOriginalImageId(),
            image.getUploadedAt(),
            image.getLastAccessed(),
            image.getAccessCount()
        );
    }
    
    public Image toModel(ImageEntity entity) {
        if (entity == null) {
            return null;
        }
        
        Image image = new Image(entity.getOriginalFilename(), entity.getContentType(), entity.getSize());
        
        image.setId(entity.getId());
        image.setObjectName(entity.getObjectName());
        image.setCompressionLevel(entity.getCompressionLevel());
        image.setOriginalImageId(entity.getOriginalImageId());
        image.setUploadedAt(entity.getUploadedAt());
        image.setLastAccessed(entity.getLastAccessed());
        image.setAccessCount(entity.getAccessCount());
        
        return image;
    }
}