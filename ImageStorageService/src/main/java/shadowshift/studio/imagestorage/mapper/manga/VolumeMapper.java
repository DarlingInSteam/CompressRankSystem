package shadowshift.studio.imagestorage.mapper.manga;

import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import shadowshift.studio.imagestorage.entity.manga.VolumeEntity;
import shadowshift.studio.imagestorage.model.manga.Volume;

@Component
public class VolumeMapper {
    
    private ChapterMapper chapterMapper;
    
    public VolumeMapper(@Lazy ChapterMapper chapterMapper) {
        this.chapterMapper = chapterMapper;
    }
    
    /**
     * Convert entity to model (DTO)
     * 
     * @param entity VolumeEntity
     * @param includeChapters whether to include chapters in the conversion
     * @return Volume model
     */
    public Volume toModel(VolumeEntity entity, boolean includeChapters) {
        if (entity == null) {
            return null;
        }
        
        Volume model = new Volume();
        model.setId(entity.getId());
        model.setVolumeNumber(entity.getVolumeNumber());
        model.setTitle(entity.getTitle());
        model.setCoverImageId(entity.getCoverImageId());
        model.setCreatedAt(entity.getCreatedAt());
        model.setUpdatedAt(entity.getUpdatedAt());
        model.setPublished(entity.isPublished());
        model.setViewCount(entity.getViewCount());
        
        // Set manga ID from parent entity
        if (entity.getManga() != null) {
            model.setMangaId(entity.getManga().getId());
        }
        
        // Include chapters if requested
        if (includeChapters && entity.getChapters() != null) {
            entity.getChapters().forEach(chapter -> 
                model.getChapters().add(chapterMapper.toModel(chapter, false))
            );
        }
        
        return model;
    }
    
    /**
     * Convert entity to model (DTO) without including chapters
     * 
     * @param entity VolumeEntity
     * @return Volume model
     */
    public Volume toModel(VolumeEntity entity) {
        return toModel(entity, false);
    }
    
    /**
     * Convert model (DTO) to entity
     * 
     * @param model Volume model
     * @param entity existing VolumeEntity (if updating) or null (if creating)
     * @return VolumeEntity
     */
    public VolumeEntity toEntity(Volume model, VolumeEntity entity) {
        if (model == null) {
            return null;
        }
        
        VolumeEntity result = entity != null ? entity : new VolumeEntity();
        
        if (model.getVolumeNumber() > 0) {
            result.setVolumeNumber(model.getVolumeNumber());
        }
        
        if (model.getTitle() != null) {
            result.setTitle(model.getTitle());
        }
        
        if (model.getCoverImageId() != null) {
            result.setCoverImageId(model.getCoverImageId());
        }
        
        result.setPublished(model.isPublished());
        result.setViewCount(model.getViewCount());
        
        return result;
    }
    
    /**
     * Convert model (DTO) to a new entity instance
     * 
     * @param model Volume model
     * @return new VolumeEntity
     */
    public VolumeEntity toEntity(Volume model) {
        return toEntity(model, null);
    }
}