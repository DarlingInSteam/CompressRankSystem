package shadowshift.studio.imagestorage.mapper.manga;

import org.springframework.stereotype.Component;
import shadowshift.studio.imagestorage.entity.manga.PageEntity;
import shadowshift.studio.imagestorage.model.manga.Page;

@Component
public class PageMapper {
    
    /**
     * Convert entity to model (DTO)
     * 
     * @param entity PageEntity
     * @return Page model
     */
    public Page toModel(PageEntity entity) {
        if (entity == null) {
            return null;
        }
        
        Page model = new Page();
        model.setId(entity.getId());
        model.setPageNumber(entity.getPageNumber());
        model.setImageId(entity.getImageId());
        model.setCreatedAt(entity.getCreatedAt());
        model.setUpdatedAt(entity.getUpdatedAt());
        model.setViewCount(entity.getViewCount());
        
        // Set chapter ID from parent entity
        if (entity.getChapter() != null) {
            model.setChapterId(entity.getChapter().getId());
        }
        
        return model;
    }
    
    /**
     * Convert model (DTO) to entity
     * 
     * @param model Page model
     * @param entity existing PageEntity (if updating) or null (if creating)
     * @return PageEntity
     */
    public PageEntity toEntity(Page model, PageEntity entity) {
        if (model == null) {
            return null;
        }
        
        PageEntity result = entity != null ? entity : new PageEntity();
        
        if (model.getPageNumber() > 0) {
            result.setPageNumber(model.getPageNumber());
        }
        
        if (model.getImageId() != null) {
            result.setImageId(model.getImageId());
        }
        
        result.setViewCount(model.getViewCount());
        
        return result;
    }
    
    /**
     * Convert model (DTO) to a new entity instance
     * 
     * @param model Page model
     * @return new PageEntity
     */
    public PageEntity toEntity(Page model) {
        return toEntity(model, null);
    }
}