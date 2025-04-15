package shadowshift.studio.imagestorage.mapper;

import org.springframework.stereotype.Component;
import shadowshift.studio.imagestorage.entity.ImageEntity;
import shadowshift.studio.imagestorage.model.Image;

@Component
public class ImageMapper {
    
    public Image toModel(ImageEntity entity) {
        if (entity == null) {
            return null;
        }
        
        Image model = new Image();
        model.setId(entity.getId());
        model.setOriginalFilename(entity.getOriginalFilename());
        model.setContentType(entity.getContentType());
        model.setObjectName(entity.getObjectName());
        model.setSize(entity.getSize());
        model.setCompressionLevel(entity.getCompressionLevel());
        model.setOriginalImageId(entity.getOriginalImageId());
        model.setUploadedAt(entity.getUploadedAt());
        model.setLastAccessed(entity.getLastAccessed());
        model.setAccessCount(entity.getAccessCount());
        
        return model;
    }
    
    public ImageEntity toEntity(Image model) {
        if (model == null) {
            return null;
        }
        
        ImageEntity entity = new ImageEntity();
        entity.setId(model.getId());
        entity.setOriginalFilename(model.getOriginalFilename());
        entity.setContentType(model.getContentType());
        entity.setObjectName(model.getObjectName());
        entity.setSize(model.getSize());
        entity.setCompressionLevel(model.getCompressionLevel());
        entity.setOriginalImageId(model.getOriginalImageId());
        entity.setUploadedAt(model.getUploadedAt());
        entity.setLastAccessed(model.getLastAccessed());
        entity.setAccessCount(model.getAccessCount());
        
        return entity;
    }
}