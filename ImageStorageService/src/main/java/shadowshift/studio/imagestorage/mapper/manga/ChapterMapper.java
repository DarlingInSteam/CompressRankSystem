package shadowshift.studio.imagestorage.mapper.manga;

import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import shadowshift.studio.imagestorage.entity.manga.ChapterEntity;
import shadowshift.studio.imagestorage.model.manga.Chapter;

@Component
public class ChapterMapper {
    
    private PageMapper pageMapper;
    
    public ChapterMapper(@Lazy PageMapper pageMapper) {
        this.pageMapper = pageMapper;
    }
    
    /**
     * Convert entity to model (DTO)
     * 
     * @param entity ChapterEntity
     * @param includePages whether to include pages in the conversion
     * @return Chapter model
     */
    public Chapter toModel(ChapterEntity entity, boolean includePages) {
        if (entity == null) {
            return null;
        }
        
        Chapter model = new Chapter();
        model.setId(entity.getId());
        model.setChapterNumber(entity.getChapterNumber());
        model.setTitle(entity.getTitle());
        model.setDescription(entity.getDescription());
        model.setCreatedAt(entity.getCreatedAt());
        model.setUpdatedAt(entity.getUpdatedAt());
        model.setPublished(entity.isPublished());
        model.setViewCount(entity.getViewCount());
        
        // Set volume ID from parent entity
        if (entity.getVolume() != null) {
            model.setVolumeId(entity.getVolume().getId());
        }
        
        // Include pages if requested
        if (includePages && entity.getPages() != null) {
            entity.getPages().forEach(page -> 
                model.getPages().add(pageMapper.toModel(page))
            );
        }
        
        return model;
    }
    
    /**
     * Convert entity to model (DTO) without including pages
     * 
     * @param entity ChapterEntity
     * @return Chapter model
     */
    public Chapter toModel(ChapterEntity entity) {
        return toModel(entity, false);
    }
    
    /**
     * Convert model (DTO) to entity
     * 
     * @param model Chapter model
     * @param entity existing ChapterEntity (if updating) or null (if creating)
     * @return ChapterEntity
     */
    public ChapterEntity toEntity(Chapter model, ChapterEntity entity) {
        if (model == null) {
            return null;
        }
        
        ChapterEntity result = entity != null ? entity : new ChapterEntity();
        
        if (model.getChapterNumber() > 0) {
            result.setChapterNumber(model.getChapterNumber());
        }
        
        if (model.getTitle() != null) {
            result.setTitle(model.getTitle());
        }
        
        if (model.getDescription() != null) {
            result.setDescription(model.getDescription());
        }
        
        result.setPublished(model.isPublished());
        result.setViewCount(model.getViewCount());
        
        return result;
    }
    
    /**
     * Convert model (DTO) to a new entity instance
     * 
     * @param model Chapter model
     * @return new ChapterEntity
     */
    public ChapterEntity toEntity(Chapter model) {
        return toEntity(model, null);
    }
}