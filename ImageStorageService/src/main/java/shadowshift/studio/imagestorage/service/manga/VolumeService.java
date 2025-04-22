package shadowshift.studio.imagestorage.service.manga;

import shadowshift.studio.imagestorage.model.manga.Volume;
import java.util.List;

/**
 * Service for managing manga volumes
 */
public interface VolumeService {
    
    /**
     * Create a new volume for a manga
     * 
     * @param mangaId manga ID
     * @param volume volume data to create
     * @return created volume
     */
    Volume createVolume(String mangaId, Volume volume);
    
    /**
     * Update an existing volume
     * 
     * @param id volume ID
     * @param volume volume data to update
     * @return updated volume
     */
    Volume updateVolume(String id, Volume volume);
    
    /**
     * Get a volume by ID
     * 
     * @param id volume ID
     * @param includeChapters whether to include chapters in the response
     * @return volume data, or null if not found
     */
    Volume getVolume(String id, boolean includeChapters);
    
    /**
     * Get all volumes for a manga
     * 
     * @param mangaId manga ID
     * @return list of volumes
     */
    List<Volume> getVolumesByMangaId(String mangaId);
    
    /**
     * Delete a volume
     * 
     * @param id volume ID
     * @return true if deleted, false if not found
     */
    boolean deleteVolume(String id);
    
    /**
     * Set volume cover image
     * 
     * @param id volume ID
     * @param imageId image ID to use as cover
     * @return updated volume
     */
    Volume setVolumeCoverImage(String id, String imageId);
    
    /**
     * Increment view count for a volume
     * 
     * @param id volume ID
     */
    void incrementViewCount(String id);
}