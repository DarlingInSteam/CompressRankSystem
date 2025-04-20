package shadowshift.studio.imagestorage.mapper.manga;

import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import shadowshift.studio.imagestorage.entity.manga.MangaEntity;
import shadowshift.studio.imagestorage.model.manga.Manga;

@Component
public class MangaMapper {
    
    private VolumeMapper volumeMapper;
    
    public MangaMapper(@Lazy VolumeMapper volumeMapper) {
        this.volumeMapper = volumeMapper;
    }
    
    /**
     * Convert entity to model (DTO)
     * 
     * @param entity MangaEntity
     * @param includeVolumes whether to include volumes in the conversion
     * @return Manga model
     */
    public Manga toModel(MangaEntity entity, boolean includeVolumes) {
        if (entity == null) {
            return null;
        }
        
        Manga model = new Manga();
        model.setId(entity.getId());
        model.setTitle(entity.getTitle());
        model.setDescription(entity.getDescription());
        model.setAuthor(entity.getAuthor());
        model.setArtist(entity.getArtist());
        model.setPreviewImageId(entity.getPreviewImageId());
        model.setCreatedAt(entity.getCreatedAt());
        model.setUpdatedAt(entity.getUpdatedAt());
        model.setUserId(entity.getUserId());
        model.setPublished(entity.isPublished());
        model.setStatus(entity.getStatus());
        model.setGenres(entity.getGenres());
        model.setViewCount(entity.getViewCount());
        
        // Include volumes if requested
        if (includeVolumes && entity.getVolumes() != null) {
            entity.getVolumes().forEach(volume -> 
                model.getVolumes().add(volumeMapper.toModel(volume, false))
            );
        }
        
        return model;
    }
    
    /**
     * Convert entity to model (DTO) without including volumes
     * 
     * @param entity MangaEntity
     * @return Manga model
     */
    public Manga toModel(MangaEntity entity) {
        return toModel(entity, false);
    }
    
    /**
     * Convert model (DTO) to entity
     * 
     * @param model Manga model
     * @param entity existing MangaEntity (if updating) or null (if creating)
     * @return MangaEntity
     */
    public MangaEntity toEntity(Manga model, MangaEntity entity) {
        if (model == null) {
            return null;
        }
        
        MangaEntity result = entity != null ? entity : new MangaEntity();
        
        if (model.getTitle() != null) {
            result.setTitle(model.getTitle());
        }
        
        if (model.getDescription() != null) {
            result.setDescription(model.getDescription());
        }
        
        if (model.getAuthor() != null) {
            result.setAuthor(model.getAuthor());
        }
        
        if (model.getArtist() != null) {
            result.setArtist(model.getArtist());
        }
        
        if (model.getPreviewImageId() != null) {
            result.setPreviewImageId(model.getPreviewImageId());
        }
        
        if (model.getUserId() != null) {
            result.setUserId(model.getUserId());
        }
        
        result.setPublished(model.isPublished());
        
        if (model.getStatus() != null) {
            result.setStatus(model.getStatus());
        }
        
        if (model.getGenres() != null) {
            result.setGenres(model.getGenres());
        }
        
        result.setViewCount(model.getViewCount());
        
        return result;
    }
    
    /**
     * Convert model (DTO) to a new entity instance
     * 
     * @param model Manga model
     * @return new MangaEntity
     */
    public MangaEntity toEntity(Manga model) {
        return toEntity(model, null);
    }
}